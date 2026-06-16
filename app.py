"""
口腔诊所会员复诊风险监测系统
Streamlit 主应用
"""
import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import init_database
from src.config import Config
from src.data_processor import get_system_users


st.set_page_config(
    page_title="口腔诊所会员复诊风险监测图",
    page_icon="🦷",
    layout="wide",
    initial_sidebar_state="expanded"
)


def init_app():
    """初始化应用"""
    if "initialized" not in st.session_state:
        init_database()
        st.session_state.initialized = True

    if "current_user" not in st.session_state:
        st.session_state.current_user = None

    if "current_role" not in st.session_state:
        st.session_state.current_role = None


def login_page():
    """登录页面"""
    st.title("🦷 口腔诊所会员复诊风险监测系统")
    st.markdown("---")

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.subheader("用户登录")

        users_df = get_system_users()
        if users_df.is_empty():
            st.warning("系统中暂无用户，请先初始化数据")
            if st.button("初始化模拟数据", type="primary"):
                from src.sample_data import initialize_sample_data
                initialize_sample_data()
                st.success("数据初始化完成！请刷新页面")
                st.rerun()
            return

        user_options = []
        for row in users_df.iter_rows(named=True):
            role_label = Config.ROLES.get(row["role"], row["role"])
            user_options.append(f"{row['user_name']} ({role_label})")

        selected = st.selectbox("请选择用户", user_options)

        if st.button("登录", type="primary", use_container_width=True):
            selected_user = users_df.filter(
                pl.col("user_name") == selected.split(" (")[0]
            ).row(0, named=True)

            st.session_state.current_user = selected_user["user_name"]
            st.session_state.current_role = selected_user["role"]
            st.session_state.user_id = selected_user["user_id"]
            st.session_state.department = selected_user["department"]
            st.rerun()

    st.markdown("---")
    st.caption("© 2024 口腔诊所会员复诊风险监测系统")


import polars as pl


def sidebar_navigation():
    """侧边栏导航 - 根据角色显示不同菜单"""
    with st.sidebar:
        st.title("🦷 复诊监测系统")

        st.markdown("---")

        user = st.session_state.current_user
        role = st.session_state.current_role
        role_label = Config.ROLES.get(role, role)

        st.info(f"**当前用户**: {user}\n\n**角色**: {role_label}")

        st.markdown("---")

        if role == "management":
            menu_options = ["复诊风险总览", "复诊率明细", "数据分析"]
        else:
            menu_options = ["我的复诊明细"]

        page = st.radio(
            "导航菜单",
            menu_options,
            label_visibility="collapsed"
        )

        st.markdown("---")

        if st.button("退出登录", use_container_width=True):
            st.session_state.current_user = None
            st.session_state.current_role = None
            st.rerun()

    return page


def main():
    """主应用函数"""
    init_app()

    if not st.session_state.current_user:
        login_page()
        return

    page = sidebar_navigation()

    if page == "复诊风险总览":
        from pages.overview import show_overview
        show_overview()
    elif page in ["复诊率明细", "我的复诊明细"]:
        from pages.details import show_details
        show_details()
    elif page == "数据分析":
        from pages.analytics import show_analytics
        show_analytics()


if __name__ == "__main__":
    main()
