from __future__ import annotations

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import polars as pl

from app.services.duckdb_service import DuckDBService
from app.services.auth_service import AuthService


def render(db: DuckDBService, auth: AuthService, username: str) -> None:
    st.header("📊 分析总览")

    if not auth.can_access_analysis(username):
        st.warning("您没有权限查看分析总览，请联系管理员。")
        return

    store_id = None
    if auth.get_role(username) != "admin":
        stores = auth.get_allowed_stores(username) or []
        if stores:
            store_id = stores[0]

    _render_prescription_distribution(db, store_id)
    _render_pharmacist_funnel(db, store_id)
    _render_batch_expiry_ranking(db, store_id)
    _render_member_profile_changes_chart(db, store_id)


def _render_prescription_distribution(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("📷 处方照片分布")
    try:
        df = db.get_prescription_photo_distribution(store_id)
        if df.height == 0:
            st.info("暂无处方照片分布数据，请先导入收银数据。")
            return

        fig = px.histogram(
            df.to_pandas(),
            x="store_id",
            color="has_prescription",
            barmode="group",
            labels={"store_id": "门店", "has_prescription": "有处方"},
            title="各门店处方分布",
        )
        st.plotly_chart(fig, use_container_width=True)

        with st.expander("查看明细"):
            st.dataframe(df, use_container_width=True)
    except Exception as e:
        st.error(f"加载处方照片分布失败: {e}")


def _render_pharmacist_funnel(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("🔬 药师意见漏斗")
    try:
        df = db.get_pharmacist_opinion_funnel(store_id)
        if df.height == 0:
            st.info("暂无药师意见漏斗数据，请先导入回访记录。")
            return

        funnel_data = df.select([
            "pharmacist_id",
            "total_followups",
            "completed",
            "in_progress",
            "pending",
            "effective",
            "adjusted",
            "side_effect",
            "no_response",
        ])

        pd_df = funnel_data.to_pandas()

        stages = ["total_followups", "completed", "effective", "adjusted"]
        stage_labels = ["总回访", "已完成", "有效", "调整用药"]

        for _, row in pd_df.iterrows():
            values = [int(row[s]) for s in stages]
            fig = go.Figure(go.Funnel(
                y=stage_labels,
                x=values,
                name=row["pharmacist_id"],
            ))
            fig.update_layout(title=f"药师 {row['pharmacist_id']} 意见漏斗")
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("查看完整漏斗数据"):
            st.dataframe(df, use_container_width=True)
    except Exception as e:
        st.error(f"加载药师意见漏斗失败: {e}")


def _render_batch_expiry_ranking(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("⏰ 批号效期排行")
    try:
        df = db.get_batch_expiry_ranking(store_id)
        if df.height == 0:
            st.info("暂无批号效期数据，请先导入库存数据。")
            return

        col1, col2 = st.columns(2)
        with col1:
            alert_days = st.number_input(
                "效期预警天数", min_value=1, max_value=365, value=90
            )

        alert_df = df.filter(pl.col("days_until_expiry") <= alert_days)

        if alert_df.height > 0:
            st.warning(f"⚠️ 共 {alert_df.height} 条记录在 {alert_days} 天内到期！")

            fig = px.bar(
                alert_df.sort("days_until_expiry").head(20).to_pandas(),
                x="product_name",
                y="days_until_expiry",
                color="store_id",
                title=f"效期最紧迫的 20 个产品（≤{alert_days}天）",
                labels={"product_name": "产品", "days_until_expiry": "距过期天数"},
            )
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("查看全部效期排行"):
            st.dataframe(df, use_container_width=True)
    except Exception as e:
        st.error(f"加载批号效期排行失败: {e}")


def _render_member_profile_changes_chart(db: DuckDBService, store_id: str | None) -> None:
    st.subheader("👤 会员档案变化")
    try:
        df = db.get_member_profile_changes(store_id=store_id)
        if df.height == 0:
            st.info("暂无会员档案变化数据。")
            return

        change_by_field = df.group_by("field_name").agg(
            pl.count().alias("change_count")
        ).sort("change_count", descending=True)

        fig = px.bar(
            change_by_field.to_pandas(),
            x="field_name",
            y="change_count",
            title="各字段变更频次",
            labels={"field_name": "字段", "change_count": "变更次数"},
        )
        st.plotly_chart(fig, use_container_width=True)

        with st.expander("查看变更明细"):
            st.dataframe(df, use_container_width=True)
    except Exception as e:
        st.error(f"加载会员档案变化失败: {e}")
