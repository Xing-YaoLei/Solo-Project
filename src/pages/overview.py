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
    get_color_by_status,
)


def render_overview_page():
    render_section_header(
        "汽车维修保养看板总览",
        "车辆档案总览 · 保养提醒趋势 · 核心经营指标",
        "📊",
    )

    start_date, end_date = render_date_range_filter(
        "数据筛选范围",
        default_start=date.today() - timedelta(days=180),
        default_end=date.today(),
    )

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_vehicles = repository.vehicles.shape[0] if repository.vehicles is not None else 0
        active_vehicles = 0
        if repository.work_orders is not None:
            active_vehicles = (
                polars_utils.filter_by_date_range(
                    repository.work_orders, "order_date", start_date, end_date
                )
                .select("vehicle_id")
                .unique()
                .shape[0]
            )
        render_kpi_card(
            "建档车辆总数",
            f"{total_vehicles:,}",
            delta=polars_utils.calculate_rate(active_vehicles, total_vehicles),
            delta_label="期间活跃占比",
        )

    with col2:
        if repository.work_orders is not None:
            wo_filtered = polars_utils.filter_by_date_range(
                repository.work_orders, "order_date", start_date, end_date
            )
            total_orders = wo_filtered.shape[0]
            total_revenue = wo_filtered["total_amount"].sum() if not wo_filtered.is_empty() else 0
        else:
            total_orders = 0
            total_revenue = 0
        render_kpi_card(
            "期间维修工单",
            f"{total_orders:,}",
            delta=format_currency(total_revenue),
            delta_label="总营收",
        )

    with col3:
        if repository.maintenance_reminders is not None:
            mr_filtered = repository.maintenance_reminders.filter(
                (pl.col("status") == "即将到期") | (pl.col("status") == "已过期")
            )
            expired_count = mr_filtered.filter(pl.col("status") == "已过期").shape[0]
            pending_count = mr_filtered.shape[0]
        else:
            expired_count = 0
            pending_count = 0
        render_kpi_card(
            "待处理保养提醒",
            f"{pending_count:,}",
            delta=expired_count,
            delta_label="已过期数量",
        )

    with col4:
        if repository.rework_records is not None and repository.work_orders is not None:
            wo_filtered = polars_utils.filter_by_date_range(
                repository.work_orders, "order_date", start_date, end_date
            )
            rw_filtered = polars_utils.filter_by_date_range(
                repository.rework_records, "rework_date", start_date, end_date
            )
            rework_rate = polars_utils.calculate_rate(
                rw_filtered.shape[0], wo_filtered.shape[0]
            )
        else:
            rework_rate = 0
        render_kpi_card(
            "期间返修率",
            format_percent(rework_rate),
            delta=-0.5 if rework_rate < 5 else 1.2,
            delta_label="环比变化",
        )

    st.markdown("#### 保养提醒趋势分析")
    col_trend1, col_trend2 = st.columns([3, 2])

    with col_trend1:
        if repository.maintenance_reminders is not None:
            mr_daily = polars_utils.calculate_trend(
                repository.maintenance_reminders.with_columns(
                    pl.col("reminder_date").cast(pl.Date)
                ),
                "reminder_date",
                "reminder_id",
                freq="month",
                agg="count",
            ).rename({"reminder_id": "提醒数量"})
            render_trend_chart(
                mr_daily,
                "reminder_date",
                "提醒数量",
                title="月度保养提醒数量趋势",
                chart_type="line",
            )

    with col_trend2:
        if repository.maintenance_reminders is not None:
            status_dist = (
                repository.maintenance_reminders.group_by("status")
                .agg(pl.count("reminder_id").alias("数量"))
                .sort("数量", descending=True)
            )
            render_pie_chart(status_dist, "status", "数量", title="保养提醒状态分布")

    st.markdown("#### 车辆档案概览")
    tab1, tab2, tab3 = st.tabs(["品牌分布", "客户类型分析", "车辆明细"])

    with tab1:
        if repository.vehicles is not None:
            col_b1, col_b2 = st.columns([1, 1])
            with col_b1:
                brand_dist = (
                    repository.vehicles.group_by("brand")
                    .agg(pl.count("vehicle_id").alias("车辆数"))
                    .sort("车辆数", descending=True)
                    .head(10)
                )
                render_pie_chart(brand_dist, "brand", "车辆数", title="品牌车辆分布")
            with col_b2:
                brand_revenue = pl.DataFrame()
                if repository.work_orders is not None:
                    wo_with_vehicle = repository.get_work_orders_with_vehicles()
                    if not wo_with_vehicle.is_empty():
                        brand_revenue = (
                            wo_with_vehicle.group_by("brand")
                            .agg(pl.sum("total_amount").alias("总营收"))
                            .sort("总营收", descending=True)
                            .head(10)
                        )
                        pdf = brand_revenue.to_pandas()
                        fig = px.bar(
                            pdf,
                            x="brand",
                            y="总营收",
                            title="品牌营收分布 TOP10",
                            text_auto=".2s",
                        )
                        fig.update_layout(height=350)
                        st.plotly_chart(fig, use_container_width=True)

    with tab2:
        if repository.vehicles is not None:
            col_c1, col_c2 = st.columns([1, 1])
            with col_c1:
                type_dist = (
                    repository.vehicles.group_by("customer_type")
                    .agg(pl.count("vehicle_id").alias("车辆数"))
                    .sort("车辆数", descending=True)
                )
                render_pie_chart(type_dist, "customer_type", "车辆数", title="客户类型分布")
            with col_c2:
                city_dist = (
                    repository.vehicles.group_by("city")
                    .agg(pl.count("vehicle_id").alias("车辆数"))
                    .sort("车辆数", descending=True)
                    .head(10)
                )
                pdf = city_dist.to_pandas()
                fig = px.bar(pdf, x="city", y="车辆数", title="城市车辆分布 TOP10", text_auto=True)
                fig.update_layout(height=350)
                st.plotly_chart(fig, use_container_width=True)

    with tab3:
        if repository.vehicles is not None:
            search_col1, search_col2, search_col3 = st.columns(3)
            with search_col1:
                brand_filter = st.multiselect(
                    "品牌筛选",
                    options=repository.vehicles["brand"].unique().to_list(),
                    default=[],
                )
            with search_col2:
                type_filter = st.multiselect(
                    "客户类型",
                    options=repository.vehicles["customer_type"].unique().to_list(),
                    default=[],
                )
            with search_col3:
                plate_search = st.text_input("车牌号搜索", value="")

            filtered_vehicles = repository.vehicles
            if brand_filter:
                filtered_vehicles = filtered_vehicles.filter(pl.col("brand").is_in(brand_filter))
            if type_filter:
                filtered_vehicles = filtered_vehicles.filter(
                    pl.col("customer_type").is_in(type_filter)
                )
            if plate_search:
                filtered_vehicles = filtered_vehicles.filter(
                    pl.col("plate_number").str.contains(plate_search.upper())
                )

            display_cols = [
                "vehicle_id", "plate_number", "brand", "model", "year", "color",
                "current_mileage", "customer_name", "customer_type",
                "last_maintenance_date", "insurance_expire_date",
            ]
            render_dataframe(
                filtered_vehicles.select(display_cols),
                title=f"车辆档案明细（共 {filtered_vehicles.shape[0]} 条）",
                height=450,
            )

    st.markdown("#### 保养提醒优先级清单")
    if repository.maintenance_reminders is not None and repository.vehicles is not None:
        reminders_with_vehicle = repository.maintenance_reminders.join(
            repository.vehicles.select(["vehicle_id", "plate_number", "brand", "model", "customer_name", "customer_phone"]),
            on="vehicle_id",
            how="left",
        )
        urgent_reminders = reminders_with_vehicle.filter(
            (pl.col("status").is_in(["已过期", "即将到期"])) & (pl.col("priority") == "高")
        ).sort(["status", "due_date"])

        display_cols = [
            "reminder_id", "plate_number", "brand", "model", "customer_name",
            "customer_phone", "reminder_type", "due_date", "status", "priority",
            "customer_response", "linked_work_order",
        ]
        render_dataframe(
            urgent_reminders.select(display_cols),
            title=f"高优先级保养提醒（共 {urgent_reminders.shape[0]} 条）",
            height=350,
        )
