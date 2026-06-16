from __future__ import annotations

import streamlit as st
import plotly.express as px
import polars as pl

from app.services.duckdb_service import DuckDBService
from app.services.auth_service import AuthService


def render(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.header("👤 会员档案明细")

    role = auth.get_role(username)
    store_id = None
    if role != "admin":
        allowed = auth.get_allowed_stores(username) or []
        store_id = allowed[0] if allowed else None

    tab_search, tab_changes, tab_trace = st.tabs(["会员查询", "档案变更", "口径排查"])

    with tab_search:
        _render_member_search(db, store_id)

    with tab_changes:
        _render_member_changes(db, store_id)

    with tab_trace:
        _render_source_trace(db, store_id)


def _render_member_search(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("会员查询")

    member_id = st.text_input("输入会员编号", placeholder="输入会员ID查询详细档案")

    if member_id:
        try:
            detail = db.get_member_detail_with_source(member_id)
            if not detail:
                st.warning(f"未找到会员 {member_id} 的记录。")
                return

            st.markdown("### 基本信息")
            basic_fields = [
                "member_id", "member_name", "phone", "store_id",
                "register_date", "chronic_disease", "allergy_info",
                "last_visit_date",
            ]
            for field in basic_fields:
                if field in detail:
                    label_map = {
                        "member_id": "会员编号",
                        "member_name": "姓名",
                        "phone": "电话",
                        "store_id": "所属门店",
                        "register_date": "注册日期",
                        "chronic_disease": "慢性病",
                        "allergy_info": "过敏信息",
                        "last_visit_date": "最近到店日期",
                    }
                    st.markdown(f"**{label_map.get(field, field)}**: {detail[field]}")

            if "_source_batch" in detail:
                st.markdown("### 来源批次信息")
                batch = detail["_source_batch"]
                for k, v in batch.items():
                    st.markdown(f"**{k}**: {v}")

            if "_profile_changes" in detail:
                st.markdown("### 档案变更记录")
                for change in detail["_profile_changes"]:
                    st.markdown(
                        f"- **{change['field_name']}**: "
                        f"`{change['old_value']}` → `{change['new_value']}` "
                        f"({change['changed_at']})"
                    )

        except Exception as e:
            st.error(f"查询会员档案失败: {e}")


def _render_member_changes(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("档案变更汇总")

    try:
        df = db.get_member_profile_changes(store_id=store_id)
        if df.height == 0:
            st.info("暂无会员档案变更记录。")
            return

        change_by_field = df.group_by("field_name").agg(
            pl.count().alias("变更次数")
        ).sort("变更次数", descending=True)

        fig = px.bar(
            change_by_field.to_pandas(),
            x="field_name",
            y="变更次数",
            title="各字段变更频次",
        )
        st.plotly_chart(fig, use_container_width=True)

        st.dataframe(df, use_container_width=True, hide_index=True)
    except Exception as e:
        st.error(f"加载档案变更汇总失败: {e}")


def _render_source_trace(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("口径排查 - 跳转原始记录")

    st.markdown("""
    通过会员档案变更记录，可追溯至原始导入批次，排查数据口径偏差。
    点击批次编号可查看该批次的导入详情。
    """)

    try:
        df = db.get_member_profile_changes(store_id=store_id)
        if df.height == 0:
            st.info("暂无可追溯的档案变更记录。")
            return

        for row in df.to_dicts():
            with st.container():
                col1, col2, col3 = st.columns([2, 2, 1])
                with col1:
                    st.markdown(f"**会员**: {row['member_id']} - {row.get('member_name', '')}")
                    st.markdown(f"**字段**: {row['field_name']}")
                with col2:
                    st.markdown(f"**旧值**: `{row['old_value']}` → **新值**: `{row['new_value']}`")
                    st.caption(f"变更时间: {row['changed_at']}")
                with col3:
                    batch_id = row.get("source_batch_id", "")
                    if batch_id:
                        if st.button(f"📋 {batch_id[:20]}...", key=f"trace_{row['change_id']}"):
                            st.session_state["selected_batch_id"] = batch_id

        if "selected_batch_id" in st.session_state:
            st.markdown("---")
            st.subheader(f"批次详情: {st.session_state['selected_batch_id']}")
            batches = db.list_import_batches()
            batch_detail = batches.filter(
                pl.col("batch_id") == st.session_state["selected_batch_id"]
            )
            if batch_detail.height > 0:
                st.dataframe(batch_detail, use_container_width=True, hide_index=True)
            else:
                st.info("未找到该批次的数据库记录。")

    except Exception as e:
        st.error(f"加载口径排查失败: {e}")
