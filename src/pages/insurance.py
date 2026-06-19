import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import date, timedelta

from src.data import repository, polars_utils
from src.pages.ui_utils import (
    render_section_header,
    render_kpi_card,
    render_dataframe,
    render_date_range_filter,
    format_currency,
    format_percent,
)


def render_insurance_page():
    render_section_header(
        "保险材料口径对照",
        "保险理赔与门店数据对比 · 金额差异分析 · 口径偏差排查",
        "🛡️",
    )

    start_date, end_date = render_date_range_filter(
        "报案日期范围",
        default_start=date.today() - timedelta(days=180),
        default_end=date.today(),
    )

    if repository.insurance_docs is None:
        st.info("暂无保险材料数据")
        return

    ins_filtered = polars_utils.filter_by_date_range(
        repository.insurance_docs, "report_date", start_date, end_date
    )

    if ins_filtered.is_empty():
        st.info("所选日期范围内暂无保险理赔数据")
        return

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_claims = ins_filtered.shape[0]
        render_kpi_card("理赔报案总数", f"{total_claims:,}")

    with col2:
        total_insured = ins_filtered["insurance_amount"].sum()
        render_kpi_card("保险核赔总额", format_currency(total_insured))

    with col3:
        total_workshop = ins_filtered["workshop_amount"].sum()
        render_kpi_card(
            "门店申报总额",
            format_currency(total_workshop),
            delta=polars_utils.calculate_rate(
                total_workshop - total_insured, total_insured
            ),
            delta_label="偏差率",
        )

    with col4:
        diff_count = ins_filtered.filter(pl.col("has_diff")).shape[0]
        render_kpi_card(
            "存在差异案件",
            f"{diff_count:,}",
            delta=polars_utils.calculate_rate(diff_count, total_claims),
            delta_label="占比",
        )

    st.markdown("#### 保险公司口径对比")
    col_a, col_b = st.columns([1, 1])

    with col_a:
        company_summary = (
            ins_filtered.group_by("insurance_company")
            .agg(
                pl.count("doc_id").alias("案件数"),
                pl.sum("insurance_amount").alias("保险核赔"),
                pl.sum("workshop_amount").alias("门店申报"),
                pl.sum("amount_diff").alias("金额差异"),
                pl.mean("parts_count_insurance").alias("保险配件数均值"),
                pl.mean("parts_count_workshop").alias("门店配件数均值"),
            )
            .with_columns(
                (pl.col("金额差异").abs() / pl.col("保险核赔") * 100).alias("偏差率%").round(2)
            )
            .sort("金额差异", descending=True)
        )
        render_dataframe(
            company_summary,
            title="各保险公司口径对比汇总",
            height=350,
        )

    with col_b:
        status_dist = (
            ins_filtered.group_by("status")
            .agg(
                pl.count("doc_id").alias("案件数"),
                pl.sum("insurance_amount").alias("核赔金额"),
            )
            .sort("案件数", descending=True)
        )
        pdf = status_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="status",
            y="案件数",
            color="核赔金额",
            title="理赔状态分布",
            text_auto=True,
        )
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 金额差异趋势")
    diff_trend = (
        ins_filtered.with_columns(pl.col("report_date").dt.strftime("%Y-%m").alias("月份"))
        .group_by("月份")
        .agg(
            pl.count("doc_id").alias("案件数"),
            pl.sum("insurance_amount").alias("保险核赔"),
            pl.sum("workshop_amount").alias("门店申报"),
            pl.sum("amount_diff").alias("净差异"),
            pl.mean("amount_diff").alias("平均差异"),
        )
        .sort("月份")
    )
    pdf = diff_trend.to_pandas()
    fig = go.Figure()
    fig.add_trace(go.Bar(x=pdf["月份"], y=pdf["保险核赔"], name="保险核赔金额"))
    fig.add_trace(go.Bar(x=pdf["月份"], y=pdf["门店申报"], name="门店申报金额"))
    fig.add_trace(go.Scatter(x=pdf["月份"], y=pdf["净差异"], name="净差异", mode="lines+markers", yaxis="y2"))
    fig.update_layout(
        title="月度保险核赔与门店申报对比",
        height=380,
        barmode="group",
        yaxis=dict(title="金额 (¥)"),
        yaxis2=dict(title="净差异 (¥)", overlaying="y", side="right"),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 详细口径差异对照")
    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        company_filter = st.multiselect(
            "保险公司",
            options=ins_filtered["insurance_company"].unique().to_list(),
            key="ins_company_filter",
        )
    with col_f2:
        status_filter = st.multiselect(
            "理赔状态",
            options=ins_filtered["status"].unique().to_list(),
            key="ins_status_filter",
        )
    with col_f3:
        diff_only = st.checkbox("仅显示存在差异的案件", value=True, key="ins_diff_only")

    filtered = ins_filtered
    if company_filter:
        filtered = filtered.filter(pl.col("insurance_company").is_in(company_filter))
    if status_filter:
        filtered = filtered.filter(pl.col("status").is_in(status_filter))
    if diff_only:
        filtered = filtered.filter(pl.col("has_diff"))

    filtered = filtered.with_columns(
        pl.when(pl.col("parts_count_insurance") != pl.col("parts_count_workshop"))
        .then(pl.lit("不一致"))
        .otherwise(pl.lit("一致"))
        .alias("配件数对照"),
        pl.when((pl.col("labor_hours_insurance") - pl.col("labor_hours_workshop")).abs() > 0.1)
        .then(pl.lit("不一致"))
        .otherwise(pl.lit("一致"))
        .alias("工时数对照"),
        pl.when(pl.col("has_diff")).then(pl.lit("有差异")).otherwise(pl.lit("一致")).alias("金额对照"),
    )

    display_cols = [
        "doc_id", "work_order_id", "insurance_company", "claim_number",
        "report_date", "insurance_amount", "workshop_amount", "amount_diff",
        "parts_count_insurance", "parts_count_workshop", "配件数对照",
        "labor_hours_insurance", "labor_hours_workshop", "工时数对照",
        "金额对照", "status", "remark",
    ]
    render_dataframe(
        filtered.select(display_cols),
        title=f"保险材料口径对照明细（共 {filtered.shape[0]} 条）",
        height=450,
        highlight_cols=["配件数对照", "工时数对照", "金额对照"],
    )

    if repository.work_orders is not None and repository.work_order_items is not None:
        st.markdown("#### 差异案件深度排查")
        selected_doc = st.text_input(
            "输入保险单号或工单号进行深度排查",
            value="",
            key="ins_deep_search",
        )
        if selected_doc:
            doc_data = ins_filtered.filter(
                (pl.col("doc_id") == selected_doc.strip()) |
                (pl.col("work_order_id") == selected_doc.strip()) |
                (pl.col("claim_number") == selected_doc.strip())
            )
            if doc_data.is_empty():
                st.warning("未找到匹配的保险记录")
            else:
                st.markdown("**保险记录详情**")
                render_dataframe(doc_data, height=150)

                wo_id = doc_data["work_order_id"][0]
                wo_detail = repository.work_orders.filter(pl.col("work_order_id") == wo_id)
                if not wo_detail.is_empty():
                    st.markdown(f"**关联工单 {wo_id} 详情**")
                    render_dataframe(wo_detail, height=150)

                items_detail = repository.work_order_items.filter(pl.col("work_order_id") == wo_id)
                if not items_detail.is_empty():
                    st.markdown(f"**工单 {wo_id} 项目明细（用于配件口径核对）**")
                    render_dataframe(items_detail, height=300)
