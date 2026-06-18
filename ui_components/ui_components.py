from typing import Optional, Callable, Any, List
from datetime import datetime, date, timedelta
import streamlit as st
import polars as pl
import functools
import traceback

from config import REGIONS, RISK_LEVELS


def styled_metric(label: str, value: Any, delta: Optional[Any] = None, help_text: Optional[str] = None):
    st.metric(label=label, value=value, delta=delta, help=help_text)


def render_kpi_card(title: str, value: Any, subtitle: Optional[str] = None, icon: str = "📊"):
    with st.container():
        col1, col2 = st.columns([1, 4])
        with col1:
            st.markdown(f"<h2 style='text-align: center; margin: 0;'>{icon}</h2>", unsafe_allow_html=True)
        with col2:
            st.markdown(f"**{title}**")
            st.markdown(f"<h3 style='margin: 0; color: #1f77b4;'>{value}</h3>", unsafe_allow_html=True)
            if subtitle:
                st.caption(subtitle)


def render_region_filter(
    key: str = "region_filter",
    default: Optional[List[str]] = None,
    allow_multiselect: bool = True,
) -> Optional[List[str]]:
    st.markdown("##### 🏢 区域筛选")
    if allow_multiselect:
        selected = st.multiselect(
            "选择区域",
            options=REGIONS,
            default=default or REGIONS,
            key=key,
        )
    else:
        selected = [st.selectbox("选择区域", options=["全部"] + REGIONS, key=key)]
        if "全部" in selected:
            selected = REGIONS
    return selected if selected else None


def render_risk_filter(key: str = "risk_filter") -> Optional[List[str]]:
    st.markdown("##### ⚠️ 风险等级")
    selected = st.multiselect(
        "选择风险等级",
        options=RISK_LEVELS,
        default=RISK_LEVELS,
        key=key,
    )
    return selected if selected else None


def render_date_filter(
    key_prefix: str = "date_filter",
    default_days: int = 30,
) -> tuple[Optional[date], Optional[date]]:
    st.markdown("##### 📅 日期范围")
    col1, col2 = st.columns(2)
    today = date.today()
    with col1:
        start_date = st.date_input(
            "开始日期",
            value=today - timedelta(days=default_days),
            key=f"{key_prefix}_start",
        )
    with col2:
        end_date = st.date_input(
            "结束日期",
            value=today,
            key=f"{key_prefix}_end",
        )
    return start_date, end_date


def render_error_fallback(
    error: Exception,
    component_name: str,
    last_update_time: Optional[datetime] = None,
    retry_callback: Optional[Callable] = None,
    retry_key: str = "retry_btn",
):
    st.error(f"❌ 加载 **{component_name}** 时出现错误")

    with st.expander("错误详情", expanded=False):
        st.code(traceback.format_exc(), language="python")

    if last_update_time:
        st.info(f"🕐 最近成功更新时间：**{last_update_time.strftime('%Y-%m-%d %H:%M:%S')}**")
    else:
        st.warning("⚠️ 暂无成功更新记录")

    if retry_callback:
        if st.button(f"🔄 重试加载 {component_name}", key=retry_key, type="primary"):
            try:
                retry_callback()
                st.rerun()
            except Exception as retry_error:
                st.error(f"重试失败：{retry_error}")


def with_error_fallback(
    component_name: str,
    get_last_update: Optional[Callable[[], Optional[datetime]]] = None,
    retry_callback: Optional[Callable] = None,
):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_update = None
                if get_last_update:
                    try:
                        last_update = get_last_update()
                    except Exception:
                        pass
                render_error_fallback(
                    error=e,
                    component_name=component_name,
                    last_update_time=last_update,
                    retry_callback=retry_callback,
                )
                return None
        return wrapper
    return decorator


def display_dataframe_with_highlight(
    df: pl.DataFrame,
    highlight_col: Optional[str] = None,
    highlight_threshold: Optional[float] = None,
    page_size: int = 20,
):
    if df.height == 0:
        st.info("暂无数据")
        return

    pandas_df = df.to_pandas()

    if highlight_col and highlight_threshold is not None and highlight_col in pandas_df.columns:
        def highlight_rows(row):
            try:
                val = float(row[highlight_col])
                if val < highlight_threshold:
                    return ["background-color: #fff3cd"] * len(row)
            except (ValueError, TypeError):
                pass
            return [""] * len(row)

        styled = pandas_df.style.apply(highlight_rows, axis=1)
        st.dataframe(styled, use_container_width=True, height=min(400, page_size * 35 + 50))
    else:
        st.dataframe(pandas_df, use_container_width=True, height=min(400, page_size * 35 + 50))
