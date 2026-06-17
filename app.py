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


def init_mock_data(db, storage, start_date, end_date):
    tables = db.get_table_names()
    if not tables or "crm_schedules" not in tables:
        generator = MockDataGenerator()
        counts = generator.populate_database(db, start_date, end_date, storage)
        return counts
    count_result = db.query("SELECT COUNT(*) as cnt FROM crm_schedules")
    crm_empty = len(count_result) > 0 and count_result.row(0)[0] == 0
    if crm_empty:
        generator = MockDataGenerator()
        counts = generator.populate_database(db, start_date, end_date, storage)
        return counts

    if "data_versions" in tables:
        vcount = db.query("SELECT COUNT(*) as cnt FROM data_versions").row(0)[0]
        if vcount == 0:
            meter = db.query("SELECT * FROM meter_readings")
            contracts = db.query("SELECT * FROM e_contracts")
            if len(meter) > 0:
                minio_path = ""
                if storage and storage.is_available():
                    try:
                        saved = storage.save_versioned_dataframe(meter, "meter_readings")
                        if saved:
                            minio_path = saved
                    except Exception:
                        pass
                db.save_version(
                    category="meter_readings",
                    df=meter.select([
                        "id", "apartment_id", "room_id", "reading_date",
                        "water_meter", "electric_meter", "gas_meter", "source"
                    ]),
                    description=f"补建抄表版本 - 截止 {end_date}",
                    effective_date=end_date,
                    storage_location=minio_path,
                    storage_type="duckdb_archive" + ("+minio" if minio_path else "")
                )
            if len(contracts) > 0:
                minio_path = ""
                if storage and storage.is_available():
                    try:
                        saved = storage.save_versioned_dataframe(contracts, "e_contracts")
                        if saved:
                            minio_path = saved
                    except Exception:
                        pass
                db.save_version(
                    category="e_contracts",
                    df=contracts.select([
                        "id", "contract_no", "apartment_id", "room_id",
                        "tenant_name", "start_date", "end_date",
                        "cleaning_frequency", "cleaning_weekday",
                        "cleaning_time_slot", "is_current"
                    ]),
                    description=f"补建合同版本 - 截止 {start_date}",
                    effective_date=start_date,
                    storage_location=minio_path,
                    storage_type="duckdb_archive" + ("+minio" if minio_path else "")
                )
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
            st.session_state["regenerate_data"] = True
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
        time_conflicts = detector.detect_time_slot_conflicts(start_date, end_date)

        conflict_dates = set()
        if len(time_conflicts) > 0:
            conflict_dates = set(
                d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)
                for d in time_conflicts["conflict_date"].to_list()
            )

        if len(daily) > 0:
            daily_pd = daily.to_pandas()
            daily_pd["date_str"] = daily_pd["scheduled_date"].astype(str)
            daily_pd["has_conflict"] = daily_pd["date_str"].isin(conflict_dates)

            fig = go.Figure()

            if len(conflict_dates) > 0:
                for cd in sorted(daily_pd["scheduled_date"][daily_pd["has_conflict"]]):
                    fig.add_vrect(
                        x0=cd, x1=cd,
                        fillcolor="#FF4B4B", opacity=0.15,
                        layer="below", line_width=0,
                        annotation_text="冲突",
                        annotation_position="top",
                        annotation_font_size=8,
                        annotation_font_color="#FF4B4B",
                    )

            fig.add_trace(go.Scatter(
                x=daily_pd["scheduled_date"],
                y=daily_pd["attendance_rate"],
                mode="lines+markers",
                name="到场率",
                line=dict(color="#2ECC71", width=2),
            ))
            fig.add_trace(go.Scatter(
                x=daily_pd["scheduled_date"],
                y=daily_pd["on_site_rate"],
                mode="lines+markers",
                name="到场率(含迟到)",
                line=dict(color="#3498DB", width=2),
            ))
            fig.add_hline(
                y=70,
                line_dash="dash",
                line_color="#E74C3C",
                annotation_text="警戒线 70%",
                annotation_position="bottom right",
            )
            fig.update_layout(
                title="每日到场率趋势（红底=时段冲突影响段）",
                yaxis_title="百分比 (%)",
                yaxis_range=[0, 100],
                hovermode="x unified",
                height=380,
            )
            st.plotly_chart(fig, use_container_width=True)

            if len(conflict_dates) > 0:
                st.caption(
                    f"💡 红色背景: 时段冲突影响数据段（共{daily_pd['has_conflict'].sum()}天）"
                )
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
    detector = ConflictDetector(db)

    period_days = (end_date - start_date).days
    mid_date = start_date + timedelta(days=period_days // 2)
    prev_start = start_date
    prev_end = mid_date
    curr_start = mid_date + timedelta(days=1)
    curr_end = end_date

    comparison = analyzer.compare_periods(
        prev_start, prev_end,
        curr_start, curr_end
    )
    improvement = comparison["improvement"]

    st.subheader("📋 前期/后期指标对比（按日期顺序排列）")

    summary_rows = [
        {
            "指标": "📅 日期范围",
            "前期": f"{prev_start} ~ {prev_end}",
            "后期": f"{curr_start} ~ {curr_end}",
            "改善/变化": "—",
        },
        {
            "指标": "⏱️ 天数",
            "前期": f"{(prev_end - prev_start).days + 1} 天",
            "后期": f"{(curr_end - curr_start).days + 1} 天",
            "改善/变化": "—",
        },
        {
            "指标": "📋 总排班数",
            "前期": str(comparison["previous_period"]["total"]),
            "后期": str(comparison["current_period"]["total"]),
            "改善/变化": (
                f"{comparison['current_period']['total'] - comparison['previous_period']['total']:+d}"
            ),
        },
        {
            "指标": "✅ 正常到场数",
            "前期": str(comparison["previous_period"]["arrived"]),
            "后期": str(comparison["current_period"]["arrived"]),
            "改善/变化": (
                f"{comparison['current_period']['arrived'] - comparison['previous_period']['arrived']:+d}"
            ),
        },
        {
            "指标": "🎯 到场率",
            "前期": f"{comparison['previous_period']['attendance_rate']}%",
            "后期": f"{comparison['current_period']['attendance_rate']}%",
            "改善/变化": (
                f"{improvement['absolute_diff']:+.2f}%  "
                f"({'↑ 改善' if improvement['is_improved'] else '↓ 恶化'})"
            ),
        },
        {
            "指标": "📊 相对变化",
            "前期": "—",
            "后期": "—",
            "改善/变化": f"{improvement['relative_diff']:+.2f}%",
        },
    ]

    st.table(pl.DataFrame(summary_rows).to_pandas().set_index("指标"))

    delta_color = "normal" if improvement["is_improved"] else "inverse"
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric(
            label=f"前期到场率 ({prev_start} ~ {prev_end})",
            value=f"{comparison['previous_period']['attendance_rate']}%",
        )
    with c2:
        st.metric(
            label=f"后期到场率 ({curr_start} ~ {curr_end})",
            value=f"{comparison['current_period']['attendance_rate']}%",
        )
    with c3:
        st.metric(
            label="到场率改善值",
            value=f"{improvement['absolute_diff']:+.2f}%",
            delta=f"{improvement['relative_diff']:+.2f}% (相对)",
            delta_color=delta_color,
        )

    st.markdown("---")

    daily = analyzer.get_daily_attendance_rate(start_date, end_date)
    alerts = detector.generate_alert_list(start_date, end_date)
    time_conflicts = detector.detect_time_slot_conflicts(start_date, end_date)

    conflict_dates = set()
    if len(time_conflicts) > 0:
        conflict_dates = set(
            d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)
            for d in time_conflicts["conflict_date"].to_list()
        )

    alert_dates_map = {}
    if len(alerts) > 0:
        for row in alerts.to_dicts():
            ad = str(row["alert_date"])
            if ad not in alert_dates_map:
                alert_dates_map[ad] = []
            alert_dates_map[ad].append(
                f"[{row['severity']}] {row['room_id']} - {row['description']}"
            )

    if len(daily) > 0:
        st.subheader("📊 到场率趋势（含异常点关联与时段冲突高亮）")
        st.info(
            "💡 图中说明：红色背景 = 存在时段冲突影响的数据段；"
            "红色标记点 = 到场率异常(<70%)；鼠标悬浮异常点可查看对应提醒名单解释。"
        )

        daily_pd = daily.to_pandas()
        daily_pd["date_str"] = daily_pd["scheduled_date"].astype(str)
        daily_pd["is_anomaly"] = daily_pd["attendance_rate"] < 70
        daily_pd["has_conflict"] = daily_pd["date_str"].isin(conflict_dates)

        def build_hover(row):
            lines = [
                f"📅 日期: {row['scheduled_date']}",
                f"🎯 到场率: {row['attendance_rate']}%",
                f"📋 排班数: {row['total_scheduled']}",
                f"✅ 正常到场: {row['arrived_count']}",
                f"⏰ 迟到: {row['late_count']}",
                f"❌ 未到场: {row['no_show_count']}",
            ]
            if row["has_conflict"]:
                lines.append("⚠️ 【时段冲突】当日存在时段冲突，影响数据准确性")
            if row["is_anomaly"]:
                lines.append("🔴 【异常点】到场率低于警戒线")
                ad = row["date_str"]
                if ad in alert_dates_map:
                    lines.append("🔔 对应提醒名单:")
                    for i, al in enumerate(alert_dates_map[ad][:5], 1):
                        lines.append(f"   {i}. {al}")
                    if len(alert_dates_map[ad]) > 5:
                        lines.append(f"   另有 {len(alert_dates_map[ad]) - 5} 条...")
            return "<br>".join(lines)

        daily_pd["hover_text"] = daily_pd.apply(build_hover, axis=1)

        fig = go.Figure()

        conflict_dates_sorted = sorted(
            [d for d in daily_pd["scheduled_date"][daily_pd["has_conflict"]]]
        )
        for cd in conflict_dates_sorted:
            fig.add_vrect(
                x0=cd, x1=cd,
                fillcolor="#FF4B4B", opacity=0.12,
                layer="below", line_width=0,
                annotation_text="冲突",
                annotation_position="top",
                annotation_font_size=9,
                annotation_font_color="#FF4B4B",
            )

        fig.add_trace(go.Scatter(
            x=daily_pd["scheduled_date"],
            y=daily_pd["attendance_rate"],
            mode="lines+markers",
            name="到场率",
            line=dict(color="#3498DB", width=2),
            marker=dict(size=6),
            text=daily_pd["hover_text"],
            hoverinfo="text",
        ))

        anomaly_data = daily_pd[daily_pd["is_anomaly"]]
        if len(anomaly_data) > 0:
            fig.add_trace(go.Scatter(
                x=anomaly_data["scheduled_date"],
                y=anomaly_data["attendance_rate"],
                mode="markers",
                name="异常点(见提醒名单)",
                marker=dict(color="#FF4B4B", size=14, symbol="circle", line=dict(width=2, color="#8B0000")),
                text=anomaly_data["hover_text"],
                hoverinfo="text",
            ))

        fig.add_vrect(
            x0=prev_start, x1=prev_end,
            fillcolor="#F1C40F", opacity=0.05,
            layer="below", line_width=1, line_dash="dash", line_color="#F1C40F",
            annotation_text="前期",
            annotation_position="top left",
            annotation_font_size=11,
            annotation_font_color="#F39C12",
        )
        fig.add_vrect(
            x0=curr_start, x1=curr_end,
            fillcolor="#2ECC71", opacity=0.05,
            layer="below", line_width=1, line_dash="dash", line_color="#2ECC71",
            annotation_text="后期",
            annotation_position="top left",
            annotation_font_size=11,
            annotation_font_color="#27AE60",
        )

        fig.add_hline(
            y=70,
            line_dash="dash",
            line_color="#E74C3C",
            annotation_text="警戒线 70%",
            annotation_position="bottom right",
        )
        fig.add_hline(
            y=85,
            line_dash="dot",
            line_color="#2ECC71",
            annotation_text="目标线 85%",
            annotation_position="top right",
        )

        fig.update_layout(
            title=dict(
                text="每日到场率趋势 - 前后期对比 / 时段冲突段 / 异常点（点击提醒名单查看详细解释）",
                font=dict(size=14),
            ),
            yaxis_title="到场率 (%)",
            yaxis_range=[0, 100],
            hovermode="x unified",
            height=520,
            legend=dict(orientation="h", y=-0.2),
        )

        st.plotly_chart(fig, use_container_width=True)

        if len(anomaly_data) > 0:
            st.markdown("---")
            st.subheader("🔔 异常点对应提醒名单明细")
            st.warning(f"共 {len(anomaly_data)} 个异常日期，以下为对应提醒详情（用于解释异常点原因）：")

            for _, row in anomaly_data.iterrows():
                ad = str(row["scheduled_date"])
                with st.expander(
                    f"📅 {ad} | 🎯 到场率: {row['attendance_rate']}% | "
                    f"❌ 未到场: {row['no_show_count']} | ⏰ 迟到: {row['late_count']}"
                ):
                    if ad in alert_dates_map:
                        st.markdown("**🔔 提醒名单详情:**")
                        for i, al in enumerate(alert_dates_map[ad], 1):
                            sev_color = {"high": "🔴", "medium": "🟠", "low": "🟡"}.get(
                                al[1:al.index("]")], "⚪"
                            ) if al.startswith("[") else "⚪"
                            st.write(f"  {sev_color} {i}. {al}")
                    else:
                        st.info("当日暂无额外提醒记录，异常由到场率阈值触发")

                    st.markdown(f"**📊 当日汇总:**")
                    st.write(f"- 总排班: {row['total_scheduled']}")
                    st.write(f"- 正常到场: {row['arrived_count']}")
                    if row["has_conflict"]:
                        st.write(f"- ⚠️ **时段冲突**: 当日存在时段冲突数据段，影响该日数据")

    st.markdown("---")

    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("🏢 各公寓到场率排名")
        by_apt = analyzer.get_attendance_by_apartment(start_date, end_date)
        if len(by_apt) > 0:
            by_apt_pd = by_apt.to_pandas()
            fig = px.bar(
                by_apt_pd,
                x="apartment_id",
                y="attendance_rate",
                text="attendance_rate",
                color="attendance_rate",
                color_continuous_scale=[(0, "#FF4B4B"), (0.5, "#FFA500"), (1, "#2ECC71")],
                range_color=[60, 95],
                labels={"apartment_id": "公寓", "attendance_rate": "到场率 (%)"},
            )
            fig.update_traces(texttemplate='%{text}%', textposition='outside')
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.subheader("🕐 各时段到场率对比")
        by_slot = analyzer.get_attendance_by_time_slot(start_date, end_date)
        if len(by_slot) > 0:
            fig = px.bar(
                by_slot.to_pandas(),
                x="scheduled_time_slot",
                y="attendance_rate",
                text="attendance_rate",
                color="attendance_rate",
                color_continuous_scale="RdYlGn",
                range_color=[60, 95],
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

    all_versions = db.list_versions()

    if len(all_versions) == 0:
        st.info("暂无版本记录。请先生成模拟数据或导入数据。")
    else:
        tab1, tab2 = st.tabs(["📚 抄表表格版本", "📄 电子合同版本"])

        with tab1:
            meter_versions = db.list_versions("meter_readings")
            if len(meter_versions) > 0:
                st.subheader(f"抄表数据版本历史（共 {len(meter_versions)} 个版本）")

                mv_display = meter_versions.select([
                    "version", "description", "record_count", "effective_date",
                    "storage_type", "is_current", "created_at"
                ]).with_columns([
                    pl.col("is_current").map_elements(
                        lambda x: "✅ 当前版" if x else "", return_dtype=str
                    ).alias("状态"),
                ])
                st.dataframe(
                    mv_display.to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "version": st.column_config.NumberColumn("版本号", format="v%d"),
                        "description": "版本描述",
                        "record_count": "记录数",
                        "effective_date": "生效日期",
                        "storage_type": "存储类型",
                        "is_current": None,
                        "created_at": "创建时间",
                    }
                )

                st.divider()

                col_sel1, col_sel2 = st.columns(2)
                with col_sel1:
                    meter_ver_list = [f"v{int(r['version'])}" for r in meter_versions.to_dicts()]
                    selected_meter_ver_a = st.selectbox(
                        "选择版本 A",
                        options=meter_ver_list,
                        key="meter_ver_a",
                        index=0 if len(meter_ver_list) > 1 else 0
                    )
                with col_sel2:
                    selected_meter_ver_b = st.selectbox(
                        "选择版本 B",
                        options=meter_ver_list,
                        key="meter_ver_b",
                        index=1 if len(meter_ver_list) > 1 else 0
                    )

                ver_a = int(selected_meter_ver_a.replace("v", ""))
                ver_b = int(selected_meter_ver_b.replace("v", ""))

                data_a = db.get_version_data("meter_readings", ver_a)
                data_b = db.get_version_data("meter_readings", ver_b)

                if data_a is not None and data_b is not None:
                    show_data_a, show_data_b = st.tabs([
                        f"📊 版本 v{ver_a} 详情 ({len(data_a)} 条)",
                        f"📊 版本 v{ver_b} 详情 ({len(data_b)} 条)"
                    ])
                    with show_data_a:
                        st.dataframe(
                            data_a.drop(["archive_id", "version"]).to_pandas(),
                            use_container_width=True, hide_index=True
                        )
                    with show_data_b:
                        st.dataframe(
                            data_b.drop(["archive_id", "version"]).to_pandas(),
                            use_container_width=True, hide_index=True
                        )

                    if ver_a != ver_b:
                        st.divider()
                        st.markdown("**� 版本对比 (差异明细)**")
                        try:
                            df_a = data_a.with_columns(
                                pl.col("reading_date").cast(pl.Utf8)
                            ).select(["apartment_id", "room_id", "reading_date", "water_meter"])
                            df_b = data_b.with_columns(
                                pl.col("reading_date").cast(pl.Utf8)
                            ).select(["apartment_id", "room_id", "reading_date", "water_meter"])

                            diff = df_a.join(
                                df_b,
                                on=["apartment_id", "room_id", "reading_date"],
                                how="outer",
                                suffix="_b"
                            ).with_columns([
                                (pl.col("water_meter_b") - pl.col("water_meter")).alias("water_diff")
                            ]).filter(
                                (pl.col("water_diff") != 0) |
                                pl.col("water_diff").is_null()
                            )
                            if len(diff) > 0:
                                st.warning(f"发现 {len(diff)} 条水表读数差异")
                                st.dataframe(
                                    diff.to_pandas(),
                                    use_container_width=True,
                                    hide_index=True
                                )
                            else:
                                st.success("✅ 两版本水表读数一致")
                        except Exception as e:
                            st.info(f"差异对比: {str(e)}")
                else:
                    st.info("版本数据不存在")
            else:
                st.info("暂无抄表版本记录")

        with tab2:
            contract_versions = db.list_versions("e_contracts")
            if len(contract_versions) > 0:
                st.subheader(f"电子合同版本历史（共 {len(contract_versions)} 个版本）")

                cv_display = contract_versions.select([
                    "version", "description", "record_count", "effective_date",
                    "storage_type", "is_current", "created_at"
                ]).with_columns([
                    pl.col("is_current").map_elements(
                        lambda x: "✅ 当前版" if x else "", return_dtype=str
                    ).alias("状态"),
                ])
                st.dataframe(
                    cv_display.to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "version": st.column_config.NumberColumn("版本号", format="v%d"),
                        "description": "版本描述",
                        "record_count": "合同数",
                        "effective_date": "生效日期",
                        "storage_type": "存储类型",
                        "is_current": None,
                        "created_at": "创建时间",
                    }
                )

                st.divider()

                col_sel1, col_sel2 = st.columns(2)
                with col_sel1:
                    cv_list = [f"v{int(r['version'])}" for r in contract_versions.to_dicts()]
                    selected_cv_a = st.selectbox(
                        "选择合同版本 A",
                        options=cv_list,
                        key="cv_ver_a",
                        index=0 if len(cv_list) > 1 else 0
                    )
                with col_sel2:
                    selected_cv_b = st.selectbox(
                        "选择合同版本 B",
                        options=cv_list,
                        key="cv_ver_b",
                        index=1 if len(cv_list) > 1 else 0
                    )

                cv_a = int(selected_cv_a.replace("v", ""))
                cv_b = int(selected_cv_b.replace("v", ""))

                c_data_a = db.get_version_data("e_contracts", cv_a)
                c_data_b = db.get_version_data("e_contracts", cv_b)

                if c_data_a is not None and c_data_b is not None:
                    taba, tabb = st.tabs([
                        f"📄 版本 v{cv_a} 详情 ({len(c_data_a)} 份)",
                        f"📄 版本 v{cv_b} 详情 ({len(c_data_b)} 份)"
                    ])
                    with taba:
                        st.dataframe(
                            c_data_a.drop(["archive_id", "version"]).to_pandas(),
                            use_container_width=True, hide_index=True
                        )
                    with tabb:
                        st.dataframe(
                            c_data_b.drop(["archive_id", "version"]).to_pandas(),
                            use_container_width=True, hide_index=True
                        )

                    if cv_a != cv_b:
                        st.divider()
                        st.markdown("**⚠️ CRM口径与合同约定差异明细**")
                        try:
                            key_cols = ["apartment_id", "room_id"]
                            cols_sel = key_cols + ["cleaning_time_slot", "cleaning_weekday", "cleaning_frequency"]

                            df_a = c_data_a.select(cols_sel)
                            df_b = c_data_b.select(cols_sel)

                            joined = df_a.join(
                                df_b,
                                on=key_cols,
                                how="inner",
                                suffix="_new"
                            )

                            diffs = joined.filter(
                                (pl.col("cleaning_time_slot") != pl.col("cleaning_time_slot_new")) |
                                (pl.col("cleaning_weekday") != pl.col("cleaning_weekday_new")) |
                                (pl.col("cleaning_frequency") != pl.col("cleaning_frequency_new"))
                            )

                            if len(diffs) > 0:
                                st.warning(f"发现 {len(diffs)} 处合同条款变更")
                                st.dataframe(
                                    diffs.to_pandas(),
                                    use_container_width=True,
                                    hide_index=True,
                                    column_config={
                                        "apartment_id": "公寓",
                                        "room_id": "房间",
                                        "cleaning_time_slot": "旧时段",
                                        "cleaning_time_slot_new": "新时段",
                                        "cleaning_weekday": "旧周次",
                                        "cleaning_weekday_new": "新周次",
                                        "cleaning_frequency": "旧频率",
                                        "cleaning_frequency_new": "新频率",
                                    }
                                )
                            else:
                                st.success("✅ 两版本合同条款一致，无口径差异")
                        except Exception as e:
                            st.info(f"差异对比: {str(e)}")
                else:
                    st.info("版本数据不存在")
            else:
                st.info("暂无电子合同版本记录")

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
    else:
        st.warning("⚠️ MinIO 不可用，版本归档仅保存在 DuckDB")
        st.info("请配置 MinIO 服务以启用云端版本存储：")
        st.code("""
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
        """, language="bash")

    st.markdown("---")
    st.subheader("📋 当前数据库表统计")

    tables = db.get_table_names()
    table_info = []
    for table in tables:
        try:
            count_result = db.query(f"SELECT COUNT(*) FROM {table}")
            count = count_result.row(0)[0] if len(count_result) > 0 else 0
        except Exception:
            count = 0
        table_info.append({"表名": table, "记录数": count})

    df_tables = pl.DataFrame(table_info).to_pandas()
    st.dataframe(df_tables, use_container_width=True, hide_index=True)


def main():
    db = init_database()
    storage = init_storage()

    start_date, end_date, status_filter, reschedule_filter, severity_filter = sidebar_controls()

    if st.session_state.get("regenerate_data", False):
        for table in [
            "meter_readings", "e_contracts", "crm_schedules", "reschedule_records",
            "attendance_records", "conflict_records", "alert_list",
            "data_versions", "meter_readings_archive", "e_contracts_archive"
        ]:
            try:
                db.con.execute(f"DROP TABLE IF EXISTS {table}")
            except Exception:
                pass
        db._init_tables()
        generator = MockDataGenerator(seed=42)
        counts = generator.populate_database(db, start_date, end_date, storage)
        st.session_state["regenerate_data"] = False
        st.success(f"模拟数据已重新生成！共生成 {counts.get('versions', {})}")
        st.rerun()

    init_mock_data(db, storage, start_date, end_date)

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
