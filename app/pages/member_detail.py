from __future__ import annotations

import json

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
    st.subheader("口径排查 - 从变更跳转原始记录")

    st.markdown("""
    通过会员档案变更记录，可追溯至对应批次的原始会员记录，排查数据口径偏差。
    点击**查看原始记录**按钮可查看该会员在变更批次中的完整档案快照。
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
                    st.markdown(f"**字段**: `{row['field_name']}`")
                with col2:
                    st.markdown(f"**旧值**: `{row['old_value']}` → **新值**: `{row['new_value']}`")
                    st.caption(f"变更时间: {row['changed_at']}")
                with col3:
                    batch_id = row.get("source_batch_id", "")
                    if batch_id:
                        st.caption(f"来源批次: {batch_id}")
                        if st.button(
                            f"🔍 查看原始记录",
                            key=f"trace_{row['change_id']}",
                            help="查看该会员在变更批次中的完整档案",
                        ):
                            st.session_state[f"trace_detail_{row['change_id']}"] = True

                if st.session_state.get(f"trace_detail_{row['change_id']}", False):
                    with st.expander(f"📋 原始会员记录 - {row['member_id']}", expanded=True):
                        _render_member_source_detail(db, row)

                st.divider()

    except Exception as e:
        st.error(f"加载口径排查失败: {e}")


def _render_member_source_detail(db: DuckDBService, change_row: dict) -> None:
    member_id = change_row.get("member_id", "")
    batch_id = change_row.get("source_batch_id", "")
    field_name = change_row.get("field_name", "")
    old_value = change_row.get("old_value", "")
    new_value = change_row.get("new_value", "")
    source_snapshot_json = change_row.get("source_snapshot", None)

    try:
        batch_detail = db.get_batch_detail(batch_id)
        if batch_detail:
            st.markdown("#### 📦 批次信息")
            st.json(batch_detail)

        old_snapshot = None
        if source_snapshot_json:
            try:
                old_snapshot = json.loads(source_snapshot_json)
            except Exception:
                old_snapshot = None

        new_record = db.get_member_snapshot_at_batch(member_id, batch_id)

        label_map = {
            "member_id": "会员编号",
            "member_name": "姓名",
            "phone": "电话",
            "store_id": "所属门店",
            "register_date": "注册日期",
            "chronic_disease": "慢性病",
            "allergy_info": "过敏信息",
            "last_visit_date": "最近到店日期",
            "batch_id": "来源批次",
            "imported_at": "导入时间",
        }

        col_a, col_b = st.columns(2)

        with col_a:
            st.markdown("#### 📜 变更前快照（来源记录）")
            if old_snapshot:
                for key in label_map:
                    if key in old_snapshot:
                        val = old_snapshot[key]
                        if key == field_name:
                            st.markdown(
                                f"**{label_map[key]}**: "
                                f"<span style='background-color: #ffebee; padding: 2px 6px; border-radius: 4px;'>"
                                f"{val} ← 变更前</span>",
                                unsafe_allow_html=True,
                            )
                        else:
                            st.markdown(f"**{label_map[key]}**: {val}")
                if "batch_id" in old_snapshot:
                    st.caption(f"📌 来自批次: {old_snapshot['batch_id']}")
            else:
                st.info("无变更前快照记录（可能为首次导入）。")
                st.info(f"**变更前值**\n\n`{old_value}`")

        with col_b:
            st.markdown("#### 📝 变更后记录（该批次导入行）")
            if new_record:
                for key in label_map:
                    if key in new_record:
                        val = new_record[key]
                        if key == field_name:
                            st.markdown(
                                f"**{label_map[key]}**: "
                                f"<span style='background-color: #e8f5e9; padding: 2px 6px; border-radius: 4px;'>"
                                f"{val} ← 变更后</span>",
                                unsafe_allow_html=True,
                            )
                        else:
                            st.markdown(f"**{label_map[key]}**: {val}")
                if "batch_id" in new_record:
                    st.caption(f"📌 来自批次: {new_record['batch_id']}")
            else:
                st.warning(f"未找到该批次的会员原始导入记录。")
                st.info(f"**变更后值**\n\n`{new_value}`")

        st.markdown("#### 🔄 字段变更对比")
        comp_col1, comp_col2 = st.columns(2)
        with comp_col1:
            st.error(f"**变更前**\n\n`{old_value}`")
        with comp_col2:
            st.success(f"**变更后**\n\n`{new_value}`")

    except Exception as e:
        st.error(f"加载原始会员记录失败: {e}")
