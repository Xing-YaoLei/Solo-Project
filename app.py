"""
口腔诊所会员复诊风险监测系统
Streamlit 主应用
"""
import streamlit as st
import sys
import os
import polars as pl

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

    for key in ["current_user", "current_role", "user_id", "department"]:
        if key not in st.session_state:
            st.session_state[key] = None

    for key in ["selected_appointment", "selected_patient", "selected_status"]:
        if key not in st.session_state:
            st.session_state[key] = None


def clear_session():
    """清空用户会话"""
    for key in ["current_user", "current_role", "user_id", "department",
                "selected_appointment", "selected_patient", "selected_status"]:
        st.session_state[key] = None


def login_page():
    """登录页面"""
    st.title("🦷 口腔诊所会员复诊风险监测系统")
    st.markdown("---")

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.subheader("用户登录")

        try:
            users_df = get_system_users()
        except Exception as e:
            st.error(f"加载用户数据失败: {e}")
            if st.button("重置数据库", type="primary"):
                from src.sample_data import initialize_sample_data
                initialize_sample_data()
                st.rerun()
            return

        if users_df.is_empty():
            st.warning("系统中暂无用户，请先初始化数据")
            if st.button("初始化模拟数据", type="primary"):
                with st.spinner("正在初始化数据..."):
                    try:
                        from src.sample_data import initialize_sample_data
                        initialize_sample_data()
                        st.success("数据初始化完成！请刷新页面")
                        st.rerun()
                    except Exception as e:
                        st.error(f"初始化失败: {e}")
            return

        user_options = []
        user_map = {}
        for row in users_df.iter_rows(named=True):
            role_label = Config.ROLES.get(row["role"], row["role"])
            label = f"{row['user_name']} ({role_label})"
            user_options.append(label)
            user_map[label] = row

        selected = st.selectbox("请选择用户", user_options, key="login_user")

        if st.button("登录", type="primary", use_container_width=True):
            try:
                selected_user = user_map.get(selected)
                if selected_user:
                    st.session_state.current_user = selected_user["user_name"]
                    st.session_state.current_role = selected_user["role"]
                    st.session_state.user_id = selected_user["user_id"]
                    st.session_state.department = selected_user["department"]
                    st.rerun()
                else:
                    st.error("用户信息获取失败，请重试")
            except Exception as e:
                st.error(f"登录失败: {e}")

    st.markdown("---")
    st.caption("© 2024 口腔诊所会员复诊风险监测系统")


def sidebar_navigation():
    """侧边栏导航 - 根据角色显示不同菜单"""
    with st.sidebar:
        st.title("🦷 复诊监测系统")

        st.markdown("---")

        user = st.session_state.current_user
        role = st.session_state.current_role
        role_label = Config.ROLES.get(role, role)

        st.info(f"**当前用户**: {user}\n\n**角色**: {role_label}")

        if st.session_state.department:
            st.caption(f"所属部门: {st.session_state.department}")

        st.markdown("---")

        if role == "management":
            menu_options = ["复诊风险总览", "复诊率明细", "数据分析"]
        else:
            menu_options = ["我的复诊明细"]

        if "current_page" not in st.session_state:
            st.session_state.current_page = menu_options[0]

        page = st.radio(
            "导航菜单",
            menu_options,
            label_visibility="collapsed",
            key="nav_menu",
            index=menu_options.index(st.session_state.current_page) if st.session_state.current_page in menu_options else 0
        )
        st.session_state.current_page = page

        st.markdown("---")

        if st.button("退出登录", use_container_width=True):
            clear_session()
            st.rerun()

    return page


def main():
    """主应用函数"""
    try:
        init_app()

        if not st.session_state.current_user:
            login_page()
            return

        page = sidebar_navigation()

        if page == "复诊风险总览":
            if st.session_state.current_role != "management":
                st.error("权限不足，您无法访问此页面")
                return
            from pages.overview import show_overview
            show_overview()

        elif page in ["复诊率明细", "我的复诊明细"]:
            from pages.details import show_details
            show_details()

        elif page == "数据分析":
            if st.session_state.current_role != "management":
                st.error("权限不足，您无法访问此页面")
                return
            from pages.analytics import show_analytics
            show_analytics()

    except Exception as e:
        st.error(f"系统发生错误: {str(e)}")
        st.exception(e)
        if st.button("返回登录页"):
            clear_session()
            st.rerun()


if __name__ == "__main__":
    main()
