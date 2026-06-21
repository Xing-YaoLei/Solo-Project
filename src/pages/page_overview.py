import streamlit as st
from datetime import datetime, timedelta

from src.utils.analyzer import risk_analyzer
from src.utils.ui_components import (
    render_metric_card,
    render_delay_banner,
    plot_line_chart,
    plot_bar_chart,
    plot_funnel,
    plot_pie_chart,
    styled_dataframe,
)


def render_overview():
    st.title("📊 文书归档风险监测总览")
    st.caption("实时监测法律服务文书归档全链路风险指标")

    date_range = st.session_state.get("date_range")
    if not date_range:
        default_end = datetime(2026, 6, 20)
        default_start = default_end - timedelta(days=30)
        date_range = (default_start, default_end)

    delay_info = risk_analyzer.get_sync_delay_info()
    render_delay_banner(delay_info)

    overview = risk_analyzer.get_overview_stats(date_range)
    yoy_mom = risk_analyzer.get_review_yoy_mom(date_range[0], date_range[1])

    st.markdown("### 📌 核心指标")
    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        render_metric_card(
            "文书提交总数",
            overview.get("total_docs", 0),
            " 份",
            yoy_result=yoy_mom.get("total"),
            help_text="选定时间段内提交的文书总数",
        )

    with col2:
        render_metric_card(
            "退回率",
            overview.get("return_rate", 0),
            "%",
            yoy_result=yoy_mom.get("return_rate"),
            help_text="审核退回文书占比，越低越好",
        )

    with col3:
        render_metric_card(
            "发布率",
            overview.get("publish_rate", 0),
            "%",
            yoy_result=yoy_mom.get("publish_rate"),
            help_text="最终发布归档的文书占比，越高越好",
        )

    with col4:
        render_metric_card(
            "高风险文书",
            overview.get("high_risk_count", 0),
            " 份",
            yoy_result=yoy_mom.get("high_risk"),
            help_text="风险词命中数超过阈值的文书",
        )

    with col5:
        render_metric_card(
            "平均审核轮次",
            overview.get("avg_review_rounds", 0),
            " 轮",
            help_text="每份文书的平均审核次数",
        )

    st.markdown("---")

    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.markdown("### 📈 日度趋势")
        daily_trend = risk_analyzer.get_daily_trend(30)

        delay_annotations = risk_analyzer.get_delay_annotations()

        metrics = st.multiselect(
            "选择指标",
            ["提交数", "退回数", "发布数", "风险词总数"],
            default=["提交数", "退回数", "发布数"],
            key="overview_trend_metrics",
        )

        metric_map = {
            "提交数": "submit_count",
            "退回数": "return_count",
            "发布数": "publish_count",
            "风险词总数": "total_risk_words",
        }
        y_cols = [metric_map[m] for m in metrics if m in metric_map]

        plot_line_chart(
            daily_trend,
            "date",
            y_cols,
            title="近30天文书归档趋势",
            y_title="数量",
            delay_annotations=delay_annotations if delay_annotations else None,
        )

    with col_right:
        st.markdown("### 🎯 内容转化漏斗")
        funnel = risk_analyzer.get_content_conversion_funnel(date_range)
        plot_funnel(
            funnel,
            "stage",
            "count",
            title="提交→归档转化漏斗",
        )

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 🌍 区域分布")
        region_df = risk_analyzer.get_region_comparison(date_range)
        plot_bar_chart(
            region_df,
            "region",
            "return_rate",
            title="各区域退回率对比",
        )

    with col2:
        st.markdown("### 📑 文书类型分布")
        doc_type_df = risk_analyzer.get_doc_type_comparison(date_range)
        plot_pie_chart(
            doc_type_df,
            "doc_type",
            "total_docs",
            title="文书类型占比",
        )

    st.markdown("---")
    st.markdown("### ⚠️ 高风险文书速览")

    high_risk_samples = risk_analyzer.get_returned_samples(limit=10)
    if not high_risk_samples.is_empty():
        display_cols = [
            "case_id", "doc_id", "doc_type", "region", "lawyer",
            "risk_word_count", "risk_words", "review_date", "comments",
        ]
        available_cols = [c for c in display_cols if c in high_risk_samples.columns]
        styled_dataframe(high_risk_samples.select(available_cols), height=350)

        st.caption("💡 点击左侧导航「审核退回追踪」查看详细退回记录并支持下钻到样本")
    else:
        st.info("暂无高风险文书")
