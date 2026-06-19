import streamlit as st
import polars as pl
import plotly.express as px
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


def render_inventory_page():
    render_section_header(
        "配件库存与缺货缺口分析",
        "库存总览 · 缺货缺口 · 异常点解释 · 跳回原始记录",
        "📦",
    )

    tab1, tab2, tab3 = st.tabs(["库存总览与异常", "缺货缺口分析", "出入库历史溯源"])

    with tab1:
        _render_inventory_overview_tab()

    with tab2:
        _render_shortage_tab()

    with tab3:
        _render_history_trace_tab()


def _render_inventory_overview_tab():
    if repository.parts_inventory is None:
        st.info("暂无配件库存数据")
        return

    inv = repository.parts_inventory

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_skus = inv.shape[0]
        render_kpi_card("库存 SKU 总数", f"{total_skus:,}")

    with col2:
        total_value = (inv["unit_cost"] * inv["stock_quantity"]).sum()
        render_kpi_card("库存总价值", format_currency(total_value))

    with col3:
        out_of_stock = inv.filter(pl.col("is_out_of_stock")).shape[0]
        render_kpi_card(
            "缺货 SKU",
            f"{out_of_stock:,}",
            delta=polars_utils.calculate_rate(out_of_stock, total_skus),
            delta_label="占比",
        )

    with col4:
        below_safety = inv.filter(pl.col("is_below_safety") & ~pl.col("is_out_of_stock")).shape[0]
        render_kpi_card(
            "低于安全库存",
            f"{below_safety:,}",
            delta=polars_utils.calculate_rate(below_safety, total_skus),
            delta_label="占比",
        )

    st.markdown("#### 库存分布分析")
    col_a, col_b = st.columns([1, 1])

    with col_a:
        category_dist = (
            inv.group_by("category")
            .agg(
                pl.count("inventory_id").alias("SKU数"),
                pl.sum("stock_quantity").alias("库存总量"),
                (pl.col("unit_cost") * pl.col("stock_quantity")).sum().alias("库存金额"),
            )
            .sort("库存金额", descending=True)
        )
        pdf = category_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="category",
            y="库存金额",
            color="SKU数",
            title="各品类库存金额分布",
            text_auto=".2s",
        )
        fig.update_layout(height=360)
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        brand_dist = (
            inv.group_by("brand")
            .agg(
                pl.count("inventory_id").alias("SKU数"),
                pl.sum("stock_quantity").alias("库存总量"),
            )
            .sort("SKU数", descending=True)
            .head(10)
        )
        pdf = brand_dist.to_pandas()
        fig = px.pie(pdf, names="brand", values="SKU数", title="品牌 SKU 分布 TOP10", hole=0.4)
        fig.update_layout(height=360, legend=dict(orientation="h", yanchor="bottom", y=-0.1))
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 库存异常点检测")
    st.caption("基于 Z-score 检测库存金额异常的配件（阈值 = 2.0），用于解释异常波动")

    outliers = inv.with_columns(
        (pl.col("unit_cost") * pl.col("stock_quantity")).alias("库存金额")
    )
    outliers = polars_utils.detect_outliers(outliers, "库存金额", group_cols=["category"], threshold=2.0)

    if not outliers.is_empty():
        st.warning(f"检测到 {outliers.shape[0]} 个库存金额异常点")
        display_cols = [
            "inventory_id", "part_id", "part_name", "category", "brand",
            "unit_cost", "stock_quantity", "safety_stock",
            "is_out_of_stock", "is_below_safety", "location", "supplier",
            "库存金额",
        ]
        available_cols = [c for c in display_cols if c in outliers.columns]
        render_dataframe(
            outliers.select(available_cols),
            title="库存异常配件清单（可点击库存ID查看原始记录）",
            height=300,
        )

        selected_inv_id = st.text_input(
            "输入库存ID查看详细溯源（如 INV00001）",
            value="",
            key="inv_outlier_search",
        )
        if selected_inv_id and repository.parts_inventory_history is not None:
            inv_detail = inv.filter(pl.col("inventory_id") == selected_inv_id.strip())
            if not inv_detail.is_empty():
                st.markdown(f"**库存 {selected_inv_id} 详情**")
                render_dataframe(inv_detail, height=120)

                history = repository.parts_inventory_history.filter(
                    pl.col("inventory_id") == selected_inv_id.strip()
                ).sort("change_date", descending=True)
                if not history.is_empty():
                    st.markdown(f"**出入库历史记录（共 {history.shape[0]} 条）**")
                    render_dataframe(history, height=300)
                    st.caption("提示：可通过 original_record_ref 跳转至原始业务系统记录")
    else:
        st.success("未检测到显著的库存异常点")

    st.markdown("#### 配件库存明细")
    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        cat_filter = st.multiselect(
            "品类筛选",
            options=inv["category"].unique().to_list(),
            key="inv_cat_filter",
        )
    with col_f2:
        brand_filter = st.multiselect(
            "品牌筛选",
            options=inv["brand"].unique().to_list(),
            key="inv_brand_filter",
        )
    with col_f3:
        status_filter = st.multiselect(
            "库存状态",
            options=["正常", "缺货", "低于安全库存"],
            default=["缺货", "低于安全库存"],
            key="inv_status_filter",
        )

    filtered = inv
    if cat_filter:
        filtered = filtered.filter(pl.col("category").is_in(cat_filter))
    if brand_filter:
        filtered = filtered.filter(pl.col("brand").is_in(brand_filter))
    if status_filter:
        status_conditions = []
        if "缺货" in status_filter:
            status_conditions.append(pl.col("is_out_of_stock"))
        if "低于安全库存" in status_filter:
            status_conditions.append(pl.col("is_below_safety") & ~pl.col("is_out_of_stock"))
        if "正常" in status_filter:
            status_conditions.append(~pl.col("is_out_of_stock") & ~pl.col("is_below_safety"))
        if status_conditions:
            filtered = filtered.filter(pl.any_horizontal(status_conditions))

    filtered = filtered.with_columns(
        (pl.col("unit_cost") * pl.col("stock_quantity")).alias("库存金额"),
        pl.when(pl.col("is_out_of_stock")).then(pl.lit("缺货"))
        .when(pl.col("is_below_safety")).then(pl.lit("低于安全库存"))
        .otherwise(pl.lit("正常"))
        .alias("库存状态"),
    )

    display_cols = [
        "inventory_id", "part_id", "part_name", "category", "brand", "spec",
        "unit", "unit_cost", "selling_price", "stock_quantity", "safety_stock",
        "库存金额", "库存状态", "location", "supplier", "original_record_id",
    ]
    render_dataframe(
        filtered.select(display_cols),
        title=f"配件库存明细（共 {filtered.shape[0]} 条）",
        height=400,
    )
    st.caption("💡 通过 original_record_id 可跳转至采购系统原始记录")


def _render_shortage_tab():
    if repository.parts_shortage is None:
        st.info("暂无配件缺货数据")
        return

    shortage = repository.parts_shortage
    start_date, end_date = render_date_range_filter(
        "缺货报告日期范围",
        default_start=date.today() - timedelta(days=90),
        default_end=date.today(),
        key="shortage_date",
    )
    shortage = polars_utils.filter_by_date_range(shortage, "report_date", start_date, end_date)

    if shortage.is_empty():
        st.info("所选日期范围内暂无缺货记录")
        return

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_shortage = shortage.shape[0]
        render_kpi_card("缺货记录总数", f"{total_shortage:,}")

    with col2:
        total_shortage_qty = shortage["shortage_quantity"].sum()
        render_kpi_card("缺货总数量", f"{total_shortage_qty:,}")

    with col3:
        pending = shortage.filter(pl.col("status").is_in(["待补货", "在途"])).shape[0]
        render_kpi_card(
            "待处理缺货",
            f"{pending:,}",
            delta=polars_utils.calculate_rate(pending, total_shortage),
            delta_label="占比",
        )

    with col4:
        urgent = shortage.filter(pl.col("urgency") == "紧急").shape[0]
        render_kpi_card(
            "紧急缺货",
            f"{urgent:,}",
            delta=polars_utils.calculate_rate(urgent, total_shortage),
            delta_label="占比",
        )

    col_a, col_b = st.columns([1, 1])

    with col_a:
        urgency_dist = (
            shortage.group_by("urgency")
            .agg(
                pl.count("shortage_id").alias("记录数"),
                pl.sum("shortage_quantity").alias("缺货数量"),
            )
            .sort("记录数", descending=True)
        )
        pdf = urgency_dist.to_pandas()
        fig = px.bar(
            pdf,
            x="urgency",
            y="记录数",
            color="缺货数量",
            title="缺货紧急度分布",
            text_auto=True,
        )
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        status_dist = (
            shortage.group_by("status")
            .agg(pl.count("shortage_id").alias("记录数"))
            .sort("记录数", descending=True)
        )
        pdf = status_dist.to_pandas()
        fig = px.pie(pdf, names="status", values="记录数", title="缺货处理状态分布", hole=0.4)
        fig.update_layout(height=350, legend=dict(orientation="h", yanchor="bottom", y=-0.1))
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 配件缺货缺口 Top 分析")
    shortage_by_part = (
        shortage.group_by(["part_id", "part_name"])
        .agg(
            pl.count("shortage_id").alias("缺货次数"),
            pl.sum("shortage_quantity").alias("总缺数量"),
            pl.sum("needed_quantity").alias("总需求量"),
        )
        .with_columns(
            (pl.col("总缺数量") / pl.col("总需求量") * 100).alias("缺货率%").round(2)
        )
        .sort("总缺数量", descending=True)
        .head(15)
    )
    pdf = shortage_by_part.to_pandas()
    fig = px.bar(
        pdf,
        x="part_name",
        y=["总需求量", "总缺数量"],
        title="配件缺货缺口 Top15",
        barmode="group",
        text_auto=True,
    )
    fig.update_layout(height=380, legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 缺货明细与样本回溯")
    st.caption("点击缺货记录中的 sample_record_id 可回溯至原始样本明细")

    col_f1, col_f2 = st.columns(2)
    with col_f1:
        urgency_filter = st.multiselect(
            "紧急度",
            options=shortage["urgency"].unique().to_list(),
            default=["紧急", "高"],
            key="sh_urgency_filter",
        )
    with col_f2:
        status_filter2 = st.multiselect(
            "处理状态",
            options=shortage["status"].unique().to_list(),
            key="sh_status_filter",
        )

    filtered = shortage
    if urgency_filter:
        filtered = filtered.filter(pl.col("urgency").is_in(urgency_filter))
    if status_filter2:
        filtered = filtered.filter(pl.col("status").is_in(status_filter2))

    display_cols = [
        "shortage_id", "part_id", "part_name", "report_date",
        "requested_work_order", "needed_quantity", "stock_quantity",
        "shortage_quantity", "urgency", "status", "estimated_arrival_date",
        "supplier", "sample_record_id", "source_record_ref", "remark",
    ]
    render_dataframe(
        filtered.select(display_cols),
        title=f"缺货明细（共 {filtered.shape[0]} 条）",
        height=400,
    )

    st.markdown("#### 缺货样本明细回溯")
    selected_sample = st.text_input(
        "输入 sample_record_id 查看缺货样本明细（如 SMP1000）",
        value="",
        key="shortage_sample_search",
    )
    if selected_sample:
        sample_id = selected_sample.strip()
        sample_shortage = shortage.filter(pl.col("sample_record_id") == sample_id)

        hist_by_sample = None
        if repository.parts_inventory_history is not None:
            hist_by_sample = repository.parts_inventory_history.filter(
                pl.col("sample_record_id") == sample_id
            )

        if sample_shortage.is_empty() and (hist_by_sample is None or hist_by_sample.is_empty()):
            st.warning(f"未找到样本 {sample_id} 的缺货记录或出入库记录")
        else:
            if not sample_shortage.is_empty():
                st.markdown(f"**缺货样本 {sample_id} 详情**")
                render_dataframe(sample_shortage, height=150)

                part_id = sample_shortage["part_id"][0]
                if repository.parts_inventory is not None:
                    part_info = repository.parts_inventory.filter(pl.col("part_id") == part_id)
                    if not part_info.is_empty():
                        st.markdown(f"**配件 {part_id} 当前库存状态**")
                        render_dataframe(part_info, height=150)

                if repository.parts_inventory_history is not None:
                    source_ref = sample_shortage["source_record_ref"][0]
                    if source_ref:
                        hist = repository.parts_inventory_history.filter(
                            pl.col("history_id") == source_ref
                        )
                        if not hist.is_empty():
                            st.markdown(f"**关联出入库记录（history_id: {source_ref}）**")
                            render_dataframe(hist, height=250)
                        elif hist_by_sample is None or hist_by_sample.is_empty():
                            st.info(f"未找到 history_id={source_ref} 的原始出入库记录")

                wo_id = sample_shortage["requested_work_order"][0]
                if wo_id and repository.work_order_items is not None:
                    wo_items = repository.work_order_items.filter(
                        (pl.col("work_order_id") == wo_id) & (pl.col("item_type") == "配件")
                    )
                    if not wo_items.is_empty():
                        st.markdown(f"**关联工单 {wo_id} 的配件需求**")
                        render_dataframe(wo_items, height=250)

            if hist_by_sample is not None and not hist_by_sample.is_empty():
                if sample_shortage.is_empty():
                    st.markdown(f"**通过 sample_record_id {sample_id} 找到出入库记录**")
                else:
                    st.markdown(f"**同 sample_record_id 关联的出入库历史**")
                render_dataframe(hist_by_sample, height=250)

                for hist_row in hist_by_sample.to_dicts():
                    orig_ref = hist_row.get("original_record_ref")
                    if orig_ref:
                        st.caption(
                            f"💡 原始记录号: {orig_ref} | "
                            f"来源系统: {hist_row.get('original_source', 'N/A')} | "
                            f"关联单号: {hist_row.get('related_order_id', 'N/A')}"
                        )


def _render_history_trace_tab():
    if repository.parts_inventory_history is None:
        st.info("暂无出入库历史数据")
        return

    history = repository.parts_inventory_history
    start_date, end_date = render_date_range_filter(
        "出入库日期范围",
        default_start=date.today() - timedelta(days=90),
        default_end=date.today(),
        key="history_date",
    )
    history = history.with_columns(pl.col("change_date").cast(pl.Date).alias("date_key"))
    history = polars_utils.filter_by_date_range(history, "date_key", start_date, end_date)

    if history.is_empty():
        st.info("所选日期范围内暂无出入库记录")
        return

    col1, col2, col3 = st.columns(3)
    with col1:
        total_records = history.shape[0]
        render_kpi_card("出入库记录数", f"{total_records:,}")
    with col2:
        total_in = history.filter(pl.col("quantity_change") > 0)["quantity_change"].sum()
        render_kpi_card("总入库数量", f"{total_in:,}")
    with col3:
        total_out = abs(history.filter(pl.col("quantity_change") < 0)["quantity_change"].sum())
        render_kpi_card("总出库数量", f"{total_out:,}")

    col_a, col_b = st.columns([1, 1])
    with col_a:
        type_dist = (
            history.group_by("change_type")
            .agg(pl.count("history_id").alias("记录数"))
            .sort("记录数", descending=True)
        )
        pdf = type_dist.to_pandas()
        fig = px.bar(pdf, x="change_type", y="记录数", title="出入库类型分布", text_auto=True)
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        source_dist = (
            history.group_by("original_source")
            .agg(pl.count("history_id").alias("记录数"))
            .sort("记录数", descending=True)
        )
        pdf = source_dist.to_pandas()
        fig = px.pie(pdf, names="original_source", values="记录数", title="数据来源分布", hole=0.4)
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 出入库明细与原始记录跳转")
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        type_filter = st.multiselect(
            "操作类型",
            options=history["change_type"].unique().to_list(),
            key="hist_type_filter",
        )
    with col_f2:
        source_filter = st.multiselect(
            "数据来源",
            options=history["original_source"].unique().to_list(),
            key="hist_source_filter",
        )

    filtered = history
    if type_filter:
        filtered = filtered.filter(pl.col("change_type").is_in(type_filter))
    if source_filter:
        filtered = filtered.filter(pl.col("original_source").is_in(source_filter))

    display_cols = [
        "history_id", "inventory_id", "change_date", "change_type",
        "quantity_change", "quantity_before", "quantity_after",
        "related_order_id", "operator", "original_source",
        "original_record_ref", "sample_record_id", "remark",
    ]
    render_dataframe(
        filtered.select(display_cols).sort("change_date", descending=True),
        title=f"出入库历史明细（共 {filtered.shape[0]} 条）",
        height=450,
    )
    st.caption("💡 点击 original_record_ref 可跳转至各业务系统（采购/工单/盘点）的原始记录；通过 sample_record_id 可关联缺货记录")

    st.markdown("#### 原始记录溯源查询")
    col_s1, col_s2 = st.columns(2)
    with col_s1:
        search_type = st.selectbox(
            "搜索类型",
            options=["original_record_ref", "related_order_id", "inventory_id", "history_id", "sample_record_id"],
            key="hist_search_type",
        )
    with col_s2:
        search_value = st.text_input("输入搜索值", value="", key="hist_search_value")

    if search_value:
        if search_type == "original_record_ref":
            result = filtered.filter(pl.col("original_record_ref") == search_value.strip())
        elif search_type == "related_order_id":
            result = filtered.filter(pl.col("related_order_id") == search_value.strip())
        elif search_type == "inventory_id":
            result = filtered.filter(pl.col("inventory_id") == search_value.strip())
        elif search_type == "sample_record_id":
            result = filtered.filter(pl.col("sample_record_id") == search_value.strip())
        else:
            result = filtered.filter(pl.col("history_id") == search_value.strip())

        if not result.is_empty():
            st.success(f"找到 {result.shape[0]} 条匹配记录")
            render_dataframe(result, height=200)

            for row in result.to_dicts():
                hist_id = row.get("history_id", "")
                orig_ref = row.get("original_record_ref", "")
                sample_id = row.get("sample_record_id", "")

                if orig_ref:
                    st.caption(
                        f"📝 history_id: {hist_id} | "
                        f"原始记录号: {orig_ref} | "
                        f"来源系统: {row.get('original_source', 'N/A')}"
                    )

                if sample_id and repository.parts_shortage is not None:
                    shortage_rec = repository.parts_shortage.filter(
                        pl.col("sample_record_id") == sample_id
                    )
                    if not shortage_rec.is_empty():
                        st.markdown(f"**关联缺货记录（sample_id: {sample_id}）**")
                        render_dataframe(shortage_rec, height=150)

            if repository.work_orders is not None and search_type == "related_order_id":
                wo_id = result["related_order_id"][0]
                if wo_id and str(wo_id).startswith("WO"):
                    wo = repository.work_orders.filter(pl.col("work_order_id") == wo_id)
                    if not wo.is_empty():
                        st.markdown(f"**关联工单 {wo_id} 详情**")
                        render_dataframe(wo, height=150)
        else:
            st.warning("未找到匹配的原始记录")
