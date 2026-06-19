import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import date, timedelta

from src.data import repository, polars_utils
from src.pages.ui_utils import (
    render_section_header,
    render_kpi_card,
    render_trend_chart,
    render_pie_chart,
    render_dataframe,
    render_date_range_filter,
    format_currency,
    format_percent,
)


def render_transactions_page():
    render_section_header(
        "收银流水与工单版本对比",
        "收银流水分析 · 工单版本追踪 · 差异对照",
        "💰",
    )

    start_date, end_date = render_date_range_filter(
        "交易日期范围",
        default_start=date.today() - timedelta(days=180),
        default_end=date.today(),
    )

    tab1, tab2, tab3 = st.tabs(["收银流水概览", "工单版本对比", "工单与流水差异分析"])

    with tab1:
        _render_cash_transactions_tab(start_date, end_date)

    with tab2:
        _render_work_order_versions_tab(start_date, end_date)

    with tab3:
        _render_diff_analysis_tab(start_date, end_date)


def _render_cash_transactions_tab(start_date: date, end_date: date):
    if repository.cash_transactions is None:
        st.info("暂无收银流水数据")
        return

    txn_filtered = polars_utils.filter_by_date_range(
        repository.cash_transactions.with_columns(
            pl.col("transaction_date").cast(pl.Date).alias("txn_date")
        ),
        "txn_date",
        start_date,
        end_date,
    )

    if txn_filtered.is_empty():
        st.info("所选日期范围内暂无数据")
        return

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_txn = txn_filtered.shape[0]
        render_kpi_card("交易总笔数", f"{total_txn:,}")

    with col2:
        total_amount = txn_filtered["total_amount"].sum()
        render_kpi_card("交易总额", format_currency(total_amount))

    with col3:
        actual_amount = txn_filtered["actual_amount"].sum()
        discount_amount = txn_filtered["discount_amount"].sum()
        render_kpi_card(
            "实收金额",
            format_currency(actual_amount),
            delta=polars_utils.calculate_rate(discount_amount, total_amount),
            delta_label="优惠占比",
        )

    with col4:
        settled_count = txn_filtered.filter(pl.col("is_settled")).shape[0]
        render_kpi_card(
            "已结算率",
            format_percent(polars_utils.calculate_rate(settled_count, total_txn)),
        )

    col_a, col_b = st.columns([3, 2])

    with col_a:
        txn_daily = (
            txn_filtered.with_columns(pl.col("transaction_date").dt.strftime("%Y-%m").alias("月份"))
            .group_by("月份")
            .agg(
                pl.count("transaction_id").alias("交易笔数"),
                pl.sum("actual_amount").alias("实收金额"),
            )
            .sort("月份")
        )
        pdf = txn_daily.to_pandas()
        fig = go.Figure()
        fig.add_trace(go.Bar(x=pdf["月份"], y=pdf["实收金额"], name="实收金额", yaxis="y"))
        fig.add_trace(go.Scatter(x=pdf["月份"], y=pdf["交易笔数"], name="交易笔数", yaxis="y2", mode="lines+markers"))
        fig.update_layout(
            title="月度收银趋势",
            height=380,
            yaxis=dict(title="金额 (¥)"),
            yaxis2=dict(title="笔数", overlaying="y", side="right"),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        pay_dist = (
            txn_filtered.group_by("payment_method")
            .agg(pl.sum("actual_amount").alias("金额"), pl.count("transaction_id").alias("笔数"))
            .sort("金额", descending=True)
        )
        render_pie_chart(pay_dist, "payment_method", "金额", title="支付方式分布")

    st.markdown("#### 收银流水明细")
    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        pay_filter = st.multiselect(
            "支付方式",
            options=txn_filtered["payment_method"].unique().to_list(),
            key="txn_pay_filter",
        )
    with col_f2:
        type_filter = st.multiselect(
            "交易类型",
            options=txn_filtered["transaction_type"].unique().to_list(),
            key="txn_type_filter",
        )
    with col_f3:
        settled_filter = st.selectbox(
            "结算状态",
            options=["全部", "已结算", "未结算"],
            key="txn_settled_filter",
        )

    filtered = txn_filtered
    if pay_filter:
        filtered = filtered.filter(pl.col("payment_method").is_in(pay_filter))
    if type_filter:
        filtered = filtered.filter(pl.col("transaction_type").is_in(type_filter))
    if settled_filter == "已结算":
        filtered = filtered.filter(pl.col("is_settled"))
    elif settled_filter == "未结算":
        filtered = filtered.filter(~pl.col("is_settled"))

    display_cols = [
        "transaction_id", "work_order_id", "transaction_date", "transaction_type",
        "total_amount", "discount_amount", "actual_amount", "payment_method",
        "insurance_claim_amount", "cashier", "is_settled", "source_version",
    ]
    render_dataframe(
        filtered.select(display_cols),
        title=f"收银流水明细（共 {filtered.shape[0]} 条）",
        height=400,
    )


def _render_work_order_versions_tab(start_date: date, end_date: date):
    if repository.work_order_versions is None or repository.work_orders is None:
        st.info("暂无工单版本数据")
        return

    versions_filtered = polars_utils.filter_by_date_range(
        repository.work_order_versions.with_columns(
            pl.col("modify_time").cast(pl.Date).alias("mod_date")
        ),
        "mod_date",
        start_date,
        end_date,
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        total_versions = versions_filtered.shape[0]
        render_kpi_card("版本变更总次数", f"{total_versions:,}")

    with col2:
        changed_orders = versions_filtered["work_order_id"].unique().shape[0]
        render_kpi_card("涉及工单数量", f"{changed_orders:,}")

    with col3:
        avg_versions = total_versions / changed_orders if changed_orders > 0 else 0
        render_kpi_card("平均变更次数", f"{avg_versions:.2f}")

    st.markdown("#### 版本变更类型分布")
    col_a, col_b = st.columns([1, 1])

    with col_a:
        change_type_dist = (
            versions_filtered.group_by("change_type")
            .agg(pl.count("version_id").alias("次数"))
            .sort("次数", descending=True)
        )
        pdf = change_type_dist.to_pandas()
        fig = px.bar(pdf, x="change_type", y="次数", title="变更类型统计", text_auto=True)
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        cost_change = (
            versions_filtered.with_columns(
                (pl.col("total_after") - pl.col("total_before")).alias("金额变动")
            )
            .group_by("change_type")
            .agg(pl.sum("金额变动").alias("总金额变动"))
            .sort("总金额变动", descending=True)
        )
        pdf = cost_change.to_pandas()
        fig = px.bar(pdf, x="change_type", y="总金额变动", title="各类型金额变动", text_auto=".2s")
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 工单版本追踪")
    selected_wo = st.text_input(
        "输入工单号查看版本历史（如 WO000001）",
        value="",
        key="wo_version_search",
    )

    if selected_wo:
        wo_versions = versions_filtered.filter(pl.col("work_order_id") == selected_wo.strip()).sort("modify_time")
        if wo_versions.is_empty():
            st.warning(f"未找到工单 {selected_wo} 的版本记录")
        else:
            display_cols = [
                "version_id", "version_number", "change_type",
                "parts_cost_before", "parts_cost_after",
                "labor_cost_before", "labor_cost_after",
                "total_before", "total_after",
                "modified_by", "modify_time", "change_note",
            ]
            render_dataframe(
                wo_versions.select(display_cols),
                title=f"工单 {selected_wo} 版本历史（共 {wo_versions.shape[0]} 个版本）",
                height=350,
            )
    else:
        st.caption("提示：输入工单号可查看该工单的完整版本变更历史")

    st.markdown("#### 多版本工单 Top 10")
    multi_version = (
        versions_filtered.group_by("work_order_id")
        .agg(
            pl.count("version_id").alias("版本数"),
            pl.max("total_after").alias("最终金额"),
            pl.min("total_before").alias("初始金额"),
        )
        .with_columns(
            (pl.col("最终金额") - pl.col("初始金额")).alias("金额变化")
        )
        .sort("版本数", descending=True)
        .head(10)
    )
    render_dataframe(
        multi_version,
        title="版本变更最多的工单 TOP10",
        height=350,
    )


def _render_diff_analysis_tab(start_date: date, end_date: date):
    if repository.work_orders is None or repository.cash_transactions is None:
        st.info("暂无数据用于对比分析")
        return

    wo_filtered = polars_utils.filter_by_date_range(
        repository.work_orders, "order_date", start_date, end_date
    )
    txn_filtered = polars_utils.filter_by_date_range(
        repository.cash_transactions.with_columns(
            pl.col("transaction_date").cast(pl.Date).alias("txn_date")
        ),
        "txn_date",
        start_date,
        end_date,
    )

    txn_by_wo = (
        txn_filtered.group_by("work_order_id")
        .agg(
            pl.count("transaction_id").alias("收银笔数"),
            pl.sum("actual_amount").alias("收银实收"),
            pl.sum("total_amount").alias("收银应收"),
            pl.max("source_version").alias("收银版本"),
        )
    )

    wo_compare = wo_filtered.join(
        txn_by_wo,
        on="work_order_id",
        how="left",
        suffix="_txn",
    ).with_columns(
        pl.col("收银实收").fill_null(0),
        pl.col("收银笔数").fill_null(0),
        (pl.col("total_amount") - pl.col("收银实收")).alias("金额差异"),
        pl.when(pl.col("收银笔数") == 0).then(pl.lit("无收银记录"))
        .when(pl.col("金额差异").abs() > 1).then(pl.lit("金额不匹配"))
        .otherwise(pl.lit("一致"))
        .alias("对照结果"),
    )

    col1, col2, col3 = st.columns(3)
    with col1:
        consistent = wo_compare.filter(pl.col("对照结果") == "一致").shape[0]
        render_kpi_card("数据一致", f"{consistent:,}")
    with col2:
        mismatch = wo_compare.filter(pl.col("对照结果") == "金额不匹配").shape[0]
        render_kpi_card("金额不匹配", f"{mismatch:,}")
    with col3:
        no_txn = wo_compare.filter(pl.col("对照结果") == "无收银记录").shape[0]
        render_kpi_card("无收银记录", f"{no_txn:,}")

    st.markdown("#### 工单与收银流水对照明细")
    result_filter = st.multiselect(
        "对照结果筛选",
        options=["一致", "金额不匹配", "无收银记录"],
        default=["金额不匹配", "无收银记录"],
    )

    display_df = wo_compare
    if result_filter:
        display_df = display_df.filter(pl.col("对照结果").is_in(result_filter))

    display_cols = [
        "work_order_id", "vehicle_id", "order_date", "status",
        "total_amount", "收银应收", "收银实收", "金额差异",
        "收银笔数", "current_version", "收银版本", "对照结果",
    ]
    render_dataframe(
        display_df.select(display_cols),
        title=f"工单与收银对照（共 {display_df.shape[0]} 条）",
        height=450,
        highlight_cols=["对照结果"],
    )

    st.markdown("#### 版本不一致分析")
    version_diff = wo_compare.filter(
        (pl.col("收银笔数") > 0) & (pl.col("current_version") != pl.col("收银版本"))
    )
    if not version_diff.is_empty():
        st.warning(f"发现 {version_diff.shape[0]} 条工单与收银流水版本号不一致")
        display_cols_v = [
            "work_order_id", "total_amount", "收银实收",
            "current_version", "收银版本", "对照结果",
        ]
        render_dataframe(
            version_diff.select(display_cols_v),
            title="版本不一致清单",
            height=300,
        )
    else:
        st.success("所有已结算工单的版本号均一致")
