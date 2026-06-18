import streamlit as st
import polars as pl
from datetime import datetime

from config import AppConfig
from data_layer import DataRepository
from sync_pipeline import SyncPipeline, DesignExportSync, PaymentRecordSync, PurchaseOrderSync

st.set_page_config(
    page_title=AppConfig.TITLE,
    page_icon="🏗️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main {
        background-color: #fafbfc;
    }
    .stMetric {
        background-color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def get_repository() -> DataRepository:
    return DataRepository()


@st.cache_resource
def get_pipeline() -> SyncPipeline:
    repo = get_repository()
    pipeline = SyncPipeline(repo)
    pipeline.register(DesignExportSync(repo))
    pipeline.register(PaymentRecordSync(repo))
    pipeline.register(PurchaseOrderSync(repo))
    return pipeline


def init_data():
    repo = get_repository()
    pipeline = get_pipeline()
    try:
        existing = repo.get_project_confirmations()
        if existing.height == 0:
            with st.spinner("首次加载，正在生成模拟数据并同步..."):
                results = pipeline.run_all()
            st.success("✅ 数据初始化完成！")
    except Exception as e:
        st.warning(f"数据检查时出错：{e}")


def sidebar():
    with st.sidebar:
        st.title("🏗️ " + AppConfig.TITLE)
        st.markdown("---")

        st.subheader("👤 当前用户")
        user_options = {
            "U004 - 赵总 (总经理)": "U004",
            "U001 - 张经理 (华东区)": "U001",
            "U002 - 李总监 (华南区)": "U002",
            "U003 - 王主管 (华北区)": "U003",
            "U005 - 陈监理 (华中区)": "U005",
        }
        selected_user = st.selectbox("选择登录用户", list(user_options.keys()), key="user_selector")
        st.session_state["current_user_id"] = user_options[selected_user]

        auth_scope = get_repository().get_auth_scope(st.session_state["current_user_id"])
        if auth_scope:
            st.info(
                f"📌 授权范围\n\n"
                f"- 角色：**{auth_scope.get('role', '-')}**\n"
                f"- 区域：**{auth_scope.get('region') or '全部区域'}**"
            )
        st.markdown("---")

        st.subheader("🔄 数据同步")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📥 全部同步", use_container_width=True, type="primary"):
                with st.spinner("正在同步所有数据源..."):
                    results = get_pipeline().run_all()
                for src, res in results.items():
                    status_icon = "✅" if res.status == "成功" else "⚠️" if res.status == "部分成功" else "❌"
                    st.write(f"{status_icon} {res.data_source}: {res.status} ({res.success_count}/{res.total_count})")
                st.rerun()
        with col2:
            if st.button("🔄 刷新确认", use_container_width=True):
                with st.spinner("正在刷新项目确认状态..."):
                    get_repository().refresh_project_confirmations()
                st.success("✅ 刷新完成！")
                st.rerun()

        st.markdown("---")
        repo = get_repository()
        last_update = repo.get_last_update_time("project_confirmations")
        if last_update:
            st.caption(f"🕐 数据最后更新：{last_update.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            st.caption("🕐 暂无数据更新记录")


def main():
    init_data()
    sidebar()

    st.title("🏗️ 家装工地客户确认风险监测")
    st.caption("实时监测家装工地的客户确认状态，识别资料缺失风险")

    repo = get_repository()

    confirmations = repo.get_project_confirmations()
    missing_samples = repo.get_missing_data_samples()

    kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)
    with kpi_col1:
        total_projects = confirmations.height if confirmations.height > 0 else 0
        st.metric("📊 监测项目总数", total_projects)
    with kpi_col2:
        avg_completeness = (
            round(confirmations["overall_completeness"].mean(), 2)
            if confirmations.height > 0 and "overall_completeness" in confirmations.columns
            else 0
        )
        st.metric("📈 平均资料完整率", f"{avg_completeness}%")
    with kpi_col3:
        high_risk = (
            confirmations.filter(pl.col("risk_level").is_in(["高风险", "极高风险"])).height
            if confirmations.height > 0 and "risk_level" in confirmations.columns
            else 0
        )
        st.metric("⚠️ 高风险项目", high_risk, delta=None)
    with kpi_col4:
        missing_count = missing_samples.height if missing_samples.height > 0 else 0
        st.metric("❌ 资料缺失记录", missing_count)

    st.markdown("---")

    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        from ui_components import safe_render_chart, create_risk_chart

        last_update = repo.get_last_update_time("project_confirmations")
        fig = safe_render_chart(
            chart_func=create_risk_chart,
            component_name="风险等级分布图",
            last_update_time=last_update,
            retry_callback=lambda: repo.refresh_project_confirmations(),
            retry_key="risk_chart_retry",
            df=confirmations,
        )
        if fig:
            st.plotly_chart(fig, use_container_width=True)

    with chart_col2:
        from ui_components import safe_render_chart, create_completeness_chart

        fig = safe_render_chart(
            chart_func=create_completeness_chart,
            component_name="资料完整率分布图",
            last_update_time=last_update,
            retry_key="completeness_chart_retry",
            df=confirmations,
        )
        if fig:
            st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    st.subheader("📋 资料缺失样本（点击跳转明细）")
    st.caption("下表展示各数据源中存在字段缺失的记录，可点击每行下方按钮跳转至对应项目明细页")

    if missing_samples.height > 0:
        from ui_components import display_dataframe_with_highlight

        display_df = missing_samples.select([
            "data_source", "project_id", "project_name", "region",
            "missing_fields", "batch_id",
        ]).with_columns(
            pl.col("data_source").map_elements(
                lambda x: {
                    "design_export": "📐 设计软件导出",
                    "payment_record": "💰 收款记录",
                    "purchase_order": "📦 采购单记录",
                }.get(x, x),
                return_dtype=str,
            ).alias("数据源")
        ).to_pandas()

        st.dataframe(display_df, use_container_width=True, height=min(400, missing_samples.height * 35 + 60))

        st.markdown("##### 🚀 记录级快速跳转")
        data_source_icon = {
            "design_export": "📐",
            "payment_record": "💰",
            "purchase_order": "📦",
        }
        data_source_tab_label = {
            "design_export": "� 设计软件导出",
            "payment_record": "💰 收款记录",
            "purchase_order": "📦 采购单记录",
        }
        for idx, row in enumerate(missing_samples.to_dicts()):
            pid = row.get("project_id", "-")
            pname = row.get("project_name", "-")
            src = row.get("data_source", "")
            src_label = data_source_tab_label.get(src, src)
            icon = data_source_icon.get(src, "🔍")

            col1, col2 = st.columns([5, 1])
            with col1:
                st.caption(
                    f"{idx + 1}. 项目 **{pname}** ({pid}) · 数据源：{icon} {src_label} "
                    f"· 缺失字段：`{row.get('missing_fields', '-')}`"
                )
            with col2:
                btn_key = f"jump_home_{pid}_{src}_{idx}"
                if st.button(f"➡️ 查看明细", key=btn_key, use_container_width=True):
                    st.query_params["project_id"] = pid
                    st.query_params["data_source"] = src
                    st.switch_page("pages/3_🔍_明细查询.py")
    else:
        st.success("✅ 当前暂无资料缺失记录，数据完整！")

    st.markdown("---")

    st.subheader("🔄 最近同步批次")
    sync_batches = get_pipeline().get_sync_history(limit=10)
    if sync_batches.height > 0:
        from ui_components.chart_components import create_sync_status_chart

        fig = safe_render_chart(
            chart_func=create_sync_status_chart,
            component_name="同步状态统计图",
            df=sync_batches,
        )
        if fig:
            st.plotly_chart(fig, use_container_width=True)

        display_batches = sync_batches.with_columns(
            pl.col("data_source").map_elements(
                lambda x: {
                    "design_export": "📐 设计软件导出",
                    "payment_record": "💰 收款记录",
                    "purchase_order": "📦 采购单记录",
                }.get(x, x),
                return_dtype=str,
            ).alias("数据源")
        ).select([
            "batch_id", "数据源", "batch_date", "status",
            "total_count", "success_count", "failed_count",
        ]).to_pandas()
        st.dataframe(display_batches, use_container_width=True, height=250)
    else:
        st.info("暂无同步记录")


if __name__ == "__main__":
    main()
