from __future__ import annotations

import streamlit as st
import plotly.express as px
import polars as pl

from app.services.duckdb_service import DuckDBService
from app.services.auth_service import AuthService


def render(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.header("🔄 用药回访追踪")

    role = auth.get_role(username)
    store_id = None
    pharmacist_id = None

    if role == "admin":
        stores = _get_available_stores(db)
        selected_store = st.selectbox("选择门店", ["全部"] + stores)
        store_id = None if selected_store == "全部" else selected_store
    else:
        allowed = auth.get_allowed_stores(username) or []
        store_id = allowed[0] if allowed else None
        pharmacist_id = username
        st.info(f"当前模式：仅显示您负责的回访记录（{username}）")

    _render_completion_trend(db, store_id, pharmacist_id)
    _render_followup_table(db, store_id, pharmacist_id)


def _get_available_stores(db: DuckDBService) -> list[str]:
    try:
        result = db.conn.execute(
            "SELECT DISTINCT store_id FROM followup_records ORDER BY store_id"
        ).fetchall()
        return [row[0] for row in result]
    except Exception:
        return []


def _render_completion_trend(
    db: DuckDBService,
    store_id: str | None,
    pharmacist_id: str | None,
) -> None:
    st.subheader("📈 回访完成率趋势")
    try:
        df = db.get_followup_completion_rate(store_id, pharmacist_id)
        if df.height == 0:
            st.info("暂无回访完成率数据，请先导入回访记录。")
            return

        fig = px.line(
            df.to_pandas(),
            x="month",
            y="completion_rate",
            color="store_id" if store_id is None else "pharmacist_id",
            markers=True,
            title="回访完成率月度趋势",
            labels={"month": "月份", "completion_rate": "完成率(%)", "store_id": "门店", "pharmacist_id": "药师"},
        )
        st.plotly_chart(fig, use_container_width=True)

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("总回访数", int(df["total"].sum()))
        with col2:
            st.metric("已完成", int(df["completed"].sum()))
        with col3:
            avg_rate = df["completion_rate"].mean()
            st.metric("平均完成率", f"{avg_rate:.1f}%")
    except Exception as e:
        st.error(f"加载回访完成率趋势失败: {e}")


def _render_followup_table(
    db: DuckDBService,
    store_id: str | None,
    pharmacist_id: str | None,
) -> None:
    st.subheader("📋 回访记录明细")
    try:
        df = db.get_merged_followup_view(store_id)
        if df.height == 0:
            st.info("暂无回访记录。")
            return

        if pharmacist_id:
            df = df.filter(pl.col("pharmacist_id") == pharmacist_id)

        status_filter = st.multiselect(
            "筛选状态",
            options=df["followup_status"].unique().to_list(),
            default=df["followup_status"].unique().to_list(),
        )
        if status_filter:
            df = df.filter(pl.col("followup_status").is_in(status_filter))

        result_type_filter = st.multiselect(
            "筛选回访结果",
            options=df["followup_result"].unique().to_list() if "followup_result" in df.columns else [],
            default=df["followup_result"].unique().to_list() if "followup_result" in df.columns else [],
        )
        if result_type_filter and "followup_result" in df.columns:
            df = df.filter(pl.col("followup_result").is_in(result_type_filter))

        st.dataframe(df, use_container_width=True, hide_index=True)
    except Exception as e:
        st.error(f"加载回访记录明细失败: {e}")
