"""
权限越权追踪模块 - 从图表追到样本记录
"""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import polars as pl

from src.components.common import (
    get_common_filters, show_data_table, show_sync_trail,
    format_number, format_percent
)
from src.data.data_querier import DataQuerier
from src.utils.trend_analyzer import TrendAnalyzer

if "selected_violation" not in st.session_state:
    st.session_state.selected_violation = None
if "drill_down_level" not in st.session_state:
    st.session_state.drill_down_level = 0


def show():
    st.title("⚠️ 权限越权追踪")
    st.markdown("权限越权发生时，处理人可以从图表追到样本记录")

    if st.button("← 返回总览", key="back_to_overview"):
        st.session_state.selected_violation = None
        st.session_state.drill_down_level = 0
        st.rerun()

    filters = get_common_filters(key_prefix="violation")

    querier = DataQuerier()

    if st.session_state.drill_down_level == 0:
        show_overview_charts(querier, filters)
    elif st.session_state.drill_down_level == 1:
        show_violation_detail(querier)
    elif st.session_state.drill_down_level == 2:
        show_record_detail(querier)

    querier.close()


def show_overview_charts(querier: DataQuerier, filters: dict) -> None:
    permission_df = querier.get_permission_logs(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id"),
        is_violation=True
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("越权总次数", format_number(len(permission_df)))
    with col2:
        unique_users = permission_df["user_id"].n_unique() if "user_id" in permission_df.columns else 0
        st.metric("涉及用户数", format_number(unique_users))
    with col3:
        unique_regions = permission_df["region_id"].n_unique() if "region_id" in permission_df.columns else 0
        st.metric("涉及区域数", format_number(unique_regions))

    st.divider()

    tab1, tab2, tab3 = st.tabs(["📊 越权趋势", "👥 用户分布", "🌍 区域分布"])

    with tab1:
        show_violation_trend(permission_df)

    with tab2:
        show_user_distribution(permission_df)

    with tab3:
        show_region_distribution(permission_df, querier, filters)


def show_violation_trend(permission_df: pl.DataFrame) -> None:
    st.subheader("📊 权限越权趋势")

    if len(permission_df) == 0 or "operation_time" not in permission_df.columns:
        st.info("暂无越权记录")
        return

    col1, col2 = st.columns(2)
    with col1:
        period = st.selectbox(
            "时间粒度",
            options=["日", "周", "月"],
            index=1,
            key="violation_period"
        )
        period_map = {"日": "day", "周": "week", "月": "month"}

    with col2:
        chart_type = st.radio(
            "图表类型",
            options=["柱状图", "趋势线"],
            index=0,
            horizontal=True,
            key="violation_chart"
        )

    format_map = {"day": "%Y-%m-%d", "week": "%Y-%W", "month": "%Y-%m"}

    trend_df = permission_df.with_columns([
        pl.col("operation_time").cast(pl.Datetime).dt.strftime(format_map[period_map[period]]).alias("period")
    ]).group_by("period").agg([
        pl.count().alias("越权次数"),
        pl.col("user_id").n_unique().alias("涉及用户数")
    ]).sort("period")

    if chart_type == "柱状图":
        fig = px.bar(
            trend_df.to_pandas(),
            x="period",
            y="越权次数",
            title=f"权限越权{period}趋势",
            color="越权次数",
            color_continuous_scale="Reds",
            text_auto=True
        )
    else:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=trend_df["period"].to_list(),
            y=trend_df["越权次数"].to_list(),
            name="越权次数",
            mode="lines+markers",
            line=dict(color="#d62728", width=3),
            yaxis="y1"
        ))
        fig.add_trace(go.Scatter(
            x=trend_df["period"].to_list(),
            y=trend_df["涉及用户数"].to_list(),
            name="涉及用户数",
            mode="lines+markers",
            line=dict(color="#ff7f0e", width=2),
            yaxis="y2"
        ))
        fig.update_layout(
            yaxis2=dict(title="涉及用户数", overlaying="y", side="right"),
            hovermode="x unified"
        )

    fig.update_layout(height=500)
    st.plotly_chart(fig, use_container_width=True, key="violation_trend_chart")

    st.markdown("**点击下方数据行查看详情**")

    trend_df = trend_df.with_columns([
        pl.col("period").alias("查看详情")
    ])

    selected_idx = st.selectbox(
        "选择时间段查看明细",
        options=range(len(trend_df)),
        format_func=lambda i: f"{trend_df['period'][i]} - {trend_df['越权次数'][i]}次越权",
        key="violation_period_select"
    )

    if selected_idx is not None:
        selected_period = trend_df["period"][selected_idx]
        st.session_state.selected_violation = {
            "type": "period",
            "period": selected_period,
            "period_type": period_map[period]
        }
        st.session_state.drill_down_level = 1
        if st.button(f"查看 {selected_period} 的越权记录 →", key="drill_to_period"):
            st.rerun()


def show_user_distribution(permission_df: pl.DataFrame) -> None:
    st.subheader("👥 越权用户分布")

    if len(permission_df) == 0 or "user_name" not in permission_df.columns:
        st.info("暂无数据")
        return

    user_stats = permission_df.group_by(["user_id", "user_name", "department"]).agg([
        pl.count().alias("越权次数"),
        pl.col("permission_code").n_unique().alias("涉及权限数"),
        pl.col("operation_time").min().alias("首次越权时间"),
        pl.col("operation_time").max().alias("最近越权时间")
    ]).sort("越权次数", descending=True).head(20)

    fig = px.bar(
        user_stats.to_pandas(),
        x="user_name",
        y="越权次数",
        color="department",
        title="用户越权次数排行",
        text_auto=True
    )
    fig.update_layout(height=500, xaxis_title="用户", yaxis_title="越权次数")
    st.plotly_chart(fig, use_container_width=True, key="user_dist_chart")

    st.markdown("**点击查看用户越权明细**")
    selected_user_idx = st.selectbox(
        "选择用户",
        options=range(len(user_stats)),
        format_func=lambda i: f"{user_stats['user_name'][i]} ({user_stats['department'][i]}) - {user_stats['越权次数'][i]}次",
        key="violation_user_select"
    )

    if selected_user_idx is not None:
        selected_user = user_stats["user_id"][selected_user_idx]
        selected_user_name = user_stats["user_name"][selected_user_idx]
        st.session_state.selected_violation = {
            "type": "user",
            "user_id": selected_user,
            "user_name": selected_user_name
        }
        st.session_state.drill_down_level = 1
        if st.button(f"查看 {selected_user_name} 的越权记录 →", key="drill_to_user"):
            st.rerun()


def show_region_distribution(permission_df: pl.DataFrame, querier: DataQuerier, filters: dict) -> None:
    st.subheader("🌍 越权区域分布")

    if len(permission_df) == 0 or "region_name" not in permission_df.columns:
        st.info("暂无数据")
        return

    region_stats = permission_df.group_by(["region_id", "region_name"]).agg([
        pl.count().alias("越权次数"),
        pl.col("user_id").n_unique().alias("涉及用户数"),
        pl.col("permission_code").n_unique().alias("涉及权限数")
    ]).sort("越权次数", descending=True)

    col1, col2 = st.columns(2)

    with col1:
        fig = px.pie(
            region_stats.to_pandas(),
            values="越权次数",
            names="region_name",
            title="区域越权占比",
            hole=0.4
        )
        fig.update_layout(height=450)
        st.plotly_chart(fig, use_container_width=True, key="region_pie")

    with col2:
        fig2 = px.bar(
            region_stats.to_pandas(),
            x="region_name",
            y=["越权次数", "涉及用户数"],
            title="区域越权详情",
            barmode="group"
        )
        fig2.update_layout(height=450)
        st.plotly_chart(fig2, use_container_width=True, key="region_bar")

    st.markdown("**点击查看区域越权明细**")
    selected_region_idx = st.selectbox(
        "选择区域",
        options=range(len(region_stats)),
        format_func=lambda i: (
            f"{region_stats['region_name'][i]} - "
            f"{region_stats['越权次数'][i]}次越权, "
            f"{region_stats['涉及用户数'][i]}个用户"
        ),
        key="violation_region_select"
    )

    if selected_region_idx is not None:
        selected_region = region_stats["region_id"][selected_region_idx]
        selected_region_name = region_stats["region_name"][selected_region_idx]
        st.session_state.selected_violation = {
            "type": "region",
            "region_id": selected_region,
            "region_name": selected_region_name,
            "filters": filters
        }
        st.session_state.drill_down_level = 1
        if st.button(f"查看 {selected_region_name} 的越权记录 →", key="drill_to_region"):
            st.rerun()


def show_violation_detail(querier: DataQuerier) -> None:
    selection = st.session_state.selected_violation

    if selection["type"] == "period":
        st.subheader(f"📋 {selection['period']} 越权记录明细")
        period_type = selection["period_type"]
        format_map = {"day": "%Y-%m-%d", "week": "%Y-%W", "month": "%Y-%m"}

        all_violations = querier.get_permission_logs(is_violation=True)
        filtered = all_violations.with_columns([
            pl.col("operation_time").cast(pl.Datetime).dt.strftime(format_map[period_type]).alias("period")
        ]).filter(pl.col("period") == selection["period"])

    elif selection["type"] == "user":
        st.subheader(f"👤 {selection['user_name']} 越权记录明细")
        all_violations = querier.get_permission_logs(is_violation=True)
        filtered = all_violations.filter(pl.col("user_id") == selection["user_id"])

    elif selection["type"] == "region":
        st.subheader(f"🌍 {selection['region_name']} 越权记录明细")
        filters = selection.get("filters", {})
        filtered = querier.get_permission_logs(
            start_date=filters.get("start_date"),
            end_date=filters.get("end_date"),
            region_id=selection["region_id"],
            is_violation=True
        )

    else:
        st.warning("未知的选择类型")
        return

    if len(filtered) == 0:
        st.info("暂无越权记录")
        return

    display_df = filtered.select([
        "log_id", "user_name", "department", "permission_name",
        "action", "resource_path", "ip_address", "violation_reason",
        "region_name", "operation_time", "sync_id"
    ])

    st.metric("记录总数", format_number(len(display_df)))

    st.markdown("**越权记录列表 - 点击行查看原始记录详情**")

    event = st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        height=500,
        key="violation_detail_table",
        on_select="rerun",
        selection_mode="single-row"
    )

    if event and event.selection and event.selection.rows:
        selected_row = event.selection.rows[0]
        selected_log_id = display_df["log_id"][selected_row]
        st.session_state.selected_violation["log_id"] = selected_log_id
        st.session_state.selected_violation["sync_id"] = display_df["sync_id"][selected_row]
        st.session_state.drill_down_level = 2
        st.rerun()

    if "sync_id" in display_df.columns:
        sync_ids = display_df["sync_id"].unique().to_list()
        if sync_ids:
            show_sync_trail(sync_ids[0], "数据同步审计链路")


def show_record_detail(querier: DataQuerier) -> None:
    selection = st.session_state.selected_violation
    log_id = selection.get("log_id")

    if not log_id:
        st.warning("未选择记录")
        return

    st.subheader(f"📝 越权记录详情 - {log_id}")

    record = querier.get_original_record("permission_logs", log_id)

    if not record:
        st.error("未找到该记录")
        return

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**基本信息**")
        info_df = pl.DataFrame([
            {"字段": "日志ID", "值": str(record.get("log_id", ""))},
            {"字段": "用户ID", "值": str(record.get("user_id", ""))},
            {"字段": "用户名", "值": str(record.get("user_name", ""))},
            {"字段": "部门", "值": str(record.get("department", ""))},
            {"字段": "操作时间", "值": str(record.get("operation_time", ""))},
            {"字段": "IP地址", "值": str(record.get("ip_address", ""))},
            {"字段": "区域", "值": str(record.get("region_id", ""))},
        ])
        st.dataframe(info_df.to_pandas(), use_container_width=True, hide_index=True)

    with col2:
        st.markdown("**权限信息**")
        perm_df = pl.DataFrame([
            {"字段": "权限代码", "值": str(record.get("permission_code", ""))},
            {"字段": "权限名称", "值": str(record.get("permission_name", ""))},
            {"字段": "操作类型", "值": str(record.get("action", ""))},
            {"字段": "资源路径", "值": str(record.get("resource_path", ""))},
            {"字段": "是否越权", "值": "是" if record.get("is_violation") else "否"},
            {"字段": "越权原因", "值": str(record.get("violation_reason", ""))},
        ])
        st.dataframe(perm_df.to_pandas(), use_container_width=True, hide_index=True)

    sync_id = selection.get("sync_id") or record.get("sync_id")
    if sync_id:
        show_sync_trail(sync_id, "该记录的同步审计链路")

    st.markdown("### 🔗 关联证据归档")
    archive_df = querier.get_evidence_archive()
    related_archive = archive_df.filter(
        (pl.col("source_table") == "permission_logs") &
        (pl.col("source_id") == log_id)
    )

    if len(related_archive) > 0:
        show_data_table(related_archive, height=200, key="related_archive")
    else:
        st.info("暂无关联的证据归档记录")

    st.markdown("### 📎 相关问题记录")
    issue_df = querier.get_issue_records()
    if "related_archive_id" in issue_df.columns and len(related_archive) > 0:
        archive_ids = related_archive["archive_id"].to_list()
        related_issues = issue_df.filter(pl.col("related_archive_id").is_in(archive_ids))
        if len(related_issues) > 0:
            show_data_table(related_issues.select([
                "issue_no", "title", "severity", "status", "found_date", "handler"
            ]), height=200, key="related_issues")
        else:
            st.info("暂无相关问题记录")

    if st.button("← 返回越权记录列表", key="back_to_violation_list"):
        st.session_state.drill_down_level = 1
        st.rerun()
