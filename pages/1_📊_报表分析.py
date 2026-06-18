import streamlit as st
import polars as pl
from datetime import datetime, date

from config import REGIONS, RISK_LEVELS
from ui_components import (
    render_region_filter,
    render_risk_filter,
    render_date_filter,
    render_kpi_card,
    display_dataframe_with_highlight,
    safe_render_chart,
)
from ui_components.chart_components import (
    create_region_completeness_chart,
    create_timeline_chart,
    create_mom_yoy_chart,
)

st.set_page_config(
    page_title="报表分析 - 家装工地客户确认风险监测",
    page_icon="📊",
    layout="wide",
)


@st.cache_resource
def get_repository():
    from data_layer import DataRepository
    return DataRepository()


def apply_auth_filter(df: pl.DataFrame) -> pl.DataFrame:
    repo = get_repository()
    user_id = st.session_state.get("current_user_id", "U004")
    auth_scope = repo.get_auth_scope(user_id)

    if auth_scope and auth_scope.get("region"):
        df = df.filter(pl.col("region") == auth_scope["region"])
    if auth_scope and auth_scope.get("allowed_project_ids"):
        df = df.filter(pl.col("project_id").is_in(auth_scope["allowed_project_ids"]))
    return df


def main():
    st.title("📊 报表分析")
    st.caption("按资料完整率、日期和区域维度进行多维度比较分析")

    repo = get_repository()
    from data_layer.polars_processor import PolarsProcessor
    processor = PolarsProcessor()

    st.markdown("---")

    filter_col1, filter_col2, filter_col3 = st.columns(3)

    with filter_col1:
        selected_regions = render_region_filter(key="report_region")
    with filter_col2:
        selected_risks = render_risk_filter(key="report_risk")
    with filter_col3:
        start_date, end_date = render_date_filter(key_prefix="report")

    confirmations = repo.get_project_confirmations()

    if confirmations.height == 0:
        st.warning("⚠️ 暂无项目确认数据，请先同步数据")
        return

    confirmations = apply_auth_filter(confirmations)

    if selected_regions and "region" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("region").is_in(selected_regions))
    if selected_risks and "risk_level" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("risk_level").is_in(selected_risks))
    if start_date and "confirmation_date" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("confirmation_date") >= datetime.combine(start_date, datetime.min.time()))
    if end_date and "confirmation_date" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("confirmation_date") <= datetime.combine(end_date, datetime.max.time()))

    if confirmations.height == 0:
        st.warning("⚠️ 当前筛选条件下无数据")
        return

    st.markdown("---")
    st.subheader("📈 核心指标")

    kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)

    with kpi1:
        st.metric("项目总数", confirmations.height)
    with kpi2:
        avg_comp = round(confirmations["overall_completeness"].mean(), 2) if "overall_completeness" in confirmations.columns else 0
        st.metric("平均完整率", f"{avg_comp}%")
    with kpi3:
        complete_90 = confirmations.filter(pl.col("overall_completeness") >= 90).height if "overall_completeness" in confirmations.columns else 0
        pct = round(complete_90 / confirmations.height * 100, 1) if confirmations.height > 0 else 0
        st.metric("完整率≥90%", f"{complete_90}个", f"{pct}%")
    with kpi4:
        complete_50 = confirmations.filter(pl.col("overall_completeness") < 50).height if "overall_completeness" in confirmations.columns else 0
        pct2 = round(complete_50 / confirmations.height * 100, 1) if confirmations.height > 0 else 0
        st.metric("完整率<50%", f"{complete_50}个", f"{pct2}%")
    with kpi5:
        design_ok = confirmations.filter(pl.col("design_confirmed") == True).height if "design_confirmed" in confirmations.columns else 0
        payment_ok = confirmations.filter(pl.col("payment_confirmed") == True).height if "payment_confirmed" in confirmations.columns else 0
        purchase_ok = confirmations.filter(pl.col("purchase_confirmed") == True).height if "purchase_confirmed" in confirmations.columns else 0
        st.metric("三项全确认", f"{min(design_ok, payment_ok, purchase_ok)}个")

    st.markdown("---")
    st.subheader("🗺️ 区域维度比较")

    region_summary = processor.compare_by_region(confirmations)
    if region_summary.height > 0:
        last_update = repo.get_last_update_time("project_confirmations")

        def retry_region():
            repo.refresh_project_confirmations()

        fig = safe_render_chart(
            chart_func=create_region_completeness_chart,
            component_name="区域完整率对比图",
            last_update_time=last_update,
            retry_callback=retry_region,
            retry_key="region_chart_retry",
            df=confirmations,
        )
        if fig:
            st.plotly_chart(fig, use_container_width=True)

        st.markdown("##### 区域明细表")
        display_dataframe_with_highlight(
            region_summary,
            highlight_col="avg_completeness",
            highlight_threshold=70,
        )
    else:
        st.info("暂无区域数据")

    st.markdown("---")
    st.subheader("📅 日期维度比较")

    if "confirmation_date" in confirmations.columns:
        timeline_df = processor.compare_by_date(confirmations, date_col="confirmation_date")
        if timeline_df.height > 0:
            fig = safe_render_chart(
                chart_func=create_timeline_chart,
                component_name="确认趋势时间线图",
                last_update_time=last_update,
                df=confirmations,
                date_col="confirmation_date",
            )
            if fig:
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("##### 每日明细")
            display_dataframe_with_highlight(
                timeline_df,
                highlight_col="avg_completeness",
                highlight_threshold=70,
            )

    st.markdown("---")
    st.subheader("📊 同环比分析")

    comp_col1, comp_col2 = st.columns([1, 3])

    with comp_col1:
        mom_yoy_metric = st.selectbox(
            "选择分析指标",
            options=["overall_completeness"],
            format_func=lambda x: {"overall_completeness": "资料完整率"}.get(x, x),
        )

    if "confirmation_date" in confirmations.columns and mom_yoy_metric in confirmations.columns:
        mom_yoy_df = processor.calculate_mom_yoy(
            confirmations,
            date_col="confirmation_date",
            value_col=mom_yoy_metric,
        )
        if mom_yoy_df.height > 0:
            fig = safe_render_chart(
                chart_func=create_mom_yoy_chart,
                component_name="同环比分析图",
                df=mom_yoy_df,
                title="资料完整率同环比分析",
            )
            if fig:
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("##### 同环比明细表")
            display_df = mom_yoy_df.with_columns([
                pl.col("month").dt.strftime("%Y-%m").alias("月份"),
            ]).select([
                "月份", "current_value", "prev_month_value", "mom_rate",
                "prev_year_value", "yoy_rate",
            ]).to_pandas()
            st.dataframe(display_df, use_container_width=True)

    st.markdown("---")
    st.subheader("📋 资料完整率排行榜")

    sort_col1, sort_col2 = st.columns(2)
    with sort_col1:
        sort_order = st.radio("排序方式", ["完整率升序（风险高在前）", "完整率降序（风险低在前）"], horizontal=True)
    with sort_col2:
        top_n = st.slider("显示数量", min_value=10, max_value=100, value=20, step=10)

    sorted_df = confirmations.sort(
        "overall_completeness",
        descending=("降序" in sort_order),
    ).head(top_n)

    display_dataframe_with_highlight(
        sorted_df.select([
            "project_id", "project_name", "region", "customer_name",
            "overall_completeness", "risk_level",
            "design_confirmed", "payment_confirmed", "purchase_confirmed",
        ]),
        highlight_col="overall_completeness",
        highlight_threshold=70,
        page_size=top_n,
    )


if __name__ == "__main__":
    main()
