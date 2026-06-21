import streamlit as st
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

st.set_page_config(
    page_title="法律服务文书归档风险监测",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

from src.pages.page_overview import render_overview
from src.pages.page_pipeline import render_pipeline
from src.pages.page_review_return import render_review_return
from src.pages.page_reports import render_reports
from src.pages.page_interaction import render_interaction


def _get_page_index():
    page_names = [
        "📊 风险监测总览",
        "🔗 取数链路追踪",
        "📋 审核退回追踪",
        "📈 多维报表分析",
        "📝 互动记录明细",
    ]
    current = st.session_state.get("current_page", page_names[0])
    return page_names.index(current) if current in page_names else 0


def main():
    st.sidebar.title("⚖️ 文书归档风险监测")
    st.sidebar.markdown("---")

    page_names = [
        "📊 风险监测总览",
        "🔗 取数链路追踪",
        "📋 审核退回追踪",
        "📈 多维报表分析",
        "📝 互动记录明细",
    ]

    default_index = _get_page_index()
    page = st.sidebar.radio(
        "导航",
        page_names,
        index=default_index,
        key="nav_radio",
    )
    st.session_state["current_page"] = page

    st.sidebar.markdown("---")

    with st.sidebar.expander("⏱ 时间范围", expanded=True):
        default_end = datetime(2026, 6, 20)
        default_start = default_end - timedelta(days=30)
        start_date = st.date_input("开始日期", default_start.date())
        end_date = st.date_input("结束日期", default_end.date())

    st.session_state["date_range"] = (
        datetime.combine(start_date, datetime.min.time()),
        datetime.combine(end_date, datetime.max.time()),
    )

    with st.sidebar.expander("🌍 区域筛选", expanded=False):
        from config.settings import REGIONS
        selected_regions = st.multiselect(
            "选择区域", REGIONS, default=REGIONS
        )
        st.session_state["selected_regions"] = selected_regions

    st.sidebar.markdown("---")
    st.sidebar.caption("数据更新时间：2026-06-20 18:00")
    st.sidebar.caption("数据来源：案件系统 / 日历工具 / 收款流水")

    page_map = {
        "📊 风险监测总览": render_overview,
        "🔗 取数链路追踪": render_pipeline,
        "📋 审核退回追踪": render_review_return,
        "📈 多维报表分析": render_reports,
        "📝 互动记录明细": render_interaction,
    }

    render_func = page_map.get(page)
    if render_func:
        render_func()


if __name__ == "__main__":
    main()
