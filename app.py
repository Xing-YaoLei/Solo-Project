import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import date, timedelta
import os

from src.data.database import DatabaseManager
from src.data.storage import MinIOStorage
from src.analysis.conflict_detector import ConflictDetector
from src.analysis.attendance_analyzer import AttendanceAnalyzer
from src.utils.mock_data import MockDataGenerator


st.set_page_config(
    page_title="长租公寓保洁排班风险监测",
    page_icon="🧹",
    layout="wide",
    initial_sidebar_state="expanded",
)


SEVERITY_COLORS = {
    "high": "#FF4B4B",
    "medium": "#FFA500",
    "low": "#FFD700",
    "none": "#2ECC71",
}


@st.cache_resource
def init_database():
    db = DatabaseManager()
    return db


@st.cache_resource
def init_storage():
    endpoint = os.environ.get("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
    return MinIOStorage(endpoint=endpoint, access_key=access_key, secret_key=secret_key)


def init_mock_data(db, start_date, end_date):
    tables = db.get_table_names()
    if not tables or "crm_schedules" not in tables:
        generator = MockDataGenerator()
        counts = generator.populate_database(db, start_date, end_date)
        return counts
    count_result = db.query("SELECT COUNT(*) as cnt FROM crm_schedules")
    if len(count_result) > 0 and count_result.row(0)[0] == 0:
        generator = MockDataGenerator()
        counts = generator.populate_database(db, start_date, end_date)
        return counts
    return None


def sidebar_controls():
    with st.sidebar:
        st.title("🧹 保洁排班监测")
        st.divider()

        today = date.today()
        default_start = today - timedelta(days=30)
        default_end = today

        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("开始日期", value=default_start)
        with col2:
            end_date = st.date_input("结束日期", value=default_end)

        st.divider()

        status_filter = st.multiselect(
            "到场状态筛选",
            options=["arrived", "late", "no_show", "abnormal"],
            format_func=lambda x: {
                "arrived": "正常到场",
                "late": "迟到",
                "no_show": "未到场",
                "abnormal": "异常",
            }.get(x, x),
            default=["arrived", "late", "no_show", "abnormal"],
        )

        st.divider()

        reschedule_filter = st.multiselect(
            "改约状态筛选",
            options=["completed", "pending", "cancelled"],
            format_func=lambda x: {
                "completed": "已完成",
                "pending": "待处理",
                "cancelled": "已取消",
            }.get(x, x),
            default=["completed", "pending", "cancelled"],
        )

        st.divider()

        severity_filter = st.multiselect(
            "严重程度筛选",
            options=["high", "medium", "low"],
            format_func=lambda x: {
                "high": "🔴 高",
                "medium": "🟠 中",
                "low": "🟡 低",
            }.get(x, x),
            default=["high", "medium", "low"],
        )

        st.divider()

        if st.button("🔄 重新生成模拟数据", type="secondary"):
            db = init_database()
            db.con.execute("DROP TABLE IF EXISTS meter_readings")
            db.con.execute("DROP TABLE IF EXISTS e_contracts")
            db.con.execute("DROP TABLE IF EXISTS crm_schedules")
            db.con.execute("DROP TABLE IF EXISTS reschedule_records")
            db.con.execute("DROP TABLE IF EXISTS attendance_records")
            db.con.execute("DROP TABLE IF EXISTS conflict_records")
            db.con.execute("DROP TABLE IF EXISTS alert_list")
            db._init_tables()
            generator = MockDataGenerator(seed=42)
            generator.populate_database(db, start_date, end_date)
            st.success("模拟数据已重新生成！")
            st.rerun()

        st.divider()
        st.caption("数据层: DuckDB + Polars + MinIO")

    return start_date, end_date, status_filter, reschedule_filter, severity_filter


def render_overview(db, start_date, end_date):
    st.header("📊 总览仪表盘")
    st.markdown("---")

    detector = ConflictDetector(db)
    analyzer = AttendanceAnalyzer(db)

    summary = detector.get_conflict_summary(start_date, end_date)
    attendance_stats = analyzer._get_period_rate(start_date, end_date)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="📅 总排班数",
            value=attendance_stats["total"],
        )

    with col2:
        rate = attendance_stats["rate"]
        delta_str = f"{rate}%"
        st.metric(
            label="✅ 到场率",
            value=f"{rate}%",
        )

    with col3:
        high_count = summary["total_high_severity"]
        st.metric(
            label="🔴 高风险冲突",
            value=high_count,
            delta=f"待处理",
            delta_color="inverse",
        )

    with col4:
        total_conflicts = (
            summary["time_slot_count"]
            + summary["crm_contract_diff_count"]
            + summary["data_gap_count"]
        )
        st.metric(
            label="⚠️ 冲突总数",
            value=total_conflicts,
        )

    st.markdown("---")

    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("冲突类型分布")
        conflict_data = {
            "冲突类型": ["时段冲突", "CRM/合同口径差异", "改约记录", "到场异常", "数据缺口"],
            "数量": [
                summary["time_slot_count"],
                summary["crm_contract_diff_count"],
                summary["reschedule_count"],
                summary["attendance_anomaly_count"],
                summary["data_gap_count"],
            ],
            "严重程度": ["high", "high", "medium", "high", "medium"],
        }
        df_conflicts = pl.DataFrame(conflict_data)
        fig = px.bar(
            df_conflicts.to_pandas(),
            x="冲突类型",
            y="数量",
            color="严重程度",
            color_discrete_map=SEVERITY_COLORS,
            title="各类冲突数量统计",
        )
        st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.subheader("每日到场率趋势")
        daily = analyzer.get_daily_attendance_rate(start_date, end_date)
        if len(daily) > 0:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=daily["scheduled_date"].to_list(),
                y=daily["attendance_rate"].to_list(),
                mode="lines+markers",
                name="到场率",
                line=dict(color="#2ECC71", width=2),
            ))
            fig.add_trace(go.Scatter(
                x=daily["scheduled_date"].to_list(),
                y=daily["on_site_rate"].to_list(),
                mode="lines+markers",
                name="到场率(含迟到)",
                line=dict(color="#3498DB", width=2),
            ))
            fig.update_layout(
                title="每日到场率趋势",
                yaxis_title="百分比 (%)",
                yaxis_range=[0, 100],
                hovermode="x unified",
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无到场数据")

    st.markdown("---")
    st.subheader("📋 冲突检测总览")

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        f"🕐 时段冲突 ({summary['time_slot_count']})",
        f"📑 CRM/合同口径差异 ({summary['crm_contract_diff_count']})",
        f"🔄 改约记录 ({summary['reschedule_count']})",
        f"❌ 到场异常 ({summary['attendance_anomaly_count']})",
        f"🔲 数据缺口 ({summary['data_gap_count']})",
    ])

    with tab1:
        time_conflicts = detector.detect_time_slot_conflicts(start_date, end_date)
        if len(time_conflicts) > 0:
            st.dataframe(
                time_conflicts.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.info(f"💡 共发现 {len(time_conflicts)} 个时段冲突，主要影响同一公寓内同时段的不同房间")
        else:
            st.success("✅ 未发现时段冲突")

    with tab2:
        crm_diff = detector.detect_crm_contract_diff(start_date, end_date)
        if len(crm_diff) > 0:
            st.dataframe(
                crm_diff.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.warning("⚠️ CRM排班与电子合同约定存在差异，请核对以上明细")
        else:
            st.success("✅ CRM排班与电子合同口径一致")

    with tab3:
        reschedule = detector.detect_reschedule_conflicts(start_date, end_date)
        if len(reschedule) > 0:
            st.dataframe(
                reschedule.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
        else:
            st.info("暂无改约记录")

    with tab4:
        attendance = detector.detect_attendance_anomalies(start_date, end_date)
        if len(attendance) > 0:
            st.dataframe(
                attendance.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
        else:
            st.success("✅ 未发现到场异常")

    with tab5:
        data_gaps = detector.detect_data_gaps(start_date, end_date)
        if len(data_gaps) > 0:
            st.dataframe(
                data_gaps.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.warning("⚠️ 改约记录存在数据缺口，可能影响统计准确性")
        else:
            st.success("✅ 数据完整，无缺口")


def render_reschedule_attendance(db, start_date, end_date, status_filter, reschedule_filter):
    st.header("🔄 改约记录与到场状态联动")
    st.markdown("---")

    analyzer = AttendanceAnalyzer(db)
    impact_data = analyzer.get_reschedule_impact(start_date, end_date)

    if len(impact_data) == 0:
        st.info("暂无改约记录数据")
        return

    filtered = impact_data
    if status_filter:
        filtered = filtered.filter(pl.col("attendance_status").is_in(status_filter))
    if reschedule_filter:
        filtered = filtered.filter(pl.col("reschedule_status").is_in(reschedule_filter))

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("改约记录总数", len(impact_data))
    with col2:
        data_gap_count = len(impact_data.filter(pl.col("has_data_gap")))
        st.metric("🔲 数据缺口数", data_gap_count)
    with col3:
        linked = filtered.filter(pl.col("attendance_status").is_not_null())
        st.metric("已关联到场记录", len(linked))

    st.markdown("---")

    st.subheader("📈 改约后到场状态分布")
    status_counts = (
        filtered.group_by("attendance_status")
        .agg(pl.count().alias("count"))
        .to_pandas()
    )
    status_labels = {
        "arrived": "正常到场",
        "late": "迟到",
        "no_show": "未到场",
        "abnormal": "异常",
    }
    status_counts["status_label"] = status_counts["attendance_status"].map(
        lambda x: status_labels.get(x, "未知")
    )

    fig = px.pie(
        status_counts,
        values="count",
        names="status_label",
        color="status_label",
        color_discrete_map={
            "正常到场": "#2ECC71",
            "迟到": "#FFA500",
            "未到场": "#FF4B4B",
            "异常": "#9B59B6",
        },
        title="改约后到场状态占比",
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    st.subheader("📋 改约记录明细（联动筛选）")

    display_df = filtered.with_columns([
        pl.col("has_data_gap").map_elements(
            lambda x: "🔴 有缺口" if x else "✅ 完整", return_dtype=str
        ).alias("数据质量"),
    ]).select([
        "apartment_id", "room_id", "schedule_date", "new_time_slot",
        "reason", "reschedule_status", "attendance_status", "数据质量"
    ])

    st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "apartment_id": "公寓",
            "room_id": "房间",
            "schedule_date": "改约后日期",
            "new_time_slot": "改约后时段",
            "reason": "改约原因",
            "reschedule_status": "改约状态",
            "attendance_status": "到场状态",
        }
    )

    st.caption("💡 使用左侧边栏的筛选条件联动过滤改约记录和到场状态")


def render_alert_list(db, start_date, end_date, severity_filter):
    st.header("🔔 提醒名单")
    st.markdown("---")

    detector = ConflictDetector(db)
    alerts = detector.generate_alert_list(start_date, end_date)

    if len(alerts) == 0:
        st.success("✅ 暂无异常提醒")
        return

    if severity_filter:
        alerts = alerts.filter(pl.col("severity").is_in(severity_filter))

    col1, col2, col3 = st.columns(3)
    with col1:
        high_count = len(alerts.filter(pl.col("severity") == "high"))
        st.metric("🔴 高风险", high_count)
    with col2:
        med_count = len(alerts.filter(pl.col("severity") == "medium"))
        st.metric("🟠 中风险", med_count)
    with col3:
        low_count = len(alerts.filter(pl.col("severity") == "low"))
        st.metric("🟡 低风险", low_count)

    st.markdown("---")

    st.subheader("📋 异常提醒明细")

    alert_type_labels = {
        "attendance": "到场异常",
        "conflict": "时段冲突",
        "quality": "质量问题",
        "safety": "安全隐患",
    }

    display_alerts = alerts.with_columns([
        pl.col("severity").map_elements(
            lambda x: {"high": "🔴 高", "medium": "🟠 中", "low": "🟡 低"}.get(x, x),
            return_dtype=str
        ).alias("严重程度"),
        pl.col("alert_type").map_elements(
            lambda x: alert_type_labels.get(x, x),
            return_dtype=str
        ).alias("提醒类型"),
        pl.col("is_resolved").map_elements(
            lambda x: "✅ 已解决" if x else "⏳ 待处理",
            return_dtype=str
        ).alias("状态"),
    ]).select([
        "严重程度", "提醒类型", "apartment_id", "room_id",
        "alert_date", "description", "状态"
    ])

    st.dataframe(
        display_alerts.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "apartment_id": "公寓",
            "room_id": "房间",
            "alert_date": "提醒日期",
            "description": "异常描述",
        }
    )

    st.info("💡 提醒名单用于解释图表中的异常点，点击可查看详细信息")


def render_attendance_review(db, start_date, end_date):
    st.header("📈 到场率复盘")
    st.markdown("---")

    analyzer = AttendanceAnalyzer(db)

    period_days = (end_date - start_date).days
    mid_date = start_date + timedelta(days=period_days // 2)

    comparison = analyzer.compare_periods(
        start_date, mid_date,
        mid_date + timedelta(days=1), end_date
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "前期到场率",
            f"{comparison['previous_period']['attendance_rate']}%",
            help=f"{comparison['previous_period']['start']} ~ {comparison['previous_period']['end']}",
        )

    with col2:
        st.metric(
            "后期到场率",
            f"{comparison['current_period']['attendance_rate']}%",
            help=f"{comparison['current_period']['start']} ~ {comparison['current_period']['end']}",
        )

    with col3:
        improvement = comparison["improvement"]
        delta_color = "normal" if improvement["is_improved"] else "inverse"
        st.metric(
            "改善情况",
            f"{improvement['absolute_diff']:+.2f}%",
            delta=f"{improvement['relative_diff']:+.2f}%",
            delta_color=delta_color,
            help="相对变化百分比",
        )

    st.markdown("---")

    daily = analyzer.get_daily_attendance_rate(start_date, end_date)

    if len(daily) > 0:
        st.subheader("📊 到场率趋势与异常点")

        daily_pd = daily.to_pandas()
        daily_pd["is_anomaly"] = daily_pd["attendance_rate"] < 70

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=daily_pd["scheduled_date"],
            y=daily_pd["attendance_rate"],
            mode="lines",
            name="到场率",
            line=dict(color="#3498DB", width=2),
        ))

        anomaly_data = daily_pd[daily_pd["is_anomaly"]]
        if len(anomaly_data) > 0:
            fig.add_trace(go.Scatter(
                x=anomaly_data["scheduled_date"],
                y=anomaly_data["attendance_rate"],
                mode="markers",
                name="异常点",
                marker=dict(color="#FF4B4B", size=12, symbol="circle"),
                text=anomaly_data.apply(
                    lambda r: f"日期: {r['scheduled_date']}<br>到场率: {r['attendance_rate']}%<br>未到场: {r['no_show_count']}人",
                    axis=1
                ),
                hoverinfo="text",
            ))

        fig.add_hline(
            y=70,
            line_dash="dash",
            line_color="#FF4B4B",
            annotation_text="警戒线 (70%)",
            annotation_position="bottom right",
        )

        fig.update_layout(
            title="每日到场率趋势（红色标记为异常点）",
            yaxis_title="到场率 (%)",
            yaxis_range=[0, 100],
            hovermode="x unified",
        )

        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    st.subheader("🏢 各公寓到场率对比")
    by_apt = analyzer.get_attendance_by_apartment(start_date, end_date)

    if len(by_apt) > 0:
        by_apt_pd = by_apt.to_pandas()
        by_apt_pd["color"] = by_apt_pd["attendance_rate"].apply(
            lambda x: "#2ECC71" if x >= 80 else ("#FFA500" if x >= 60 else "#FF4B4B")
        )

        fig = px.bar(
            by_apt_pd,
            x="apartment_id",
            y="attendance_rate",
            text="attendance_rate",
            color="apartment_id",
            color_discrete_sequence=["#3498DB"],
            title="各公寓到场率排名",
            labels={"apartment_id": "公寓", "attendance_rate": "到场率 (%)"},
        )
        fig.update_traces(texttemplate='%{text}%', textposition='outside')
        fig.update_layout(showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    st.subheader("🕐 各时段到场率分布")
    by_slot = analyzer.get_attendance_by_time_slot(start_date, end_date)

    if len(by_slot) > 0:
        fig = px.bar(
            by_slot.to_pandas(),
            x="scheduled_time_slot",
            y="attendance_rate",
            text="attendance_rate",
            color="attendance_rate",
            color_continuous_scale="RdYlGn",
            title="各时段到场率对比",
            labels={"scheduled_time_slot": "时段", "attendance_rate": "到场率 (%)"},
        )
        fig.update_traces(texttemplate='%{text}%', textposition='outside')
        st.plotly_chart(fig, use_container_width=True)


def render_data_gaps(db, start_date, end_date):
    st.header("🔲 数据缺口分析")
    st.markdown("---")

    analyzer = AttendanceAnalyzer(db)
    detector = ConflictDetector(db)

    gap_stats = analyzer.get_data_gap_stats(start_date, end_date)
    data_gaps = detector.detect_data_gaps(start_date, end_date)
    impact_data = analyzer.get_reschedule_impact(start_date, end_date)

    col1, col2, col3 = st.columns(3)
    with col1:
        total_reschedule = len(impact_data)
        st.metric("改约记录总数", total_reschedule)
    with col2:
        gap_count = sum(v for k, v in gap_stats.items() if k != "complete")
        gap_rate = round(gap_count / total_reschedule * 100, 2) if total_reschedule > 0 else 0
        st.metric("🔲 数据缺口数", gap_count, f"{gap_rate}%")
    with col3:
        complete_count = gap_stats.get("complete", 0)
        st.metric("✅ 完整记录", complete_count)

    st.markdown("---")

    st.subheader("📊 数据质量分布")

    quality_data = {
        "数据质量": ["完整记录", "缺失改约原因", "缺失操作人", "记录不完整"],
        "数量": [
            gap_stats.get("complete", 0),
            gap_stats.get("missing_reason", 0),
            gap_stats.get("missing_operator", 0),
            gap_stats.get("incomplete", 0),
        ],
        "颜色": ["#2ECC71", "#FFA500", "#FF6B6B", "#9B59B6"],
    }
    df_quality = pl.DataFrame(quality_data).to_pandas()

    fig = px.pie(
        df_quality,
        values="数量",
        names="数据质量",
        color="数据质量",
        color_discrete_map=dict(zip(df_quality["数据质量"], df_quality["颜色"])),
        title="改约记录数据质量分布",
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    st.subheader("⚠️ 数据缺口影响分析")
    st.warning(
        "数据缺口会导致统计平均值失真，以下数据点已单独染色标记，"
        "请勿让异常被平均值掩盖。"
    )

    if len(data_gaps) > 0:
        gap_by_date = (
            data_gaps.group_by("new_date")
            .agg(pl.count().alias("gap_count"))
            .sort("new_date")
        )

        daily_full = analyzer.get_daily_attendance_rate(start_date, end_date)

        if len(daily_full) > 0 and len(gap_by_date) > 0:
            daily_pd = daily_full.to_pandas()
            gap_pd = gap_by_date.to_pandas()
            gap_pd["new_date"] = gap_pd["new_date"].astype(str)

            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=daily_pd["scheduled_date"],
                y=daily_pd["total_scheduled"],
                name="总排班数",
                marker_color="#3498DB",
            ))

            gap_dates = gap_by_date["new_date"].to_list()
            gap_counts = gap_by_date["gap_count"].to_list()
            fig.add_trace(go.Bar(
                x=gap_dates,
                y=gap_counts,
                name="数据缺口数",
                marker_color="#FF4B4B",
            ))

            fig.update_layout(
                title="每日排班数与数据缺口对比（红色为缺口日）",
                barmode="overlay",
                yaxis_title="数量",
            )

            st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("📋 缺口明细")

    if len(data_gaps) > 0:
        display_gaps = data_gaps.with_columns([
            pl.col("severity").map_elements(
                lambda x: {"high": "🔴 高", "medium": "🟠 中", "low": "🟡 低"}.get(x, x),
                return_dtype=str
            ).alias("严重程度"),
        ]).select([
            "apartment_id", "room_id", "original_date", "new_date",
            "data_quality", "严重程度", "description"
        ])

        st.dataframe(
            display_gaps.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "apartment_id": "公寓",
                "room_id": "房间",
                "original_date": "原日期",
                "new_date": "新日期",
                "data_quality": "数据质量",
                "description": "缺口说明",
            }
        )
    else:
        st.success("✅ 无数据缺口")


def render_data_versions(db, storage):
    st.header("📑 数据版本管理")
    st.markdown("---")

    st.subheader("🗃️ MinIO 对象存储")

    if storage.is_available():
        st.success("✅ MinIO 连接正常")

        col1, col2 = st.columns(2)
        with col1:
            st.metric("存储桶", storage.bucket_name)
        with col2:
            objects = storage.list_objects()
            st.metric("对象总数", len(objects))

        st.markdown("---")

        st.subheader("📋 对象列表")
        if objects:
            df_objects = pl.DataFrame(objects).to_pandas()
            st.dataframe(df_objects, use_container_width=True, hide_index=True)
        else:
            st.info("存储桶为空")

        st.markdown("---")
        st.subheader("📚 抄表数据版本")
        meter_versions = storage.list_versions("meter_readings")
        if meter_versions:
            df_versions = pl.DataFrame(meter_versions).to_pandas()
            st.dataframe(df_versions, use_container_width=True, hide_index=True)
        else:
            st.info("暂无抄表版本记录")
    else:
        st.warning("⚠️ MinIO 不可用，版本管理功能降级")
        st.info("请配置 MinIO 服务以启用完整的版本管理功能")
        st.code("""
# 环境变量配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
        """, language="bash")

    st.markdown("---")
    st.subheader("📋 当前数据库表")

    tables = db.get_table_names()
    table_info = []
    for table in tables:
        count_result = db.query(f"SELECT COUNT(*) FROM {table}")
        count = count_result.row(0)[0] if len(count_result) > 0 else 0
        table_info.append({"表名": table, "记录数": count})

    df_tables = pl.DataFrame(table_info).to_pandas()
    st.dataframe(df_tables, use_container_width=True, hide_index=True)


def main():
    db = init_database()
    storage = init_storage()

    start_date, end_date, status_filter, reschedule_filter, severity_filter = sidebar_controls()

    init_mock_data(db, start_date, end_date)

    page = st.sidebar.radio(
        "导航",
        [
            "📊 总览仪表盘",
            "🔄 改约与到场联动",
            "🔔 提醒名单",
            "📈 到场率复盘",
            "🔲 数据缺口分析",
            "📑 数据版本管理",
        ],
    )

    if page == "📊 总览仪表盘":
        render_overview(db, start_date, end_date)
    elif page == "🔄 改约与到场联动":
        render_reschedule_attendance(db, start_date, end_date, status_filter, reschedule_filter)
    elif page == "🔔 提醒名单":
        render_alert_list(db, start_date, end_date, severity_filter)
    elif page == "📈 到场率复盘":
        render_attendance_review(db, start_date, end_date)
    elif page == "🔲 数据缺口分析":
        render_data_gaps(db, start_date, end_date)
    elif page == "📑 数据版本管理":
        render_data_versions(db, storage)


if __name__ == "__main__":
    main()
