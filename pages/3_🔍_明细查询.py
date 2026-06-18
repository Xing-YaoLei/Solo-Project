import streamlit as st
import polars as pl
from datetime import datetime

from config import REGIONS, RISK_LEVELS, DataSource, DATA_SOURCE_LABELS
from ui_components import display_dataframe_with_highlight, render_region_filter, render_risk_filter

st.set_page_config(
    page_title="明细查询 - 家装工地客户确认风险监测",
    page_icon="🔍",
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

    if auth_scope and auth_scope.get("region") and "region" in df.columns:
        df = df.filter(pl.col("region") == auth_scope["region"])
    if auth_scope and auth_scope.get("allowed_project_ids") and "project_id" in df.columns:
        df = df.filter(pl.col("project_id").is_in(auth_scope["allowed_project_ids"]))
    return df


def show_project_detail(project_id: str, focus_data_source: Optional[str] = None):
    repo = get_repository()
    confirmations = repo.get_project_confirmations()

    project_info = confirmations.filter(pl.col("project_id") == project_id)
    if project_info.height == 0:
        st.warning(f"未找到项目 {project_id} 的确认信息")
        return

    info = project_info.to_dicts()[0]

    if focus_data_source:
        ds_label = {
            "design_export": "📐 设计软件导出",
            "payment_record": "💰 收款记录",
            "purchase_order": "📦 采购单记录",
        }.get(focus_data_source, focus_data_source)
        st.success(
            f"🎯 已定位到项目 **{info.get('project_name', project_id)}** 的 {ds_label} 明细"
        )

    st.markdown(f"## 📁 项目详情：{info.get('project_name', project_id)}")
    st.markdown("---")

    info_col1, info_col2, info_col3, info_col4 = st.columns(4)
    with info_col1:
        st.metric("项目ID", project_id)
    with info_col2:
        st.metric("所属区域", info.get("region", "-"))
    with info_col3:
        st.metric("客户名称", info.get("customer_name", "-"))
    with info_col4:
        risk_color = {"低风险": "#2ecc71", "中风险": "#f1c40f", "高风险": "#e67e22", "极高风险": "#e74c3c"}
        risk = info.get("risk_level", "-")
        st.markdown(
            f"**风险等级**<br>"
            f"<span style='font-size:24px; color:{risk_color.get(risk, '#333')}; font-weight:bold;'>{risk}</span>",
            unsafe_allow_html=True,
        )

    st.markdown("### 📊 确认状态")
    status_col1, status_col2, status_col3, status_col4 = st.columns(4)
    with status_col1:
        st.metric("整体完整率", f"{info.get('overall_completeness', 0)}%")
    with status_col2:
        design_ok = "✅" if info.get("design_confirmed") else "❌"
        st.metric(f"{design_ok} 设计确认", "已确认" if info.get("design_confirmed") else "未确认")
    with status_col3:
        pay_ok = "✅" if info.get("payment_confirmed") else "❌"
        st.metric(f"{pay_ok} 收款确认", "已确认" if info.get("payment_confirmed") else "未确认")
    with status_col4:
        pur_ok = "✅" if info.get("purchase_confirmed") else "❌"
        st.metric(f"{pur_ok} 采购确认", "已确认" if info.get("purchase_confirmed") else "未确认")

    st.markdown("---")

    all_tabs = [
        ("design_export", "📐 设计软件导出"),
        ("payment_record", "💰 收款记录"),
        ("purchase_order", "📦 采购单记录"),
        ("attachment", "📎 附件材料"),
        ("timeline", "📜 变更时间线"),
    ]

    if focus_data_source:
        focus_idx = None
        for i, (k, _) in enumerate(all_tabs):
            if k == focus_data_source:
                focus_idx = i
                break
        if focus_idx is not None:
            all_tabs = [all_tabs[focus_idx]] + all_tabs[:focus_idx] + all_tabs[focus_idx + 1:]

    tab_keys = [t[0] for t in all_tabs]
    tab_labels = [t[1] for t in all_tabs]
    tabs = st.tabs(tab_labels)

    for tab_key, tab in zip(tab_keys, tabs):
        with tab:
            if tab_key == "design_export":
                design_df = repo.get_design_exports(project_id)
                if design_df.height > 0:
                    if focus_data_source == "design_export":
                        st.info("📍 当前显示从首页缺失记录跳转的设计软件导出明细")
                    display_dataframe_with_highlight(
                        design_df,
                        highlight_col="is_missing",
                        page_size=20,
                    )
                else:
                    st.info("暂无设计软件导出记录")

            elif tab_key == "payment_record":
                payment_df = repo.get_payment_records(project_id)
                if payment_df.height > 0:
                    if focus_data_source == "payment_record":
                        st.info("📍 当前显示从首页缺失记录跳转的收款记录明细")
                    display_dataframe_with_highlight(
                        payment_df,
                        highlight_col="is_missing",
                        page_size=20,
                    )
                else:
                    st.info("暂无收款记录")

            elif tab_key == "purchase_order":
                purchase_df = repo.get_purchase_orders(project_id)
                if purchase_df.height > 0:
                    if focus_data_source == "purchase_order":
                        st.info("📍 当前显示从首页缺失记录跳转的采购单记录明细")
                    display_dataframe_with_highlight(
                        purchase_df,
                        highlight_col="is_missing",
                        page_size=20,
                    )
                else:
                    st.info("暂无采购单记录")

            elif tab_key == "attachment":
                attach_df = repo.get_attachments(project_id)
                if attach_df.height > 0:
                    display_dataframe_with_highlight(attach_df, page_size=20)
                else:
                    st.info("暂无附件材料")

            elif tab_key == "timeline":
                timeline_df = repo.get_change_timeline(project_id)
                if timeline_df.height > 0:
                    display_dataframe_with_highlight(timeline_df, page_size=20)
                else:
                    st.info("暂无变更记录")

    st.markdown("---")
    back_col1, back_col2 = st.columns(2)
    with back_col1:
        if st.button("⬅️ 返回项目列表", use_container_width=True):
            st.session_state["selected_project_id"] = None
            st.query_params.clear()
            st.rerun()
    with back_col2:
        if st.button("🏠 返回首页", use_container_width=True):
            st.session_state["selected_project_id"] = None
            st.query_params.clear()
            st.switch_page("app.py")


def main():
    st.title("🔍 明细查询")
    st.caption("查看授权范围内的项目明细，支持跳转到各数据源详情")

    repo = get_repository()

    query_pid = st.query_params.get("project_id", None)
    query_ds = st.query_params.get("data_source", None)

    if query_pid and not st.session_state.get("selected_project_id"):
        st.session_state["selected_project_id"] = query_pid
        st.session_state["focus_data_source"] = query_ds

    user_id = st.session_state.get("current_user_id", "U004")
    auth_scope = repo.get_auth_scope(user_id)
    if auth_scope:
        st.info(
            f"📌 当前授权范围：角色 **{auth_scope.get('role', '-')}**，"
            f"区域 **{auth_scope.get('region') or '全部区域'}**"
        )

    selected_pid = st.session_state.get("selected_project_id")
    focus_ds = st.session_state.get("focus_data_source", None)
    if selected_pid:
        show_project_detail(selected_pid, focus_data_source=focus_ds)
        return

    st.markdown("---")

    filter_col1, filter_col2, filter_col3 = st.columns(3)
    with filter_col1:
        selected_regions = render_region_filter(key="detail_region")
    with filter_col2:
        selected_risks = render_risk_filter(key="detail_risk")
    with filter_col3:
        search_keyword = st.text_input("🔎 搜索项目名称/ID/客户", key="detail_search")

    confirmations = repo.get_project_confirmations()
    confirmations = apply_auth_filter(confirmations)

    if selected_regions and "region" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("region").is_in(selected_regions))
    if selected_risks and "risk_level" in confirmations.columns:
        confirmations = confirmations.filter(pl.col("risk_level").is_in(selected_risks))
    if search_keyword:
        kw = search_keyword.lower()
        confirmations = confirmations.filter(
            pl.col("project_id").str.to_lowercase().str.contains(kw)
            | pl.col("project_name").fill_null("").str.to_lowercase().str.contains(kw)
            | pl.col("customer_name").fill_null("").str.to_lowercase().str.contains(kw)
        )

    if confirmations.height == 0:
        st.warning("⚠️ 暂无符合条件的项目")
        return

    st.markdown(f"### 共找到 **{confirmations.height}** 个项目")

    display_df = confirmations.select([
        "project_id", "project_name", "region", "customer_name",
        "overall_completeness", "risk_level",
        "design_confirmed", "payment_confirmed", "purchase_confirmed",
    ]).with_columns([
        pl.col("design_confirmed").map_elements(lambda x: "✅" if x else "❌", return_dtype=str).alias("设计"),
        pl.col("payment_confirmed").map_elements(lambda x: "✅" if x else "❌", return_dtype=str).alias("收款"),
        pl.col("purchase_confirmed").map_elements(lambda x: "✅" if x else "❌", return_dtype=str).alias("采购"),
    ])

    pandas_df = display_df.to_pandas()

    st.dataframe(
        pandas_df,
        use_container_width=True,
        height=min(500, confirmations.height * 35 + 50),
        column_config={
            "project_id": st.column_config.TextColumn("项目ID", width="small"),
            "project_name": st.column_config.TextColumn("项目名称", width="large"),
            "region": st.column_config.TextColumn("区域", width="small"),
            "customer_name": st.column_config.TextColumn("客户", width="small"),
            "overall_completeness": st.column_config.NumberColumn("完整率(%)", width="small"),
            "risk_level": st.column_config.TextColumn("风险等级", width="small"),
        },
    )

    st.markdown("---")

    col1, col2 = st.columns([2, 1])
    with col1:
        project_options = confirmations.select(["project_id", "project_name"]).to_dicts()
        project_labels = [f"{p['project_id']} - {p.get('project_name', '')}" for p in project_options]
        selected_label = st.selectbox(
            "选择项目查看详情",
            options=project_labels,
            key="project_selector",
        )
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔍 查看项目明细", type="primary", use_container_width=True):
            selected_pid = selected_label.split(" - ")[0]
            st.session_state["selected_project_id"] = selected_pid
            st.session_state["focus_data_source"] = None
            st.query_params.clear()
            st.rerun()

    st.markdown("---")
    st.subheader("📋 资料缺失明细（点击跳转）")

    missing_df = repo.get_missing_data_samples()
    if missing_df.height > 0:
        missing_df = apply_auth_filter(missing_df)
        if missing_df.height > 0:
            display_missing = missing_df.with_columns(
                pl.col("data_source").map_elements(
                    lambda x: DATA_SOURCE_LABELS.get(x, x),
                    return_dtype=str,
                ).alias("数据源")
            ).select([
                "数据源", "project_id", "project_name", "region",
                "missing_fields", "batch_id",
            ])
            display_dataframe_with_highlight(
                display_missing,
                page_size=20,
            )

            st.markdown("##### 🚀 快速跳转")
            data_source_icon = {
                "design_export": "📐",
                "payment_record": "💰",
                "purchase_order": "📦",
            }
            for idx, row in enumerate(missing_df.to_dicts()):
                pid = row.get("project_id", "-")
                pname = row.get("project_name", "-")
                src = row.get("data_source", "")
                src_label = DATA_SOURCE_LABELS.get(src, src)
                icon = data_source_icon.get(src, "🔍")

                row_col1, row_col2 = st.columns([5, 1])
                with row_col1:
                    st.caption(
                        f"{idx + 1}. 项目 **{pname}** ({pid}) · 数据源：{icon} {src_label} "
                        f"· 缺失字段：`{row.get('missing_fields', '-')}`"
                    )
                with row_col2:
                    btn_key = f"jump_detail_{pid}_{src}_{idx}"
                    if st.button(f"➡️ 打开", key=btn_key, use_container_width=True):
                        st.session_state["selected_project_id"] = pid
                        st.session_state["focus_data_source"] = src
                        st.query_params["project_id"] = pid
                        st.query_params["data_source"] = src
                        st.rerun()
        else:
            st.info("当前授权范围内无资料缺失记录")
    else:
        st.success("✅ 当前暂无资料缺失记录")


if __name__ == "__main__":
    main()
