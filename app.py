import asyncio
import sys
import os

if sys.version_info >= (3, 12):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

from data_layer import dw
from mock_data import generate_all_data
from analytics import DataReconciliation, ConversionAnalytics, VersionAnalytics, VersionConversionLinkage

st.set_page_config(
    page_title="法律服务文书归档趋势看板",
    page_icon="📋",
    layout="wide",
)

st.markdown("""
<style>
    .main-header {
        font-size: 26px;
        font-weight: bold;
        color: #1f4e79;
        margin-bottom: 20px;
    }
    .section-header {
        font-size: 18px;
        font-weight: bold;
        color: #2e75b6;
        margin-top: 20px;
        margin-bottom: 10px;
    }
    .metric-card {
        background-color: #f5f9fc;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #2e75b6;
    }
    .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #1f4e79;
    }
    .metric-label {
        font-size: 14px;
        color: #666;
    }
    .gap-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
    .gap-high { background-color: #fde8e8; color: #c53030; }
    .gap-medium { background-color: #fef5e7; color: #b7791f; }
    .gap-low { background-color: #e6f4ea; color: #38a169; }
</style>
""", unsafe_allow_html=True)


@st.cache_data(ttl=3600, show_spinner="正在加载数据...")
def load_data(version: int = 2026062203):
    data = generate_all_data()
    for name, df in data.items():
        dw.register_polars(name, df)
    return data


data = load_data()

reconciliation = DataReconciliation(
    data["case_system"],
    data["payment_flow"],
    data["email_attachments"],
)
conversion = ConversionAnalytics(data["publish_schedule"])
version_analytics = VersionAnalytics(
    data["version_history"], data["case_system"]
)
version_conversion = VersionConversionLinkage(
    data["case_system"], data["version_history"], data["publish_schedule"]
)

st.markdown('<div class="main-header">📋 法律服务文书归档趋势看板</div>', unsafe_allow_html=True)

st.sidebar.title("导航")
page = st.sidebar.radio(
    "选择页面",
    [
        "📊 总览看板",
        "🔍 数据口径对照",
        "⚠️ 审核退回缺口",
        "📑 版本管理总览",
        "🏷️ 标签与审核联动",
        "📅 发布排期与异常",
        "📈 内容转化分析",
        "🔄 版本-转化复盘",
    ],
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 筛选条件")

date_range = st.sidebar.date_input(
    "日期范围",
    value=(datetime(2026, 1, 1), datetime(2026, 6, 20)),
    min_value=datetime(2025, 1, 1),
    max_value=datetime(2026, 6, 20),
)

selected_departments = st.sidebar.multiselect(
    "部门",
    options=data["case_system"]["department"].unique().to_list(),
    default=[],
)

selected_case_types = st.sidebar.multiselect(
    "案件类型",
    options=data["case_system"]["case_type"].unique().to_list(),
    default=[],
)


def filter_cases(df: pl.DataFrame, date_col: str = "submit_date") -> pl.DataFrame:
    start_date, end_date = date_range
    filtered = df.filter(
        (pl.col(date_col).str.to_date() >= start_date) &
        (pl.col(date_col).str.to_date() <= end_date)
    )
    if selected_departments and "department" in filtered.columns:
        filtered = filtered.filter(pl.col("department").is_in(selected_departments))
    if selected_case_types and "case_type" in filtered.columns:
        filtered = filtered.filter(pl.col("case_type").is_in(selected_case_types))
    return filtered


if page == "📊 总览看板":
    st.markdown('<div class="section-header">核心指标概览</div>', unsafe_allow_html=True)

    filtered_cases = filter_cases(data["case_system"])
    filtered_emails = filter_cases(data["email_attachments"], "receive_date")
    filtered_payments = filter_cases(data["payment_flow"], "payment_date")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown('<div class="metric-label">归档案件数</div>', unsafe_allow_html=True)
        archived = filtered_cases.filter(pl.col("status") == "已归档").height
        st.markdown(f'<div class="metric-value">{archived}</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown('<div class="metric-label">邮件附件归档</div>', unsafe_allow_html=True)
        email_archived = filtered_emails.filter(pl.col("archived")).height
        st.markdown(f'<div class="metric-value">{email_archived}</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col3:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown('<div class="metric-label">回款匹配率</div>', unsafe_allow_html=True)
        matched = filtered_payments.filter(pl.col("is_case_matched")).height
        match_rate = round(matched / filtered_payments.height * 100, 1) if filtered_payments.height > 0 else 0
        st.markdown(f'<div class="metric-value">{match_rate}%</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col4:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.markdown('<div class="metric-label">平均版本数</div>', unsafe_allow_html=True)
        avg_ver = round(filtered_cases["version"].mean(), 2) if filtered_cases.height > 0 else 0
        st.markdown(f'<div class="metric-value">{avg_ver}</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<div class="section-header">归档趋势</div>', unsafe_allow_html=True)

    monthly_cases = filtered_cases.with_columns(
        pl.col("submit_date").str.to_date().dt.truncate("1mo").alias("month")
    ).group_by("month").agg(
        pl.col("case_id").count().alias("提交数"),
        (pl.col("status") == "已归档").sum().alias("归档数"),
        (pl.col("status") == "已退回").sum().alias("退回数"),
    ).sort("month")

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=monthly_cases["month"].to_list(),
        y=monthly_cases["提交数"].to_list(),
        name="提交数",
        marker_color="#2e75b6",
    ))
    fig.add_trace(go.Bar(
        x=monthly_cases["month"].to_list(),
        y=monthly_cases["归档数"].to_list(),
        name="归档数",
        marker_color="#38a169",
    ))
    fig.add_trace(go.Bar(
        x=monthly_cases["month"].to_list(),
        y=monthly_cases["退回数"].to_list(),
        name="退回数",
        marker_color="#c53030",
    ))
    fig.update_layout(barmode="group", height=400, xaxis_title="月份", yaxis_title="案件数")
    st.plotly_chart(fig, use_container_width=True)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="section-header">案件类型分布</div>', unsafe_allow_html=True)
        type_dist = filtered_cases.group_by("case_type").agg(
            pl.col("case_id").count().alias("数量")
        ).sort("数量", descending=True)
        fig = px.pie(
            type_dist.to_pandas(),
            values="数量",
            names="case_type",
            hole=0.4,
        )
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.markdown('<div class="section-header">部门归档情况</div>', unsafe_allow_html=True)
        dept_dist = filtered_cases.group_by("department").agg([
            pl.col("case_id").count().alias("总案件数"),
            (pl.col("status") == "已归档").sum().alias("已归档"),
        ]).sort("总案件数", descending=True)
        fig = px.bar(
            dept_dist.to_pandas(),
            x="department",
            y=["总案件数", "已归档"],
            barmode="group",
        )
        fig.update_layout(height=350, xaxis_title="部门", yaxis_title="案件数")
        st.plotly_chart(fig, use_container_width=True)

elif page == "🔍 数据口径对照":
    st.markdown('<div class="section-header">三源数据口径对照</div>', unsafe_allow_html=True)

    conflict_report = reconciliation.calibre_conflict_report()
    comparison_df = reconciliation.field_level_comparison()

    st.info("💡 数据来源包括：案件系统、邮件附件、收款流水。各系统统计口径存在差异，以下为字段级对照说明。")

    col1, col2, col3 = st.columns(3)
    summary = conflict_report["summary"]

    with col1:
        st.metric("案件系统总案件数", summary["total_cases"])
    with col2:
        st.metric("收款匹配案件占比", f"{summary['matched_payment_ratio']}%")
    with col3:
        st.metric("邮件关联案件占比", f"{summary['matched_email_ratio']}%")

    st.markdown('<div class="section-header">字段级冲突对照</div>', unsafe_allow_html=True)

    conflict_fields = conflict_report["conflict_fields"]
    for field in conflict_fields:
        with st.expander(f"📌 {field['field']} - {field['conflict_type']}"):
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("案件系统", field["case_system"] if field["case_system"] else "N/A")
            with col2:
                st.metric("收款流水", field["payment_system"] if field["payment_system"] else "N/A")
            with col3:
                st.metric("邮件附件", field["email_system"] if field["email_system"] else "N/A")
            st.markdown(f"**说明**：{field['explanation']}")

    st.markdown('<div class="section-header">案件级对照明细</div>', unsafe_allow_html=True)

    match_filter = st.selectbox(
        "匹配状态筛选",
        ["全部", "已匹配", "未匹配"],
    )

    display_df = comparison_df
    if match_filter == "已匹配":
        display_df = display_df.filter(pl.col("payment_match_status") == "已匹配")
    elif match_filter == "未匹配":
        display_df = display_df.filter(pl.col("payment_match_status") == "未匹配")

    st.dataframe(
        display_df.head(100).to_pandas(),
        use_container_width=True,
        hide_index=True,
    )
    st.caption(f"显示前 100 条，共 {display_df.height} 条记录")

elif page == "⚠️ 审核退回缺口":
    st.markdown('<div class="section-header">审核退回数据缺口分析</div>', unsafe_allow_html=True)

    gaps = reconciliation.audit_rejection_gaps()
    gap_summary = reconciliation.gap_summary()

    st.warning("⚠️ 审核退回案件已单独标出，用于识别数据缺口和质量问题。")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("退回案件总数", gaps.height)
    with col2:
        st.metric("缺口类型数", gap_summary.height)
    with col3:
        rejection_rate = round(gaps.height / data["case_system"].height * 100, 2)
        st.metric("退回率", f"{rejection_rate}%")

    st.markdown('<div class="section-header">缺口类型分布</div>', unsafe_allow_html=True)

    fig = px.bar(
        gap_summary.to_pandas(),
        x="gap_type",
        y="gap_count",
        color="gap_count",
        color_continuous_scale="Reds",
        title="各类数据缺口案件数",
    )
    fig.update_layout(height=400, xaxis_title="缺口类型", yaxis_title="案件数")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">缺口详情列表</div>', unsafe_allow_html=True)

    gap_type_filter = st.multiselect(
        "选择缺口类型",
        options=gap_summary["gap_type"].to_list(),
        default=[],
    )

    display_gaps = gaps
    if gap_type_filter:
        display_gaps = display_gaps.filter(pl.col("gap_type").is_in(gap_type_filter))

    st.dataframe(
        display_gaps.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "gap_type": st.column_config.Column("缺口类型", width="medium"),
            "gap_description": st.column_config.Column("缺口描述", width="large"),
        },
    )

    st.markdown('<div class="section-header">按部门缺口统计</div>', unsafe_allow_html=True)

    dept_gaps = gaps.group_by("department").agg(
        pl.col("case_id").count().alias("退回案件数"),
        pl.col("gap_type").unique().alias("涉及缺口类型"),
    ).sort("退回案件数", descending=True)

    st.dataframe(
        dept_gaps.to_pandas(),
        use_container_width=True,
        hide_index=True,
    )

elif page == "📑 版本管理总览":
    st.markdown('<div class="section-header">内容版本总览</div>', unsafe_allow_html=True)

    version_overview = version_analytics.version_overview()

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("平均版本数", version_overview["avg_versions"])
    with col2:
        st.metric("最高版本数", version_overview["max_versions"])
    with col3:
        st.metric("多版本案件占比", f"{version_overview['multi_version_ratio']}%")
    with col4:
        st.metric("单版本案件数", version_overview["single_version_count"])

    st.markdown('<div class="section-header">版本数分布</div>', unsafe_allow_html=True)

    version_dist = version_overview["distribution"]
    fig = px.bar(
        version_dist.to_pandas(),
        x="version",
        y="case_count",
        color="case_count",
        color_continuous_scale="Blues",
        title="版本数量分布",
    )
    fig.update_layout(height=400, xaxis_title="版本数", yaxis_title="案件数")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">各类型平均版本数</div>', unsafe_allow_html=True)

    version_by_type = version_analytics.version_by_type()
    fig = px.bar(
        version_by_type.to_pandas(),
        x="case_type",
        y="avg_versions",
        color="avg_versions",
        color_continuous_scale="Viridis",
        title="案件类型平均版本数",
    )
    fig.update_layout(height=400, xaxis_title="案件类型", yaxis_title="平均版本数")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">审核结果分布</div>', unsafe_allow_html=True)

    review_stats = version_analytics.review_outcome_analysis()
    fig = px.pie(
        review_stats.to_pandas(),
        values="version_count",
        names="review_status",
        hole=0.4,
        title="版本审核状态分布",
    )
    fig.update_layout(height=350)
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">版本变更明细</div>', unsafe_allow_html=True)

    case_search = st.text_input("搜索案件ID", "")
    version_hist = data["version_history"]
    if case_search:
        version_hist = version_hist.filter(
            pl.col("case_id").str.contains(case_search.upper())
        )

    st.dataframe(
        version_hist.head(100).to_pandas(),
        use_container_width=True,
        hide_index=True,
    )

elif page == "🏷️ 标签与审核联动":
    st.markdown('<div class="section-header">素材标签与审核意见联动筛选</div>', unsafe_allow_html=True)

    st.info("通过标签筛选可以快速定位特定类型案件的审核情况，识别高频退回标签。")

    all_tags = set()
    for tags in data["case_system"]["tags"].to_list():
        all_tags.update(tags.split(","))
    all_tags = sorted(list(all_tags))

    col1, col2 = st.columns(2)
    with col1:
        selected_tags = st.multiselect("选择素材标签", all_tags, default=[])
    with col2:
        review_status_filter = st.multiselect(
            "审核状态",
            options=["通过", "退回修改", "待审核"],
            default=[],
        )

    tag_review = version_analytics.tag_review_correlation()

    st.markdown('<div class="section-header">标签审核关联分析</div>', unsafe_allow_html=True)

    fig = px.scatter(
        tag_review.to_pandas(),
        x="case_count",
        y="total_rejects",
        size="avg_rejects",
        color="avg_rejects",
        hover_name="tag",
        title="标签案件数 vs 退回次数 (气泡大小=平均退回次数)",
    )
    fig.update_layout(height=450, xaxis_title="标签案件数", yaxis_title="总退回次数")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">标签-审核联动明细</div>', unsafe_allow_html=True)

    case_df = data["case_system"]
    version_df = data["version_history"]

    if selected_tags:
        tag_filter = pl.lit(False)
        for tag in selected_tags:
            tag_filter = tag_filter | pl.col("tags").str.contains(tag)
        case_df = case_df.filter(tag_filter)

    merged = case_df.join(
        version_df.group_by("case_id").agg([
            pl.col("version").max().alias("current_version"),
            (pl.col("review_status") == "退回修改").sum().alias("reject_count"),
        ]),
        on="case_id",
        how="left",
    )

    if review_status_filter:
        merged = merged.join(
            version_df.filter(pl.col("review_status").is_in(review_status_filter))
            .select("case_id").unique(),
            on="case_id",
            how="inner",
        )

    st.dataframe(
        merged.select([
            "case_id", "case_type", "department", "lawyer",
            "status", "version", "tags", "reject_count",
            "review_comments",
        ]).to_pandas(),
        use_container_width=True,
        hide_index=True,
    )

elif page == "📅 发布排期与异常":
    st.markdown('<div class="section-header">发布排期与异常点分析</div>', unsafe_allow_html=True)

    st.info("📅 发布排期数据用于解释内容转化异常点，帮助运营理解波动原因。")

    schedule_df = data["publish_schedule"]

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("已发布内容数", schedule_df.height)
    with col2:
        abnormal_count = schedule_df.filter(pl.col("is_abnormal")).height
        st.metric("异常点数量", abnormal_count)
    with col3:
        abnormal_rate = round(abnormal_count / schedule_df.height * 100, 2)
        st.metric("异常点占比", f"{abnormal_rate}%")

    st.markdown('<div class="section-header">发布排期日历视图</div>', unsafe_allow_html=True)

    monthly_schedule = schedule_df.with_columns(
        pl.col("publish_date").str.to_date().dt.truncate("1mo").alias("month")
    ).group_by("month").agg([
        pl.col("schedule_id").count().alias("发布数量"),
        pl.col("views").sum().alias("总浏览量"),
        pl.col("conversions").sum().alias("总转化数"),
        pl.col("is_abnormal").sum().alias("异常数"),
    ]).sort("month")

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=monthly_schedule["month"].to_list(),
        y=monthly_schedule["发布数量"].to_list(),
        name="发布数量",
        marker_color="#2e75b6",
    ))
    fig.add_trace(go.Scatter(
        x=monthly_schedule["month"].to_list(),
        y=monthly_schedule["异常数"].to_list(),
        name="异常数",
        mode="lines+markers",
        marker_color="#c53030",
        yaxis="y2",
    ))
    fig.update_layout(
        height=400,
        xaxis_title="月份",
        yaxis=dict(title="发布数量"),
        yaxis2=dict(title="异常数", overlaying="y", side="right"),
        legend=dict(x=0.1, y=1.1, orientation="h"),
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">异常点详情</div>', unsafe_allow_html=True)

    abnormal_df = conversion.abnormal_points()

    reason_filter = st.multiselect(
        "异常原因筛选",
        options=abnormal_df["abnormal_reason"].unique().to_list(),
        default=[],
    )

    if reason_filter:
        abnormal_df = abnormal_df.filter(pl.col("abnormal_reason").is_in(reason_filter))

    st.dataframe(
        abnormal_df.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "abnormal_reason": st.column_config.Column("异常原因", width="medium"),
            "conversion_rate": st.column_config.NumberColumn("转化率(%)", format="%.2f"),
        },
    )

    st.markdown('<div class="section-header">异常原因分布</div>', unsafe_allow_html=True)

    reason_dist = abnormal_df.group_by("abnormal_reason").agg(
        pl.col("schedule_id").count().alias("数量")
    ).sort("数量", descending=True)

    fig = px.bar(
        reason_dist.to_pandas(),
        x="abnormal_reason",
        y="数量",
        color="数量",
        color_continuous_scale="Reds",
        title="异常原因分布",
    )
    fig.update_layout(height=350, xaxis_title="异常原因", yaxis_title="数量")
    st.plotly_chart(fig, use_container_width=True)

elif page == "📈 内容转化分析":
    st.markdown('<div class="section-header">内容转化分析（同比/环比/目标）</div>', unsafe_allow_html=True)

    st.success("📊 内容转化同比、环比和目标值集中展示，减少运营手动计算。")

    period = st.selectbox(
        "统计周期",
        ["day", "week", "month"],
        index=2,
        format_func=lambda x: {"day": "按日", "week": "按周", "month": "按月"}[x],
    )

    col1, col2, col3 = st.columns(3)

    trend = conversion.conversion_trend(period)
    yo_y = conversion.yo_y_comparison(period)
    mom = conversion.mom_comparison(period)
    target = conversion.target_comparison(period)

    with col1:
        latest_yoy = yo_y.filter(pl.col("yoy_conversion_pct").is_not_null()).tail(1)
        if latest_yoy.height > 0:
            yoy_val = latest_yoy["yoy_conversion_pct"][0]
            st.metric(
                "同比转化变化",
                f"{yoy_val}%",
                delta=f"{yoy_val}%",
                delta_color="normal" if yoy_val > 0 else "inverse",
            )
        else:
            st.metric("同比转化变化", "N/A")

    with col2:
        latest_mom = mom.tail(1)
        if latest_mom.height > 0 and latest_mom["mom_conversion_pct"][0] is not None:
            mom_val = latest_mom["mom_conversion_pct"][0]
            st.metric(
                "环比转化变化",
                f"{mom_val}%",
                delta=f"{mom_val}%",
                delta_color="normal" if mom_val > 0 else "inverse",
            )
        else:
            st.metric("环比转化变化", "N/A")

    with col3:
        latest_target = target.tail(1)
        if latest_target.height > 0:
            achieve = latest_target["target_achievement_pct"][0]
            status = latest_target["target_status"][0]
            st.metric(
                "目标完成度",
                f"{achieve}%",
                delta=status,
            )

    st.markdown('<div class="section-header">转化趋势与目标对比</div>', unsafe_allow_html=True)

    target_df = target
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=target_df["period"].to_list(),
        y=target_df["actual_rate"].to_list(),
        name="实际转化率",
        mode="lines+markers",
        line=dict(color="#2e75b6", width=2),
    ))
    fig.add_trace(go.Scatter(
        x=target_df["period"].to_list(),
        y=target_df["target_rate"].to_list(),
        name="目标转化率",
        mode="lines",
        line=dict(color="#c53030", width=2, dash="dash"),
        fill=None,
    ))
    fig.update_layout(
        height=450,
        xaxis_title="周期",
        yaxis_title="转化率 (%)",
        hovermode="x unified",
    )
    st.plotly_chart(fig, use_container_width=True)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="section-header">同比对比</div>', unsafe_allow_html=True)
        yoy_display = yo_y.filter(pl.col("yoy_conversion_pct").is_not_null())
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=yoy_display["period"].to_list(),
            y=yoy_display["current_conversions"].to_list(),
            name="本期转化数",
            marker_color="#2e75b6",
        ))
        fig.add_trace(go.Bar(
            x=yoy_display["period"].to_list(),
            y=yoy_display["last_year_conversions"].to_list(),
            name="去年同期转化数",
            marker_color="#9ec5e8",
        ))
        fig.update_layout(barmode="group", height=350, xaxis_title="周期", yaxis_title="转化数")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.markdown('<div class="section-header">环比变化</div>', unsafe_allow_html=True)
        mom_display = mom.filter(pl.col("mom_conversion_pct").is_not_null())
        fig = go.Figure()
        colors = ["#38a169" if v > 0 else "#c53030" for v in mom_display["mom_conversion_pct"].to_list()]
        fig.add_trace(go.Bar(
            x=mom_display["period"].to_list(),
            y=mom_display["mom_conversion_pct"].to_list(),
            name="环比变化率",
            marker_color=colors,
        ))
        fig.update_layout(height=350, xaxis_title="周期", yaxis_title="环比变化 (%)")
        st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">目标达成明细</div>', unsafe_allow_html=True)

    target_display = target.select([
        "period", "actual_rate", "target_rate", "rate_gap",
        "target_achievement_pct", "target_status", "content_count",
    ]).sort("period", descending=True)

    def style_status(row):
        if row["target_status"] == "达标":
            return "background-color: #e6f4ea;"
        return ""

    st.dataframe(
        target_display.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "period": st.column_config.Column("周期", width="medium"),
            "actual_rate": st.column_config.NumberColumn("实际转化率(%)", format="%.2f"),
            "target_rate": st.column_config.NumberColumn("目标转化率(%)", format="%.2f"),
            "rate_gap": st.column_config.NumberColumn("差距(%)", format="%.2f"),
            "target_achievement_pct": st.column_config.NumberColumn("目标完成度(%)", format="%.2f"),
            "target_status": st.column_config.Column("状态", width="small"),
            "content_count": st.column_config.Column("内容数", width="small"),
        },
    )

elif page == "🔄 版本-转化复盘":
    st.markdown('<div class="section-header">核心复盘：版本迭代对内容转化的改善效果</div>', unsafe_allow_html=True)

    retro = version_conversion.core_retrospective_metrics()

    st.success(
        "📊 将案件系统的版本迭代、审核质量与内容发布转化率打通联动，"
        "直接呈现「版本优化 → 转化改善」的业务链路，各分组独立计算转化率、目标差距与改善幅度。"
    )

    overview = retro["overview"]
    col1, col2, col3, col4, col5, col6 = st.columns(6)

    with col1:
        st.metric("总案件数", overview["total_cases"])
    with col2:
        st.metric(
            "一次通过率",
            f"{overview['one_pass_rate']}%",
        )
    with col3:
        st.metric(
            "迭代案件占比",
            f"{overview['iteration_ratio']}%",
        )
    with col4:
        st.metric("平均版本数", overview["avg_versions"])
    with col5:
        st.metric("平均退回次数", overview["avg_reject_times"])
    with col6:
        st.metric(
            "内容关联率",
            f"{overview['content_link_ratio']}%",
            help="发布内容中关联到具体案件的比例",
        )

    best_vg = retro["best_version_group"]
    best_q = retro["best_quality"]

    col1, col2 = st.columns(2)
    with col1:
        st.info(
            f"🏆 最佳版本分组：**{best_vg['group']}**，转化提升 **{best_vg['improvement_pct']}%**，"
            f"目标差距 **{best_vg['target_gap']}%**"
        )
    with col2:
        st.info(
            f"✅ 最佳审核质量：**{best_q['quality']}**，对应平均转化率 **{best_q['avg_conversion_rate']}%**，"
            f"目标差距 **{best_q['target_gap']}%**"
        )

    st.markdown('<div class="section-header">版本分组转化改善对比（各分组独立计算）</div>', unsafe_allow_html=True)

    vg_detail = retro["version_group_detail"]

    col1, col2, col3 = st.columns(3)

    with col1:
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=vg_detail["version_group"].to_list(),
            y=vg_detail["avg_conversion_rate"].to_list(),
            name="实际转化率",
            marker_color="#2e75b6",
            text=vg_detail["avg_conversion_rate"].to_list(),
            textposition="inside",
        ))
        fig.add_trace(go.Scatter(
            x=vg_detail["version_group"].to_list(),
            y=vg_detail["avg_target_rate"].to_list(),
            name="目标转化率",
            mode="markers",
            marker=dict(color="#c53030", size=10, symbol="line-ns-open"),
        ))
        fig.update_layout(
            height=380,
            title="各版本分组：实际转化率 vs 目标转化率",
            xaxis_title="版本分组",
            yaxis_title="转化率 (%)",
            legend=dict(orientation="h", y=1.1),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = go.Figure()
        colors = ["#38a169" if v > 0 else "#c53030" for v in vg_detail["conversion_improvement_pct"].to_list()]
        fig.add_trace(go.Bar(
            x=vg_detail["version_group"].to_list(),
            y=vg_detail["conversion_improvement_pct"].to_list(),
            name="转化改善幅度",
            marker_color=colors,
            text=vg_detail["conversion_improvement_pct"].to_list(),
            textposition="outside",
        ))
        fig.add_hline(y=0, line_dash="dash", line_color="#666")
        fig.update_layout(
            height=380,
            title="相比 V1 一次成型的转化率提升 (%)",
            xaxis_title="版本分组",
            yaxis_title="转化改善 (%)",
        )
        st.plotly_chart(fig, use_container_width=True)

    with col3:
        fig = go.Figure()
        gap_colors = ["#38a169" if v <= 0 else "#c53030" for v in vg_detail["avg_target_gap"].to_list()]
        fig.add_trace(go.Bar(
            x=vg_detail["version_group"].to_list(),
            y=vg_detail["avg_target_gap"].to_list(),
            name="目标差距",
            marker_color=gap_colors,
            text=vg_detail["avg_target_gap"].to_list(),
            textposition="outside",
        ))
        fig.add_hline(y=0, line_dash="dash", line_color="#666")
        fig.update_layout(
            height=380,
            title="各版本分组目标差距 (负数=超额完成)",
            xaxis_title="版本分组",
            yaxis_title="目标差距 (%)",
        )
        st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">审核质量矩阵（各分组独立计算）</div>', unsafe_allow_html=True)

    q_matrix = retro["quality_matrix"]

    col1, col2, col3 = st.columns(3)

    with col1:
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=q_matrix["review_quality"].to_list(),
            y=q_matrix["avg_conversion_rate"].to_list(),
            name="实际转化率",
            marker_color="#2e75b6",
            text=q_matrix["avg_conversion_rate"].to_list(),
            textposition="inside",
        ))
        fig.add_trace(go.Scatter(
            x=q_matrix["review_quality"].to_list(),
            y=q_matrix["avg_target_rate"].to_list(),
            name="目标转化率",
            mode="markers",
            marker=dict(color="#c53030", size=10, symbol="line-ns-open"),
        ))
        fig.update_layout(
            height=380,
            title="各审核质量：实际转化率 vs 目标转化率",
            xaxis_title="审核质量",
            yaxis_title="转化率 (%)",
            legend=dict(orientation="h", y=1.1),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = go.Figure()
        gap_colors = ["#38a169" if v <= 0 else "#c53030" for v in q_matrix["avg_target_gap"].to_list()]
        fig.add_trace(go.Bar(
            x=q_matrix["review_quality"].to_list(),
            y=q_matrix["avg_target_gap"].to_list(),
            name="目标差距",
            marker_color=gap_colors,
            text=q_matrix["avg_target_gap"].to_list(),
            textposition="outside",
        ))
        fig.add_hline(y=0, line_dash="dash", line_color="#666")
        fig.update_layout(
            height=380,
            title="各审核质量目标差距 (负数=超额完成)",
            xaxis_title="审核质量",
            yaxis_title="目标差距 (%)",
        )
        st.plotly_chart(fig, use_container_width=True)

    with col3:
        fig = go.Figure()
        colors = ["#38a169" if v > 80 else "#c53030" for v in q_matrix["achievement_ratio_pct"].to_list()]
        fig.add_trace(go.Bar(
            x=q_matrix["review_quality"].to_list(),
            y=q_matrix["achievement_ratio_pct"].to_list(),
            name="目标达成率",
            marker_color=colors,
            text=q_matrix["achievement_ratio_pct"].to_list(),
            textposition="outside",
        ))
        fig.add_hline(y=80, line_dash="dash", line_color="#666", annotation_text="达标线 80%")
        fig.update_layout(
            height=380,
            title="各审核质量目标达成率 (%)",
            xaxis_title="审核质量",
            yaxis_title="目标达成率 (%)",
            yaxis=dict(range=[0, 100]),
        )
        st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">版本分组分周期趋势</div>', unsafe_allow_html=True)

    period_choice = st.selectbox(
        "统计周期",
        ["week", "month"],
        index=1,
        format_func=lambda x: {"week": "按周", "month": "按月"}[x],
        key="retro_period",
    )

    vg_trend = version_conversion.version_group_period_trend(period_choice)

    fig = px.line(
        vg_trend.to_pandas(),
        x="period",
        y="avg_conversion_rate",
        color="version_group",
        title="各版本分组转化率趋势",
        markers=True,
    )
    fig.update_layout(height=400, xaxis_title="周期", yaxis_title="平均转化率 (%)")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">审核质量分周期趋势</div>', unsafe_allow_html=True)

    q_trend = version_conversion.quality_period_trend(period_choice)

    fig = px.line(
        q_trend.to_pandas(),
        x="period",
        y="avg_conversion_rate",
        color="review_quality",
        title="各审核质量转化率趋势",
        markers=True,
    )
    fig.update_layout(height=400, xaxis_title="周期", yaxis_title="平均转化率 (%)")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">版本迭代与转化趋势联动</div>', unsafe_allow_html=True)

    v_vs_c = version_conversion.version_iteration_vs_conversion(period_choice)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=v_vs_c["period"].to_list(),
        y=v_vs_c["avg_case_versions"].to_list(),
        name="平均版本数",
        marker_color="#2e75b6",
        opacity=0.7,
    ))
    fig.add_trace(go.Scatter(
        x=v_vs_c["period"].to_list(),
        y=v_vs_c["avg_conversion_rate"].to_list(),
        name="实际转化率",
        mode="lines+markers",
        marker_color="#c53030",
        line=dict(width=3),
        yaxis="y2",
    ))
    fig.add_trace(go.Scatter(
        x=v_vs_c["period"].to_list(),
        y=v_vs_c["avg_target_rate"].to_list(),
        name="目标转化率",
        mode="lines",
        marker_color="#b7791f",
        line=dict(width=2, dash="dash"),
        yaxis="y2",
    ))
    fig.update_layout(
        height=450,
        xaxis_title="周期",
        yaxis=dict(title="平均版本数", side="left"),
        yaxis2=dict(title="转化率 (%)", overlaying="y", side="right"),
        legend=dict(x=0.01, y=1.1, orientation="h"),
        hovermode="x unified",
        title="版本迭代深度 vs 内容转化率趋势",
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-header">迭代-转化变化明细</div>', unsafe_allow_html=True)

    trend_detail = version_conversion.improvement_trend(period_choice)

    st.dataframe(
        trend_detail.select([
            "period", "avg_case_versions", "version_change",
            "avg_conversion_rate", "avg_target_rate", "target_gap",
            "conversion_rate_change", "improvement_per_version",
            "one_pass_ratio_pct", "iteration_ratio_pct",
        ]).sort("period", descending=True).to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "period": st.column_config.Column("周期", width="medium"),
            "avg_case_versions": st.column_config.NumberColumn("平均版本数", format="%.2f"),
            "version_change": st.column_config.NumberColumn("版本数变化", format="%.2f"),
            "avg_conversion_rate": st.column_config.NumberColumn("实际转化率(%)", format="%.2f"),
            "avg_target_rate": st.column_config.NumberColumn("目标转化率(%)", format="%.2f"),
            "target_gap": st.column_config.NumberColumn("目标差距(%)", format="%.2f"),
            "conversion_rate_change": st.column_config.NumberColumn("转化率变化(%)", format="%.2f"),
            "improvement_per_version": st.column_config.NumberColumn("每版本改善系数", format="%.4f"),
            "one_pass_ratio_pct": st.column_config.NumberColumn("一次通过率(%)", format="%.2f"),
            "iteration_ratio_pct": st.column_config.NumberColumn("迭代占比(%)", format="%.2f"),
        },
    )

    st.caption("💡 每版本改善系数 = 转化率变化 / 平均版本数变化绝对值，用于评估版本迭代的边际转化效益")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="section-header">版本分组详细指标</div>', unsafe_allow_html=True)
        st.dataframe(
            vg_detail.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "version_group": st.column_config.Column("版本分组", width="medium"),
                "content_count": st.column_config.Column("内容数", width="small"),
                "case_count": st.column_config.Column("关联案件数", width="small"),
                "avg_conversion_rate": st.column_config.NumberColumn("实际转化率(%)", format="%.2f"),
                "avg_target_rate": st.column_config.NumberColumn("目标转化率(%)", format="%.2f"),
                "avg_target_gap": st.column_config.NumberColumn("目标差距(%)", format="%.2f"),
                "avg_target_achievement_pct": st.column_config.NumberColumn("目标完成度(%)", format="%.2f"),
                "achievement_ratio_pct": st.column_config.NumberColumn("达标率(%)", format="%.2f"),
                "conversion_rate_diff": st.column_config.NumberColumn("相对V1差值(%)", format="%.2f"),
                "conversion_improvement_pct": st.column_config.NumberColumn("相对提升(%)", format="%.2f"),
                "target_gap_improvement": st.column_config.NumberColumn("差距改善(%)", format="%.2f"),
                "avg_reject_times": st.column_config.NumberColumn("平均退回次数", format="%.2f"),
                "avg_word_delta": st.column_config.Column("平均字数增减", width="small"),
            },
        )

    with col2:
        st.markdown('<div class="section-header">审核质量详细指标</div>', unsafe_allow_html=True)
        st.dataframe(
            q_matrix.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "review_quality": st.column_config.Column("审核质量", width="medium"),
                "content_count": st.column_config.Column("内容数", width="small"),
                "case_count": st.column_config.Column("关联案件数", width="small"),
                "avg_conversion_rate": st.column_config.NumberColumn("实际转化率(%)", format="%.2f"),
                "avg_target_rate": st.column_config.NumberColumn("目标转化率(%)", format="%.2f"),
                "avg_target_gap": st.column_config.NumberColumn("目标差距(%)", format="%.2f"),
                "avg_target_achievement_pct": st.column_config.NumberColumn("目标完成度(%)", format="%.2f"),
                "achievement_ratio_pct": st.column_config.NumberColumn("达标率(%)", format="%.2f"),
                "vs_baseline_rate_diff": st.column_config.NumberColumn("相对基准差值(%)", format="%.2f"),
                "vs_baseline_gap_diff": st.column_config.NumberColumn("差距改善(%)", format="%.2f"),
            },
        )

    st.markdown('<div class="section-header">内容-案件关联明细（同一分析粒度）</div>', unsafe_allow_html=True)

    enriched_data = version_conversion.get_enriched_data()

    case_type_filter = st.multiselect(
        "筛选案件类型",
        options=enriched_data["case_type"].unique().to_list() if enriched_data.height > 0 else [],
        default=[],
    )

    vg_filter = st.multiselect(
        "筛选版本分组",
        options=enriched_data["version_group"].unique().to_list() if enriched_data.height > 0 else [],
        default=[],
    )

    display_data = enriched_data
    if case_type_filter:
        display_data = display_data.filter(pl.col("case_type").is_in(case_type_filter))
    if vg_filter:
        display_data = display_data.filter(pl.col("version_group").is_in(vg_filter))

    st.dataframe(
        display_data.select([
            "schedule_id", "publish_date", "title", "content_type",
            "related_case_id", "case_type", "version_group",
            "total_versions", "review_quality", "reject_times",
            "views", "conversions", "conversion_rate",
            "target_rate", "target_gap", "target_achievement_pct", "target_status",
        ]).head(200).to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "schedule_id": st.column_config.Column("内容ID", width="small"),
            "publish_date": st.column_config.Column("发布日期", width="small"),
            "title": st.column_config.Column("标题", width="large"),
            "content_type": st.column_config.Column("内容类型", width="small"),
            "related_case_id": st.column_config.Column("关联案件", width="small"),
            "case_type": st.column_config.Column("案件类型", width="small"),
            "version_group": st.column_config.Column("版本分组", width="small"),
            "total_versions": st.column_config.Column("版本数", width="small"),
            "review_quality": st.column_config.Column("审核质量", width="small"),
            "reject_times": st.column_config.Column("退回次数", width="small"),
            "views": st.column_config.Column("浏览量", width="small"),
            "conversions": st.column_config.Column("转化数", width="small"),
            "conversion_rate": st.column_config.NumberColumn("转化率(%)", format="%.2f"),
            "target_rate": st.column_config.NumberColumn("目标(%)", format="%.2f"),
            "target_gap": st.column_config.NumberColumn("差距(%)", format="%.2f"),
            "target_achievement_pct": st.column_config.NumberColumn("完成度(%)", format="%.2f"),
            "target_status": st.column_config.Column("状态", width="small"),
        },
    )
    st.caption(f"显示前 200 条，共 {display_data.height} 条关联记录")

st.sidebar.markdown("---")
st.sidebar.caption("数据更新时间：" + datetime.now().strftime("%Y-%m-%d %H:%M"))
st.sidebar.caption("数据源：案件系统 | 邮件附件 | 收款流水 | 发布排期")
