from __future__ import annotations

import streamlit as st
import plotly.express as px

from app.services.duckdb_service import DuckDBService
from app.services.auth_service import AuthService


def render(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.header("🏢 管理总览")

    if not auth.can_access_overview(username):
        st.warning("您没有权限查看管理总览。")
        return

    _render_kpi_cards(db)
    _render_store_comparison(db)
    _render_followup_overview(db)


def _render_kpi_cards(db: DuckDBService) -> None:
    try:
        total_transactions = db.conn.execute(
            "SELECT COUNT(*) FROM cashier_transactions"
        ).fetchone()[0]

        total_members = db.conn.execute(
            "SELECT COUNT(*) FROM members"
        ).fetchone()[0]

        total_followups = db.conn.execute(
            "SELECT COUNT(*) FROM followup_records"
        ).fetchone()[0]

        completed_followups = db.conn.execute(
            "SELECT COUNT(*) FROM followup_records WHERE followup_status = 'completed'"
        ).fetchone()[0]

        completion_rate = (
            round(completed_followups / total_followups * 100, 1)
            if total_followups > 0
            else 0
        )

        expiring_soon = db.conn.execute(
            "SELECT COUNT(*) FROM inventory WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days'"
        ).fetchone()[0]

    except Exception:
        total_transactions = 0
        total_members = 0
        total_followups = 0
        completed_followups = 0
        completion_rate = 0.0
        expiring_soon = 0

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("交易笔数", f"{total_transactions:,}")
    col2.metric("会员总数", f"{total_members:,}")
    col3.metric("回访总数", f"{total_followups:,}")
    col4.metric("回访完成率", f"{completion_rate}%")
    col5.metric("近效期品种", expiring_soon, delta="90天内" if expiring_soon > 0 else None)


def _render_store_comparison(db: DuckDBService) -> None:
    st.subheader("门店对比")
    try:
        result = db.conn.execute("""
            SELECT
                c.store_id,
                COUNT(DISTINCT c.transaction_id) AS transaction_count,
                COUNT(DISTINCT c.member_id) AS member_count,
                COALESCE(SUM(c.total_amount), 0) AS total_revenue
            FROM cashier_transactions c
            GROUP BY c.store_id
            ORDER BY c.store_id
        """).fetchdf()

        if result.empty:
            st.info("暂无门店对比数据。")
            return

        import polars as pl
        df = pl.from_pandas(result)

        col1, col2 = st.columns(2)
        with col1:
            fig = px.bar(
                df.to_pandas(),
                x="store_id",
                y="transaction_count",
                title="各门店交易笔数",
                labels={"store_id": "门店", "transaction_count": "交易笔数"},
            )
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            fig = px.bar(
                df.to_pandas(),
                x="store_id",
                y="total_revenue",
                title="各门店营收",
                labels={"store_id": "门店", "total_revenue": "营收"},
            )
            st.plotly_chart(fig, use_container_width=True)

    except Exception as e:
        st.error(f"加载门店对比失败: {e}")


def _render_followup_overview(db: DuckDBService) -> None:
    st.subheader("回访进度总览")
    try:
        df = db.get_followup_completion_rate()
        if df.height == 0:
            st.info("暂无回访进度数据。")
            return

        fig = px.line(
            df.to_pandas(),
            x="month",
            y="completion_rate",
            color="store_id",
            markers=True,
            title="各门店回访完成率月度趋势",
            labels={"month": "月份", "completion_rate": "完成率(%)", "store_id": "门店"},
        )
        st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.error(f"加载回访进度总览失败: {e}")
