import streamlit as st
import polars as pl
from datetime import datetime

from config import ATTACHMENT_CATEGORIES, TAG_GROUPS, REGIONS
from ui_components import (
    render_region_filter,
    render_date_filter,
    display_dataframe_with_highlight,
    safe_render_chart,
)
from ui_components.chart_components import create_attachment_category_chart, create_mom_yoy_chart

st.set_page_config(
    page_title="附件材料 - 家装工地客户确认风险监测",
    page_icon="📎",
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
        project_ids = (
            repo.get_project_confirmations()
            .filter(pl.col("region") == auth_scope["region"])["project_id"]
            .to_list()
        )
        df = df.filter(pl.col("project_id").is_in(project_ids))
    return df


def main():
    st.title("📎 附件材料分析")
    st.caption("附件材料和标签分组的同环比分析，监测资料完整性趋势")

    repo = get_repository()
    from data_layer.polars_processor import PolarsProcessor
    processor = PolarsProcessor()

    st.markdown("---")

    filter_col1, filter_col2, filter_col3 = st.columns(3)

    with filter_col1:
        selected_categories = st.multiselect(
            "📂 附件类别",
            options=ATTACHMENT_CATEGORIES,
            default=ATTACHMENT_CATEGORIES,
            key="attach_category",
        )
    with filter_col2:
        selected_regions = render_region_filter(key="attach_region")
    with filter_col3:
        start_date, end_date = render_date_filter(key_prefix="attach")

    attachments = repo.get_attachments()
    if attachments.height == 0:
        st.warning("⚠️ 暂无附件数据")
        return

    attachments = apply_auth_filter(attachments)

    if selected_categories and "category" in attachments.columns:
        attachments = attachments.filter(pl.col("category").is_in(selected_categories))
    if start_date and "upload_time" in attachments.columns:
        attachments = attachments.filter(pl.col("upload_time") >= datetime.combine(start_date, datetime.min.time()))
    if end_date and "upload_time" in attachments.columns:
        attachments = attachments.filter(pl.col("upload_time") <= datetime.combine(end_date, datetime.max.time()))

    if attachments.height == 0:
        st.warning("⚠️ 当前筛选条件下无附件数据")
        return

    st.markdown("---")
    st.subheader("📊 核心指标")

    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.metric("📄 附件总数", attachments.height)
    with kpi2:
        total_size_mb = round(attachments["file_size"].sum() / (1024 * 1024), 2) if "file_size" in attachments.columns else 0
        st.metric("💾 总大小", f"{total_size_mb} MB")
    with kpi3:
        cat_count = attachments["category"].n_unique() if "category" in attachments.columns else 0
        st.metric("📂 覆盖类别", cat_count)
    with kpi4:
        proj_count = attachments["project_id"].n_unique() if "project_id" in attachments.columns else 0
        st.metric("🏗️ 涉及项目", proj_count)

    st.markdown("---")
    st.subheader("📂 附件材料分类统计")

    last_update = repo.get_last_update_time("attachments")

    def reload_attachments():
        st.cache_data.clear()
        st.rerun()

    fig = safe_render_chart(
        chart_func=create_attachment_category_chart,
        component_name="附件分类统计图",
        last_update_time=last_update,
        retry_callback=reload_attachments,
        retry_key="attach_cat_retry",
        df=attachments,
    )
    if fig:
        st.plotly_chart(fig, use_container_width=True)

    category_summary = attachments.group_by("category").agg([
        pl.count("id").alias("附件数量"),
        (pl.sum("file_size") / (1024 * 1024)).round(2).alias("总大小(MB)"),
        pl.n_unique("project_id").alias("涉及项目数"),
    ]).sort("附件数量", descending=True)

    display_dataframe_with_highlight(category_summary, page_size=len(ATTACHMENT_CATEGORIES))

    st.markdown("---")
    st.subheader("🏷️ 标签分组同环比分析")

    if "tags" in attachments.columns and "upload_time" in attachments.columns:
        tag_exploded = attachments.with_columns(
            pl.col("tags").str.split(",").alias("tag_list")
        ).explode("tag_list").filter(
            pl.col("tag_list").is_not_null() & (pl.col("tag_list") != "")
        ).with_columns(
            pl.col("tag_list").alias("tag")
        )

        if tag_exploded.height > 0:
            tag_col1, tag_col2 = st.columns([1, 3])
            with tag_col1:
                available_tags = tag_exploded["tag"].unique().to_list()
                selected_tag = st.selectbox(
                    "选择标签",
                    options=available_tags,
                    key="tag_selector",
                )

            tag_filtered = tag_exploded.filter(pl.col("tag") == selected_tag)

            if tag_filtered.height > 0:
                monthly_count = tag_filtered.group_by(
                    pl.col("upload_time").dt.truncate("1mo").alias("month")
                ).agg(
                    pl.count("id").alias("current_value")
                )

                mom_yoy_df = processor.calculate_mom_yoy(
                    monthly_count,
                    date_col="month",
                    value_col="current_value",
                )

                if mom_yoy_df.height > 0:
                    fig = safe_render_chart(
                        chart_func=create_mom_yoy_chart,
                        component_name=f"标签[{selected_tag}]同环比图",
                        last_update_time=last_update,
                        retry_callback=reload_attachments,
                        retry_key=f"tag_mom_{selected_tag}_retry",
                        df=mom_yoy_df,
                        title=f"标签「{selected_tag}」附件数量同环比分析",
                    )
                    if fig:
                        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("📂 类别同环比分析")

    cat_col1, cat_col2 = st.columns([1, 3])
    with cat_col1:
        cat_for_mom = st.selectbox(
            "选择类别进行同环比分析",
            options=ATTACHMENT_CATEGORIES,
            key="cat_mom_selector",
        )

    cat_filtered = attachments.filter(pl.col("category") == cat_for_mom)
    if cat_filtered.height > 0 and "upload_time" in cat_filtered.columns:
        monthly_cat = cat_filtered.group_by(
            pl.col("upload_time").dt.truncate("1mo").alias("month")
        ).agg(
            pl.count("id").alias("current_value")
        )

        mom_yoy_cat = processor.calculate_mom_yoy(
            monthly_cat,
            date_col="month",
            value_col="current_value",
        )

        if mom_yoy_cat.height > 0:
            fig = safe_render_chart(
                chart_func=create_mom_yoy_chart,
                component_name=f"类别[{cat_for_mom}]同环比图",
                last_update_time=last_update,
                retry_callback=reload_attachments,
                retry_key=f"cat_mom_{cat_for_mom}_retry",
                df=mom_yoy_cat,
                title=f"「{cat_for_mom}」附件数量同环比分析",
            )
            if fig:
                st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("📋 附件明细列表")

    display_cols = [
        "id", "project_id", "category", "file_name",
        "file_size", "upload_time", "uploaded_by", "tags",
    ]
    available_cols = [c for c in display_cols if c in attachments.columns]

    display_df = attachments.select(available_cols).with_columns(
        (pl.col("file_size") / (1024 * 1024)).round(2).alias("file_size_mb")
    )

    display_dataframe_with_highlight(display_df, page_size=25)

    if st.button("🔍 跳转到明细查询页面查看项目详情", type="primary"):
        st.switch_page("pages/3_🔍_明细查询.py")


if __name__ == "__main__":
    main()
