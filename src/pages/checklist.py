"""
检查清单管理 - 支持跳回明细
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

if "selected_checklist" not in st.session_state:
    st.session_state.selected_checklist = None
if "checklist_view_mode" not in st.session_state:
    st.session_state.checklist_view_mode = "list"


def show():
    st.title("✅ 检查清单管理")
    st.markdown("检查清单能跳回明细，支持状态追踪")

    filters = get_common_filters(key_prefix="checklist")

    querier = DataQuerier()

    if st.session_state.checklist_view_mode == "list":
        show_checklist_list(querier, filters)
    elif st.session_state.checklist_view_mode == "detail":
        show_checklist_detail(querier)

    querier.close()


def show_checklist_list(querier: DataQuerier, filters: dict) -> None:
    checklist_df = querier.get_checklist_items(
        region_id=filters.get("region_id")
    )

    archive_df = querier.get_evidence_archive(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("检查项总数", format_number(len(checklist_df)))

    with col2:
        checked_count = checklist_df.filter(pl.col("is_checked") == True).height
        st.metric("已检查项", format_number(checked_count))

    with col3:
        unchecked_count = checklist_df.filter(pl.col("is_checked") == False).height
        st.metric("待检查项", format_number(unchecked_count))

    with col4:
        completion_rate = (checked_count / len(checklist_df) * 100) if len(checklist_df) > 0 else 0
        st.metric("完成率", format_percent(completion_rate))

    st.divider()

    show_checklist_statistics(checklist_df)

    st.divider()

    st.markdown("### 📋 检查清单列表 - 点击行查看关联的证据归档明细")

    if len(checklist_df) > 0 and len(archive_df) > 0:
        checklist_with_archive = checklist_df.join(
            archive_df.select(["archive_id", "title", "evidence_type", "archive_date"]),
            left_on="related_archive_id",
            right_on="archive_id",
            how="left"
        )
    else:
        checklist_with_archive = checklist_df.with_columns([
            pl.lit(None).alias("title"),
            pl.lit(None).alias("evidence_type"),
            pl.lit(None).alias("archive_date")
        ])

    col5, col6 = st.columns(2)
    with col5:
        category_filter = st.multiselect(
            "筛选分类",
            options=checklist_df["category"].unique().to_list() if "category" in checklist_df.columns else [],
            default=[]
        )
    with col6:
        status_filter = st.selectbox(
            "筛选状态",
            options=["全部", "已检查", "待检查"],
            index=0
        )

    filtered = checklist_with_archive
    if category_filter:
        filtered = filtered.filter(pl.col("category").is_in(category_filter))
    if status_filter == "已检查":
        filtered = filtered.filter(pl.col("is_checked") == True)
    elif status_filter == "待检查":
        filtered = filtered.filter(pl.col("is_checked") == False)

    display_df = filtered.select([
        "checklist_id", "item_no", "item_content", "category",
        "is_checked", "checked_by", "checked_at", "region_name",
        "title", "evidence_type", "archive_date", "related_archive_id",
        "remark"
    ]).with_columns([
        pl.col("is_checked").map_elements(
            lambda x: "✅ 已检查" if x else "⬜ 待检查",
            return_dtype=pl.Utf8
        ).alias("检查状态")
    ])

    event = st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        height=500,
        key="checklist_table",
        on_select="rerun",
        selection_mode="single-row"
    )

    if event and event.selection and event.selection.rows:
        selected_row = event.selection.rows[0]
        st.session_state.selected_checklist = {
            "checklist_id": display_df["checklist_id"][selected_row],
            "related_archive_id": display_df["related_archive_id"][selected_row],
            "item_no": display_df["item_no"][selected_row],
            "item_content": display_df["item_content"][selected_row]
        }
        st.session_state.checklist_view_mode = "detail"
        st.rerun()


def show_checklist_statistics(checklist_df: pl.DataFrame) -> None:
    st.markdown("### 📊 检查清单统计")

    col1, col2 = st.columns(2)

    with col1:
        if "category" in checklist_df.columns:
            category_stats = checklist_df.group_by("category").agg([
                pl.count().alias("总数"),
                (pl.col("is_checked") == True).sum().alias("已完成"),
                ((pl.col("is_checked") == True).sum() / pl.count() * 100).round(2).alias("完成率")
            ]).sort("总数", descending=True)

            fig = px.bar(
                category_stats.to_pandas(),
                x="category",
                y=["总数", "已完成"],
                title="各分类检查项完成情况",
                barmode="group",
                text_auto=True
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if "region_name" in checklist_df.columns:
            region_stats = checklist_df.group_by("region_name").agg([
                pl.count().alias("总数"),
                (pl.col("is_checked") == True).sum().alias("已完成"),
                ((pl.col("is_checked") == True).sum() / pl.count() * 100).round(2).alias("完成率")
            ]).sort("完成率", descending=False)

            fig2 = px.bar(
                region_stats.to_pandas(),
                x="region_name",
                y="完成率",
                title="各区域检查完成率(%)",
                color="完成率",
                color_continuous_scale="RdYlGn",
                text_auto=True
            )
            fig2.update_layout(height=450, yaxis_range=[0, 100])
            st.plotly_chart(fig2, use_container_width=True)

    if "checked_at" in checklist_df.columns:
        checked_df = checklist_df.filter(pl.col("is_checked") == True)
        if len(checked_df) > 0:
            trend_df = checked_df.with_columns([
                pl.col("checked_at").cast(pl.Datetime).dt.strftime("%Y-%m-%d").alias("date")
            ]).group_by("date").agg([
                pl.count().alias("当日完成数")
            ]).sort("date")

            fig3 = px.line(
                trend_df.to_pandas(),
                x="date",
                y="当日完成数",
                title="检查完成趋势",
                markers=True
            )
            fig3.update_layout(height=400)
            st.plotly_chart(fig3, use_container_width=True)


def show_checklist_detail(querier: DataQuerier) -> None:
    selection = st.session_state.selected_checklist
    checklist_id = selection.get("checklist_id")
    related_archive_id = selection.get("related_archive_id")

    st.subheader(f"📝 检查项详情 - {selection.get('item_no', '')}")
    st.info(f"**检查内容**: {selection.get('item_content', '')}")

    if st.button("← 返回清单列表", key="back_to_checklist"):
        st.session_state.checklist_view_mode = "list"
        st.session_state.selected_checklist = None
        st.rerun()

    st.divider()

    checklist_df = querier.get_checklist_items()
    item_detail = checklist_df.filter(pl.col("checklist_id") == checklist_id)

    if len(item_detail) > 0:
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**基本信息**")
            info_df = pl.DataFrame([
                {"字段": "检查项ID", "值": str(item_detail["checklist_id"][0])},
                {"字段": "项目编号", "值": str(item_detail["item_no"][0])},
                {"字段": "分类", "值": str(item_detail["category"][0])},
                {"字段": "区域", "值": str(item_detail["region_name"][0])},
                {"字段": "状态", "值": "✅ 已检查" if item_detail["is_checked"][0] else "⬜ 待检查"},
            ])
            st.dataframe(info_df.to_pandas(), use_container_width=True, hide_index=True)

        with col2:
            st.markdown("**检查信息**")
            check_df = pl.DataFrame([
                {"字段": "检查人", "值": str(item_detail["checked_by"][0] or "")},
                {"字段": "检查时间", "值": str(item_detail["checked_at"][0] or "")},
                {"字段": "备注", "值": str(item_detail["remark"][0] or "")},
                {"字段": "关联归档ID", "值": str(item_detail["related_archive_id"][0] or "")},
            ])
            st.dataframe(check_df.to_pandas(), use_container_width=True, hide_index=True)

    st.divider()

    if related_archive_id:
        st.markdown("### 🔗 关联证据归档明细")
        archive_df = querier.get_evidence_archive()
        archive_detail = archive_df.filter(pl.col("archive_id") == related_archive_id)

        if len(archive_detail) > 0:
            show_data_table(archive_detail, height=200, key="related_archive_detail")

            evidence_type = archive_detail["evidence_type"][0]
            source_id = archive_detail["source_id"][0]
            source_table = archive_detail["source_table"][0]
            sync_id = archive_detail["sync_id"][0]

            st.markdown("### 📄 原始记录跳转")
            st.info(f"证据类型: {evidence_type} | 来源表: {source_table} | 来源ID: {source_id}")

            col_jump1, col_jump2 = st.columns(2)
            with col_jump1:
                if st.button("🔄 跳转到原始记录", key="jump_to_original", type="primary"):
                    original_record = querier.get_original_record(source_table, source_id)
                    if original_record:
                        st.success("已找到原始记录！")
                        st.json(original_record, expanded=True)
                    else:
                        st.warning("未找到原始记录")

            with col_jump2:
                if st.button("📋 查看同步链路", key="view_sync_trail"):
                    show_sync_trail(sync_id, "该证据的同步审计链路")

            st.markdown("### 📎 附件信息")
            attachments_df = querier.get_evidence_attachments(archive_id=related_archive_id)
            if len(attachments_df) > 0:
                show_data_table(attachments_df, height=200, key="checklist_attachments")
            else:
                st.info("暂无附件")

            st.markdown("### ❗ 关联问题记录")
            issue_df = querier.get_issue_records()
            related_issues = issue_df.filter(pl.col("related_archive_id") == related_archive_id)
            if len(related_issues) > 0:
                show_data_table(related_issues.select([
                    "issue_no", "title", "severity", "status", "found_date", "handler"
                ]), height=200, key="checklist_related_issues")
            else:
                st.info("暂无关联问题记录")

            if sync_id:
                show_sync_trail(sync_id, "证据归档同步链路")
        else:
            st.warning("未找到关联的证据归档记录")
    else:
        st.info("该检查项未关联证据归档")
