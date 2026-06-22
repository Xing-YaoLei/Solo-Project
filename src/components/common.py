import streamlit as st
from datetime import datetime, timedelta
import polars as pl


def get_common_filters(show_region: bool = True, show_date: bool = True,
                      key_prefix: str = "") -> dict:
    filters = {}

    col1, col2 = st.columns(2)

    with col1:
        if show_date:
            date_range = st.date_input(
                "日期范围",
                value=(datetime.now() - timedelta(days=90), datetime.now()),
                key=f"{key_prefix}_date_range"
            )
            if len(date_range) == 2:
                filters["start_date"] = datetime.combine(date_range[0], datetime.min.time())
                filters["end_date"] = datetime.combine(date_range[1], datetime.max.time())

    with col2:
        if show_region:
            from src.data.data_querier import DataQuerier
            querier = DataQuerier()
            regions_df = querier.get_regions()
            region_options = ["全部"] + regions_df["region_name"].to_list()
            selected_region = st.selectbox(
                "选择区域",
                options=region_options,
                key=f"{key_prefix}_region"
            )
            if selected_region != "全部":
                region_row = regions_df.filter(pl.col("region_name") == selected_region)
                if len(region_row) > 0:
                    filters["region_id"] = region_row["region_id"][0]
            querier.close()

    return filters


def show_kpi_cards(kpis: list) -> None:
    cols = st.columns(len(kpis))
    for col, kpi in zip(cols, kpis):
        with col:
            st.metric(
                label=kpi.get("label", ""),
                value=kpi.get("value", 0),
                delta=kpi.get("delta", None),
                delta_color=kpi.get("delta_color", "normal")
            )


def show_data_table(df: pl.DataFrame, title: str = None, height: int = 400,
                   use_container_width: bool = True, key: str = None) -> None:
    if title:
        st.subheader(title)
    if len(df) == 0:
        st.info("暂无数据")
        return

    pandas_df = df.to_pandas() if hasattr(df, 'to_pandas') else df
    st.dataframe(
        pandas_df,
        height=height,
        use_container_width=use_container_width,
        key=key
    )


def show_sync_trail(sync_id: str, title: str = "同步审计链路") -> None:
    from src.data.sync_pipeline import SyncOrchestrator
    orchestrator = SyncOrchestrator()
    trail = orchestrator.get_audit_trail(sync_id)
    orchestrator.close()

    with st.expander(f"🔍 {title}", expanded=False):
        if not trail:
            st.info("暂无同步记录")
            return

        for node in trail:
            status_colors = {
                "completed": "🟢",
                "running": "🟡",
                "failed": "🔴",
                "pending": "⚪",
                "skipped": "⚫"
            }
            status_color = status_colors.get(node["status"], "⚪")

            col1, col2, col3, col4 = st.columns([2, 1, 1, 2])
            with col1:
                st.write(f"{status_color} **{node['node_name']}**")
                st.caption(f"类型: {node['node_type']} | 操作人: {node['operator']}")
            with col2:
                st.write(f"状态: {node['status']}")
                st.write(f"记录数: {node['record_count']}")
            with col3:
                if node['duration_seconds']:
                    st.write(f"耗时: {node['duration_seconds']:.1f}s")
            with col4:
                st.write(f"开始: {node['started_at']}")
                if node['completed_at']:
                    st.write(f"完成: {node['completed_at']}")

            if node["status"] == "failed":
                st.error(f"错误信息: {node.get('error_message', '未知错误')}")

            st.divider()


def format_number(num: float, decimals: int = 0) -> str:
    if num is None:
        return "-"
    if abs(num) >= 100000000:
        return f"{num/100000000:.{decimals}f}亿"
    elif abs(num) >= 10000:
        return f"{num/10000:.{decimals}f}万"
    else:
        return f"{num:,.{decimals}f}"


def format_percent(num: float, decimals: int = 2) -> str:
    if num is None:
        return "-"
    return f"{num:.{decimals}f}%"


def get_growth_delta(current: float, compare: float) -> tuple:
    if compare is None or compare == 0:
        return (None, "normal")
    growth = ((current - compare) / compare) * 100
    if growth > 0:
        return (f"{growth:.2f}%", "inverse")
    elif growth < 0:
        return (f"{growth:.2f}%", "normal")
    else:
        return ("0.00%", "off")


def create_download_button(df: pl.DataFrame, filename: str, label: str = "下载数据") -> None:
    import io
    csv_buffer = io.StringIO()
    df.write_csv(csv_buffer)
    csv_data = csv_buffer.getvalue().encode("utf-8-sig")

    st.download_button(
        label=label,
        data=csv_data,
        file_name=filename,
        mime="text/csv"
    )


def set_page_config():
    st.set_page_config(
        page_title="合规审计证据归档趋势看板",
        page_icon="📊",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            'About': '# 合规审计证据归档趋势看板\n用于观察合规审计里的证据归档变化'
        }
    )

    st.markdown("""
    <style>
    .main .block-container {padding-top: 2rem;}
    .stMetric {background-color: #f8f9fa; padding: 1rem; border-radius: 0.5rem;}
    .stMetric:hover {background-color: #e9ecef; transition: background-color 0.3s;}
    div[data-testid="stMetricValue"] {font-size: 1.5rem; font-weight: bold;}
    div[data-testid="stMetricDelta"] {font-size: 0.9rem;}
    .stExpander {border: 1px solid #dee2e6; border-radius: 0.5rem; margin-bottom: 1rem;}
    </style>
    """, unsafe_allow_html=True)
