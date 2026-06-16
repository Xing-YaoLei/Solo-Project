from __future__ import annotations

import streamlit as st

from app.services.duckdb_service import DuckDBService
from app.services.auth_service import AuthService


def render(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.header("📝 处方注释")

    if not auth.can_annotate_prescription(username):
        st.warning("您没有权限进行处方注释，请联系管理员。")
        return

    tab_new, tab_history = st.tabs(["新增注释", "注释历史"])

    with tab_new:
        _render_new_annotation(db, auth, username)

    with tab_history:
        _render_annotation_history(db, auth, username)


def _render_new_annotation(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.subheader("新增处方注释")

    pharmacist_id = username

    prescription_id = st.text_input("处方编号", placeholder="输入处方编号")
    transaction_id = st.text_input("关联交易编号", placeholder="输入交易编号")

    annotation_text = st.text_area(
        "注释内容",
        placeholder="处方信息不清晰时的补充说明，如：字迹模糊、剂量存疑、适应症不明确等",
        height=150,
    )

    if st.button("提交注释", type="primary"):
        if not prescription_id or not annotation_text:
            st.error("请填写处方编号和注释内容。")
            return

        annotation_id = AuthService.generate_annotation_id(prescription_id, pharmacist_id)
        try:
            db.add_prescription_annotation(
                annotation_id=annotation_id,
                prescription_id=prescription_id,
                transaction_id=transaction_id,
                pharmacist_id=pharmacist_id,
                annotation_text=annotation_text,
            )
            st.success(f"注释已保存！注释编号: {annotation_id}")
        except Exception as e:
            st.error(f"保存注释失败: {e}")


def _render_annotation_history(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.subheader("注释历史")

    search_prescription = st.text_input("搜索处方编号", placeholder="输入处方编号查询")

    if search_prescription:
        try:
            annotations = db.get_prescription_annotations(search_prescription)
            if not annotations:
                st.info(f"处方 {search_prescription} 暂无注释记录。")
                return

            for ann in annotations:
                with st.container():
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        st.markdown(f"**注释内容**: {ann['annotation_text']}")
                    with col2:
                        st.caption(f"药师: {ann['pharmacist_id']}")
                        st.caption(f"时间: {ann['created_at']}")
                    st.divider()
        except Exception as e:
            st.error(f"查询注释失败: {e}")
