import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta


def init_page_config(title: str = "汽车维修保养提醒趋势看板"):
    st.set_page_config(
        page_title=title,
        page_icon="🚗",
        layout="wide",
        initial_sidebar_state="expanded",
    )


def render_kpi_card(label: str, value: Any, delta: Optional[Any] = None, delta_label: str = ""):
    if delta is not None:
        if isinstance(delta, (int, float)):
            delta_str = f"{delta:+.2f}%"
        else:
            delta_str = str(delta)
        if delta_label:
            if isinstance(delta, (int, float)):
                delta_str = f"{delta_str} {delta_label}"
            else:
                delta_str = f"{delta_str} · {delta_label}"
        st.metric(label=label, value=value, delta=delta_str)
    else:
        st.metric(label=label, value=value)


def render_date_range_filter(
    label: str = "选择日期范围",
    default_start: Optional[date] = None,
    default_end: Optional[date] = None,
) -> tuple:
    today = date.today()
    if default_start is None:
        default_start = today - timedelta(days=90)
    if default_end is None:
        default_end = today

    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input(f"{label} - 开始", value=default_start, key=f"{label}_start")
    with col2:
        end_date = st.date_input(f"{label} - 结束", value=default_end, key=f"{label}_end")

    return start_date, end_date


def render_filter_bar(filters: Dict[str, Any]) -> Dict[str, Any]:
    selected = {}
    cols = st.columns(len(filters))

    for i, (label, options) in enumerate(filters.items()):
        with cols[i]:
            if isinstance(options, list):
                selected[label] = st.multiselect(label, options, default=options)
            elif isinstance(options, tuple):
                selected[label] = st.selectbox(label, options)
            else:
                selected[label] = st.text_input(label, value=options)

    return selected


def render_trend_chart(
    df: pl.DataFrame,
    x_col: str,
    y_col: str,
    title: str = "",
    color: Optional[str] = None,
    chart_type: str = "line",
):
    if df.is_empty():
        st.info("暂无数据")
        return

    pdf = df.to_pandas()

    if chart_type == "bar":
        fig = px.bar(pdf, x=x_col, y=y_col, color=color, title=title)
    elif chart_type == "area":
        fig = px.area(pdf, x=x_col, y=y_col, color=color, title=title)
    else:
        fig = px.line(pdf, x=x_col, y=y_col, color=color, title=title, markers=True)

    fig.update_layout(
        height=350,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig, use_container_width=True)


def render_pie_chart(
    df: pl.DataFrame,
    names_col: str,
    values_col: str,
    title: str = "",
):
    if df.is_empty():
        st.info("暂无数据")
        return

    pdf = df.to_pandas()
    fig = px.pie(pdf, names=names_col, values=values_col, title=title, hole=0.4)
    fig.update_layout(height=350, legend=dict(orientation="h", yanchor="bottom", y=-0.1))
    st.plotly_chart(fig, use_container_width=True)


def render_dataframe(
    df: pl.DataFrame,
    title: str = "",
    show_index: bool = False,
    height: int = 400,
    use_container_width: bool = True,
    highlight_cols: Optional[List[str]] = None,
):
    if title:
        st.markdown(f"**{title}**")

    if df.is_empty():
        st.info("暂无数据")
        return

    pdf = df.to_pandas()
    if not show_index:
        pdf = pdf.reset_index(drop=True)

    if highlight_cols:
        def highlight_diff(val):
            if isinstance(val, str) and val in ["仅在left存在", "仅在right存在", "值不匹配", "不一致", "有差异"]:
                return "background-color: #fee2e2; color: #991b1b"
            elif isinstance(val, str) and val == "一致":
                return "background-color: #dcfce7; color: #166534"
            return ""

        styler = pdf.style.applymap(highlight_diff, subset=highlight_cols)
        st.dataframe(styler, height=height, use_container_width=use_container_width)
    else:
        st.dataframe(pdf, height=height, use_container_width=use_container_width)


def render_empty_state(message: str = "暂无数据"):
    st.info(f"📭 {message}")


def render_section_header(title: str, subtitle: Optional[str] = None, icon: str = "📊"):
    st.markdown(f"### {icon} {title}")
    if subtitle:
        st.caption(subtitle)
    st.divider()


def format_currency(value: float) -> str:
    return f"¥{value:,.2f}"


def format_percent(value: float, decimal: int = 2) -> str:
    return f"{value:.{decimal}f}%"


def get_color_by_status(status: str) -> str:
    status_colors = {
        "已完成": "#16a34a",
        "进行中": "#2563eb",
        "待配件": "#ea580c",
        "已取消": "#dc2626",
        "已结算": "#0891b2",
        "已赔付": "#16a34a",
        "审核中": "#f59e0b",
        "待提交": "#6b7280",
        "有异议": "#dc2626",
        "已拒绝": "#7c3aed",
        "已过期": "#dc2626",
        "即将到期": "#f59e0b",
        "未到期": "#16a34a",
        "待补货": "#ea580c",
        "已补货": "#16a34a",
        "已替代": "#0891b2",
        "客户取消": "#6b7280",
        "在途": "#2563eb",
    }
    return status_colors.get(status, "#6b7280")
