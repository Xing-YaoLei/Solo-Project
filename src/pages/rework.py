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


def render_rework_page():
    render_section_header(
        "返修率复盘分析",
        "返修率趋势 · 原因分析 · 诊断与工单联动筛选 · 改善效果追踪",
        "🔧",
    )

    start_date, end_date = render_date_range_filter(
        "分析日期范围",
        default_start=date.today() - timedelta(days=365),
        default_end=date.today(),
    )

    if repository.rework_records is None or repository.work_orders is None:
        st.info("暂无返修数据")
        return

    rework = polars_utils.filter_by_date_range(
        repository.rework_records, "rework_date", start_date, end_date
    )
    work_orders = polars_utils.filter_by_date_range(
        repository.work_orders, "order_date", start_date, end_date
    )

    tab1, tab2, tab3 = st.tabs(["返修率总览", "诊断与工单联动分析", "返修改善追踪"])

    with tab1:
        _render_rework_overview(rework, work_orders)

    with tab2:
        _render_diagnosis_linked_analysis(rework, work_orders, start_date, end_date)

    with tab3:
        _render_improvement_tracking(rework, work_orders)


def _render_rework_overview(rework: pl.DataFrame, work_orders: pl.DataFrame):
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_rework = rework.shape[0]
        render_kpi_card("返修总次数", f"{total_rework:,}")

    with col2:
        reworked_orders = rework["work_order_id"].unique().shape[0]
        total_orders = work_orders.shape[0]
        rework_rate = polars_utils.calculate_rate(reworked_orders, total_orders)
        render_kpi_card(
            "返修率",
            format_percent(rework_rate),
            delta=-0.8,
            delta_label="环比",
        )

    with col3:
        rework_cost = rework["rework_cost"].sum() if not rework.is_empty() else 0
        render_kpi_card("返修总成本", format_currency(rework_cost))

    with col4:
        warranty_covered = rework.filter(pl.col("is_covered_under_warranty")).shape[0]
        render_kpi_card(
            "保修内返修",
            f"{warranty_covered:,}",
            delta=polars_utils.calculate_rate(warranty_covered, total_rework) if total_rework > 0 else 0,
            delta_label="占比",
        )

    col_a, col_b = st.columns([3, 2])

    with col_a:
        rework_daily = rework.with_columns(
            pl.col("rework_date").cast(pl.Date)
        )
        if not rework_daily.is_empty():
            rework_trend = polars_utils.calculate_trend(
                rework_daily,
                "rework_date",
                "rework_id",
                freq="month",
                agg="count",
            ).rename({"rework_id": "返修次数"})
            render_trend_chart(
                rework_trend,
                "rework_date",
                "返修次数",
                title="月度返修次数趋势",
                chart_type="bar",
            )

    with col_b:
        if not rework.is_empty():
            category_dist = (
                rework.group_by("rework_category")
                .agg(pl.count("rework_id").alias("次数"))
                .sort("次数", descending=True)
            )
            render_pie_chart(category_dist, "rework_category", "次数", title="返修类别分布")

    st.markdown("#### 返修原因深度分析")
    col_c, col_d = st.columns([1, 1])

    with col_c:
        reason_dist = (
            rework.group_by("rework_reason")
            .agg(
                pl.count("rework_id").alias("返修次数"),
                pl.sum("rework_cost").alias("返修成本"),
                pl.mean("rework_cost").alias("平均成本"),
            )
            .sort("返修次数", descending=True)
            .head(10)
        )
        pdf = reason_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="rework_reason",
            y="返修次数",
            color="返修成本",
            title="返修原因 TOP10",
            text_auto=True,
        )
        fig.update_layout(height=380, xaxis_tickangle=-30)
        st.plotly_chart(fig, use_container_width=True)

    with col_d:
        person_dist = (
            rework.group_by("responsible_person")
            .agg(
                pl.count("rework_id").alias("负责返修次数"),
                pl.sum("rework_cost").alias("返修成本"),
            )
            .sort("负责返修次数", descending=True)
            .head(10)
        )
        pdf = person_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="responsible_person",
            y="负责返修次数",
            color="返修成本",
            title="责任人返修统计 TOP10",
            text_auto=True,
        )
        fig.update_layout(height=380)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 返修明细清单")
    if not rework.is_empty() and repository.vehicles is not None:
        rework_with_vehicle = rework.join(
            repository.work_orders.select(["work_order_id", "vehicle_id"]),
            on="work_order_id",
            how="left",
        ).join(
            repository.vehicles.select(["vehicle_id", "plate_number", "brand", "model"]),
            on="vehicle_id",
            how="left",
        )

        display_cols = [
            "rework_id", "work_order_id", "rework_order_id",
            "plate_number", "brand", "model",
            "rework_date", "rework_reason", "rework_category",
            "responsible_person", "rework_cost", "parts_cost", "labor_cost",
            "is_covered_under_warranty", "resolution",
        ]
        available_cols = [c for c in display_cols if c in rework_with_vehicle.columns]
        render_dataframe(
            rework_with_vehicle.select(available_cols),
            title=f"返修明细（共 {rework_with_vehicle.shape[0]} 条）",
            height=400,
        )


def _render_diagnosis_linked_analysis(
    rework: pl.DataFrame,
    work_orders: pl.DataFrame,
    start_date: date,
    end_date: date,
):
    st.markdown("#### 诊断结果与工单项目联动筛选")
    st.caption("通过诊断结果筛选返修工单，联动查看相关工单项目")

    if repository.diagnosis_results is None or repository.work_order_items is None:
        st.info("暂无诊断结果或工单项目数据")
        return

    diagnosis = polars_utils.filter_by_date_range(
        repository.diagnosis_results, "diagnosis_date", start_date, end_date
    )
    work_items = repository.work_order_items

    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        diag_result_filter = st.multiselect(
            "诊断结果",
            options=diagnosis["diagnosis_result"].unique().to_list() if not diagnosis.is_empty() else [],
            default=["需要维修", "存在隐患"],
            key="diag_result_filter",
        )
    with col_f2:
        severity_filter = st.multiselect(
            "严重程度",
            options=diagnosis["severity"].unique().to_list() if not diagnosis.is_empty() else [],
            key="severity_filter",
        )
    with col_f3:
        item_type_filter = st.multiselect(
            "工单项目类型",
            options=["配件", "工时"],
            default=["配件", "工时"],
            key="item_type_filter",
        )

    filtered_diag = diagnosis
    if diag_result_filter:
        filtered_diag = filtered_diag.filter(pl.col("diagnosis_result").is_in(diag_result_filter))
    if severity_filter:
        filtered_diag = filtered_diag.filter(pl.col("severity").is_in(severity_filter))

    if filtered_diag.is_empty():
        st.info("所选筛选条件下暂无诊断记录")
        return

    related_wo_ids = filtered_diag["work_order_id"].unique().to_list()
    related_rework = rework.filter(pl.col("work_order_id").is_in(related_wo_ids))
    related_items = work_items.filter(pl.col("work_order_id").is_in(related_wo_ids))
    if item_type_filter:
        related_items = related_items.filter(pl.col("item_type").is_in(item_type_filter))

    col_m1, col_m2, col_m3, col_m4 = st.columns(4)
    with col_m1:
        render_kpi_card("关联诊断数", f"{filtered_diag.shape[0]:,}")
    with col_m2:
        render_kpi_card("关联工单数", f"{len(related_wo_ids):,}")
    with col_m3:
        render_kpi_card("关联返修数", f"{related_rework.shape[0]:,}")
    with col_m4:
        if not related_items.is_empty():
            items_total = related_items["subtotal"].sum()
            render_kpi_card("关联项目金额", format_currency(items_total))
        else:
            render_kpi_card("关联项目金额", "¥0.00")

    st.markdown("#### 诊断项目分布")
    if not filtered_diag.is_empty():
        diag_item_dist = (
            filtered_diag.group_by(["diagnosis_item", "diagnosis_result"])
            .agg(pl.count("diagnosis_id").alias("诊断次数"))
            .sort("诊断次数", descending=True)
            .head(15)
        )
        pdf = diag_item_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="diagnosis_item",
            y="诊断次数",
            color="diagnosis_result",
            title="诊断项目分布（按诊断结果）",
            text_auto=True,
        )
        fig.update_layout(height=380, xaxis_tickangle=-30)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 关联工单项目分析")
    if not related_items.is_empty():
        item_category_dist = (
            related_items.group_by(["item_type", "category"])
            .agg(
                pl.count("item_id").alias("项目数"),
                pl.sum("subtotal").alias("金额"),
            )
            .sort("金额", descending=True)
            .head(15)
        )
        pdf = item_category_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="category",
            y="金额",
            color="item_type",
            title="工单项目类别金额分布",
            text_auto=".2s",
        )
        fig.update_layout(height=380, xaxis_tickangle=-30)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 诊断与返修联动明细")
    selected_wo = st.selectbox(
        "选择工单号查看诊断-项目-返修联动明细",
        options=["全部"] + related_wo_ids,
        key="linked_wo_select",
    )

    if selected_wo != "全部":
        wo_diag = filtered_diag.filter(pl.col("work_order_id") == selected_wo)
        wo_items = related_items.filter(pl.col("work_order_id") == selected_wo)
        wo_rework = related_rework.filter(pl.col("work_order_id") == selected_wo)

        col_d1, col_d2 = st.columns(2)
        with col_d1:
            st.markdown(f"**工单 {selected_wo} 诊断结果**")
            if not wo_diag.is_empty():
                render_dataframe(wo_diag, height=200)
            else:
                st.info("该工单无匹配的诊断记录")

        with col_d2:
            st.markdown(f"**工单 {selected_wo} 项目明细**")
            if not wo_items.is_empty():
                render_dataframe(wo_items, height=200)
            else:
                st.info("该工单无匹配的项目记录")

        if not wo_rework.is_empty():
            st.markdown(f"**工单 {selected_wo} 返修记录**")
            render_dataframe(wo_rework, height=150)
    else:
        if not related_rework.is_empty():
            render_dataframe(
                related_rework,
                title=f"关联返修记录（共 {related_rework.shape[0]} 条）",
                height=300,
            )


def _render_improvement_tracking(rework: pl.DataFrame, work_orders: pl.DataFrame):
    st.markdown("#### 返修率改善追踪")
    st.caption("按月/周分析返修率变化趋势，评估改善措施效果")

    if rework.is_empty() or work_orders.is_empty():
        st.info("数据不足，无法进行改善分析")
        return

    col_p1, col_p2 = st.columns(2)
    with col_p1:
        period = st.selectbox("分析周期", options=["月", "周"], index=0, key="imp_period")
    with col_p2:
        baseline_months = st.slider("基准期月数", 1, 6, 3, key="imp_baseline")

    freq = "month" if period == "月" else "week"
    period_col = f"{period}度"

    wo_with_period = polars_utils.add_period_column(
        work_orders.with_columns(pl.col("order_date").cast(pl.Date)),
        "order_date",
        freq,
        period_col,
    )
    rework_with_period = polars_utils.add_period_column(
        rework.with_columns(pl.col("rework_date").cast(pl.Date)),
        "rework_date",
        freq,
        period_col,
    )

    wo_period = wo_with_period.group_by(period_col).agg(
        pl.count("work_order_id").alias("总工单数")
    )
    rw_period = rework_with_period.group_by(period_col).agg(
        pl.n_unique("work_order_id").alias("返修工单数")
    )

    rate_trend = wo_period.join(rw_period, on=period_col, how="left").with_columns(
        pl.col("返修工单数").fill_null(0),
        (pl.col("返修工单数") / pl.col("总工单数") * 100).alias("返修率%").round(2),
    ).sort(period_col)

    pdf = rate_trend.to_pandas()
    fig = go.Figure()
    fig.add_trace(go.Bar(x=pdf[period_col], y=pdf["总工单数"], name="总工单数", yaxis="y"))
    fig.add_trace(go.Bar(x=pdf[period_col], y=pdf["返修工单数"], name="返修工单数", yaxis="y"))
    fig.add_trace(go.Scatter(x=pdf[period_col], y=pdf["返修率%"], name="返修率%", mode="lines+markers", yaxis="y2", line=dict(width=3)))
    fig.update_layout(
        title=f"{period}度返修率变化趋势",
        height=400,
        barmode="group",
        yaxis=dict(title="工单数"),
        yaxis2=dict(title="返修率 (%)", overlaying="y", side="right", range=[0, max(pdf["返修率%"].max() * 1.5, 10)]),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig, use_container_width=True)

    if rate_trend.shape[0] >= baseline_months + 1:
        baseline_rate = rate_trend.head(baseline_months)["返修率%"].mean()
        current_rate = rate_trend.tail(1)["返修率%"][0]
        improvement = baseline_rate - current_rate

        col_i1, col_i2, col_i3 = st.columns(3)
        with col_i1:
            render_kpi_card("基准期平均返修率", format_percent(baseline_rate))
        with col_i2:
            render_kpi_card("最新返修率", format_percent(current_rate))
        with col_i3:
            delta_icon = "✓" if improvement >= 0 else "✗"
            render_kpi_card(
                f"{delta_icon} 改善幅度",
                f"{improvement:+.2f} 个百分点",
            )

        if improvement > 0:
            st.success(f"🎉 返修率相比基准期下降了 {improvement:.2f} 个百分点，改善措施有效！")
        elif improvement < 0:
            st.warning(f"⚠️ 返修率相比基准期上升了 {abs(improvement):.2f} 个百分点，需要加强质量管控")
        else:
            st.info("返修率与基准期持平")

    st.markdown("#### 返修原因改善趋势")
    if not rework.is_empty():
        reason_trend = polars_utils.add_period_column(
            rework.with_columns(pl.col("rework_date").cast(pl.Date)),
            "rework_date",
            freq,
            period_col,
        )
        reason_trend = (
            reason_trend.group_by([period_col, "rework_reason"])
            .agg(pl.count("rework_id").alias("次数"))
            .sort([period_col, "次数"], descending=[False, True])
        )

        top_reasons = (
            rework.group_by("rework_reason")
            .agg(pl.count("rework_id").alias("总次数"))
            .sort("总次数", descending=True)
            .head(5)["rework_reason"]
            .to_list()
        )

        reason_trend_top = reason_trend.filter(pl.col("rework_reason").is_in(top_reasons))
        pdf = reason_trend_top.to_pandas()
        fig = px.line(
            pdf,
            x=period_col,
            y="次数",
            color="rework_reason",
            title="主要返修原因变化趋势（TOP5）",
            markers=True,
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 返修闭环情况")
    if not rework.is_empty():
        resolution_dist = (
            rework.group_by("resolution")
            .agg(
                pl.count("rework_id").alias("次数"),
                pl.sum("rework_cost").alias("成本"),
            )
            .sort("次数", descending=True)
        )
        pdf = resolution_dist.to_pandas()
        fig = px.pie(
            pdf,
            names="resolution",
            values="次数",
            title="返修结果分布",
            hole=0.4,
        )
        fig.update_layout(height=380)
        st.plotly_chart(fig, use_container_width=True)

        render_dataframe(
            resolution_dist,
            title="返修闭环结果统计",
            height=250,
        )
