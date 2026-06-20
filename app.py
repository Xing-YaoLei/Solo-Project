from __future__ import annotations

import os
import sys
import json
from typing import Optional

import streamlit as st
import polars as pl

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.config import app_config
from src.data.database import db
from src.data.analytics import TicketAnalytics, analytics
from src.data.mock_data import data_generator
from src.auth.permissions import (
    permission_manager,
    share_link_manager,
    UserRole,
    ROLE_LABELS,
    VIEW_SCOPES,
)
from src.pages.overview import render_overview_page
from src.pages.sponsors import render_sponsors_page
from src.pages.ticket_types import render_ticket_types_page
from src.pages.checkin import render_checkin_page
from src.pages.raw_records import render_raw_records_page
from src.pages.disputes import render_disputes_page
from src.pages.share import render_share_page


PAGE_ROUTES = {
    "🎯 总览看板": ("overview", "总览看板", UserRole.ATTENDEE),
    "🏢 赞助清单": ("sponsors", "赞助清单", UserRole.TICKET_STAFF),
    "💎 票种规则": ("ticket_types", "票种规则", UserRole.ATTENDEE),
    "🚪 核销记录": ("checkin", "核销明细", UserRole.GATE_STAFF),
    "📦 闸机原始记录": ("raw_records", "raw_records", UserRole.TICKET_STAFF),
    "⚖️ 退票争议管理": ("disputes", "disputes", UserRole.TICKET_STAFF),
    "🔗 分享链接管理": ("share", "share", UserRole.TICKET_STAFF),
}


def _setup_page():
    st.set_page_config(
        page_title=app_config.title,
        page_icon=app_config.icon,
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            "Get Help": "https://docs.streamlit.io",
            "About": f"# {app_config.title}\n\n活动票务现场核销漏斗复盘系统\n\n技术栈：Streamlit + Polars + DuckDB + MinIO",
        },
    )
    st.markdown(
        """
        <style>
        .stApp { background-color: #FAFAFB; }
        .block-container { padding-top: 2rem; padding-bottom: 2rem; }
        section[data-testid="stSidebar"] { background-color: #FFFFFF; border-right: 1px solid #E5E7EB; }
        [data-testid="stMetric"] { background: #FFFFFF; padding: 14px; border-radius: 12px; border: 1px solid #E5E7EB; }
        div[data-testid="stExpander"] details { border-radius: 10px; background: #FFFFFF; }
        .element-container div[data-testid="stHorizontalBlock"] > div { padding-top: 2px; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _init_session_state():
    defaults = {
        "db_initialized": False,
        "current_event_id": None,
        "current_role": None,
        "current_user": None,
        "share_token": None,
        "share_data": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


def _ensure_data():
    events = db.query_to_df("SELECT COUNT(*) as c FROM events")
    if events.height == 0 or events["c"][0] == 0:
        return False
    return True


def _sidebar_header():
    with st.sidebar:
        st.title(f"{app_config.icon} {app_config.title}")
        st.caption("活动票务核销漏斗 · 现场复盘系统")
        st.divider()


def _render_user_panel():
    with st.sidebar:
        st.markdown("### 👤 登录模拟")
        users_df = permission_manager.list_users()
        if users_df.height == 0:
            st.info("请先生成模拟数据")
            return

        user_options = [("未登录（外部）", None)]
        for row in users_df.iter_rows(named=True):
            role_label = ROLE_LABELS.get(UserRole(row["user_role"]), row["user_role"])
            label = f"{row['display_name']} [{role_label}]"
            user_options.append((label, row["username"]))

        idx_map = {lbl: uname for lbl, uname in user_options}
        labels = [x[0] for x in user_options]

        default_idx = 0
        if st.session_state.current_user:
            for i, (lbl, uname) in enumerate(user_options):
                if uname and uname == st.session_state.current_user.get("username"):
                    default_idx = i
                    break

        sel = st.selectbox(
            "选择登录身份",
            labels,
            index=default_idx,
            key="user_selector",
            help="用于模拟不同角色的权限体验",
        )
        sel_username = idx_map.get(sel)
        if sel_username:
            user = permission_manager.set_current_user(username=sel_username)
            st.session_state.current_user = user
            if user:
                role = UserRole(user.get("user_role", "external"))
                role_label = ROLE_LABELS.get(role, role.value)
                st.success(f"已登录为：**{user.get('display_name')}**\n\n角色：`{role_label}`")
        else:
            permission_manager.set_current_user(None)
            st.session_state.current_user = None
            st.warning("未登录，以外部人员身份浏览（敏感数据不可见）")

        st.divider()


def _render_event_selector():
    with st.sidebar:
        st.markdown("### 🎪 活动选择")
        events = analytics.get_events_list()
        if events.height == 0:
            st.info("暂无活动数据，请先生成模拟数据")
            return None

        event_options = [("所有活动", None)]
        for ev in events.iter_rows(named=True):
            label = f"{ev['event_name']} ({str(ev['event_date'])[:10]})"
            event_options.append((label, ev["event_id"]))

        role = permission_manager.get_current_role()
        accessible = permission_manager.get_accessible_events()
        if role != UserRole.ORGANIZER and accessible:
            event_options = [opt for opt in event_options if opt[1] is None or opt[1] in accessible]

        labels = [x[0] for x in event_options]
        event_map = {lbl: eid for lbl, eid in event_options}

        cur_label = "所有活动"
        if st.session_state.current_event_id:
            for lbl, eid in event_options:
                if eid == st.session_state.current_event_id:
                    cur_label = lbl
                    break

        try:
            default_idx = labels.index(cur_label)
        except ValueError:
            default_idx = 0

        sel = st.selectbox("选择活动", labels, index=default_idx, key="event_selector")
        event_id = event_map.get(sel)
        st.session_state.current_event_id = event_id

        if event_id:
            ev_detail = events.filter(pl.col("event_id") == event_id)
            if ev_detail.height > 0:
                ev = ev_detail.row(0, named=True)
                st.caption(
                    f"📍 {ev.get('venue', '-')}  ·  👥 容量 {ev.get('total_capacity', '-')}人  ·  🎫 {ev.get('organizer', '-')}"
                )
        st.divider()
        return event_id


def _render_navigation(event_id: Optional[str]):
    role = permission_manager.get_current_role()

    nav_items = []
    for page_label, (page_key, _, min_role) in PAGE_ROUTES.items():
        if permission_manager.role_has_access(min_role, role):
            nav_items.append((page_label, page_key))
        else:
            nav_items.append((f"🔒 {page_label}", f"__locked_{page_key}"))

    with st.sidebar:
        st.markdown("### 🧭 页面导航")
        nav_labels = [x[0] for x in nav_items]
        nav_map = {lbl: key for lbl, key in nav_items}

        default_label = nav_labels[0]
        if st.session_state.get("current_page"):
            for lbl, key in nav_items:
                if key == st.session_state.current_page:
                    default_label = lbl
                    break

        try:
            default_idx = nav_labels.index(default_label)
        except ValueError:
            default_idx = 0

        sel = st.radio(
            "选择页面",
            nav_labels,
            index=default_idx,
            key="nav_radio",
            label_visibility="collapsed",
        )
        page_key = nav_map.get(sel)
        if page_key and page_key.startswith("__locked_"):
            st.info(f"🔒 无权限访问 `{sel.replace('🔒 ', '')}` 页面，需升级角色")
            st.session_state.current_page = "overview"
        else:
            st.session_state.current_page = page_key or "overview"

        st.divider()
        return st.session_state.current_page


def _render_data_generator_panel():
    with st.sidebar:
        st.markdown("### ⚙️ 数据管理")
        with st.expander("🧪 模拟数据生成器", expanded=False):
            ev_count = st.slider("生成活动数量", 1, 5, 2, 1)
            replace = st.checkbox("覆盖现有数据", value=False)
            if st.button("🎲 生成模拟数据", type="primary", use_container_width=True):
                with st.spinner(f"正在生成 {ev_count} 场活动数据..."):
                    try:
                        counts = data_generator.populate_database(ev_count, replace=replace)
                        st.success("✅ 数据生成完成！")
                        total = sum(counts.values())
                        st.caption(f"共写入 {total} 条记录到 {len(counts)} 张表")
                        st.json({k: v for k, v in counts.items() if v > 0})
                        st.rerun()
                    except Exception as e:
                        st.error(f"数据生成失败：{e}")

            stats = []
            tables = db.get_table_names()
            for tbl in tables:
                try:
                    cnt = db.table_row_count(tbl)
                    stats.append((tbl, cnt))
                except Exception:
                    pass
            if stats:
                st.markdown("#### 📊 当前数据量")
                stats_df = pl.DataFrame(stats, schema=["表名", "记录数"])
                st.dataframe(stats_df.to_pandas(), use_container_width=True, hide_index=True, height=280)


def _handle_share_link():
    params = st.query_params
    token = params.get("share") or params.get("token")
    if not token:
        return None

    st.session_state.share_token = token
    share_data = share_link_manager.validate_link(token)
    st.session_state.share_data = share_data

    if not share_data:
        with st.sidebar:
            st.error("❌ 分享链接无效或已过期")
        return None

    with st.sidebar:
        scope_label = VIEW_SCOPES.get(share_data.get("view_scope"), share_data.get("view_scope"))
        st.info(f"🔗 通过分享链接访问\n\n**范围**：{scope_label}")

    allowed_roles = share_data.get("allowed_roles", []) or []
    current_role = permission_manager.get_current_role()

    if allowed_roles and current_role.value not in allowed_roles:
        allowed_labels = [ROLE_LABELS.get(UserRole(r), r) for r in allowed_roles]
        st.error(f"🔒 您的角色（{ROLE_LABELS.get(current_role, current_role.value)}）不在允许列表内\n\n允许角色：{', '.join(allowed_labels)}")
        return None

    scope = share_data.get("view_scope")
    share_event_id = share_data.get("event_id")

    scope_to_page = {
        "overview": "overview",
        "sponsors": "sponsors",
        "ticket_types": "ticket_types",
        "checkin_details": "checkin",
        "disputes": "disputes",
        "raw_records": "raw_records",
    }
    target_page = scope_to_page.get(scope, "overview")
    st.session_state.current_page = target_page
    if share_event_id:
        st.session_state.current_event_id = share_event_id

    return share_data


def _dispatch_page(page_key: str, event_id: Optional[str]):
    page_renderers = {
        "overview": render_overview_page,
        "sponsors": render_sponsors_page,
        "ticket_types": render_ticket_types_page,
        "checkin": render_checkin_page,
        "raw_records": render_raw_records_page,
        "disputes": render_disputes_page,
        "share": render_share_page,
    }
    renderer = page_renderers.get(page_key)
    if renderer:
        renderer(event_id)
    else:
        render_overview_page(event_id)


def main():
    _setup_page()
    _init_session_state()

    _sidebar_header()
    _render_user_panel()

    if not _ensure_data():
        st.error("🚨 数据库暂无数据！")
        st.markdown(
            """
            ## 🎫 欢迎使用活动票务核销漏斗报表系统

            请先在左侧边栏使用 **模拟数据生成器** 初始化演示数据，然后即可使用全部功能。

            ### 🚀 快速开始
            1. 在左侧【🧪 模拟数据生成器】点击 **🎲 生成模拟数据**
            2. 在【👤 登录模拟】选择不同角色体验权限差异
            3. 在【🧭 页面导航】切换各功能页面

            ### 📚 功能模块
            - 🎯 **总览看板**：核销漏斗、效率核心指标、入场时间分布、赞助商/票种/检票口综合分析
            - 🏢 **赞助清单**：赞助商票券利用率，下钻至关联票种 → 具体门票 → 闸机原始记录
            - 💎 **票种规则**：票种核销与收入矩阵，下钻至销售分布 → 门票列表 → 原始闸机记录
            - 🚪 **核销记录**：检票口效率、人员绩效、多维度筛选核销明细
            - 📦 **闸机原始记录**：底层设备数据、扫描Payload、故障排查
            - ⚖️ **退票争议**：争议工单、自动任务分派、处理结论归档
            - 🔗 **分享链接**：按角色控制的带权限分享，外部人员无法看到敏感字段

            ### 🛡️ 权限体系
            - **主办方**：全部数据，全部功能
            - **票务人员**：敏感字段可读，争议、分享链接管理
            - **检票员**：核销记录、总览，无敏感信息
            - **观众/外部**：仅总览、票种，且手机号/票码/交易流水全脱敏
            """
        )
        _render_data_generator_panel()
        return

    event_id = _render_event_selector()
    _handle_share_link()
    page_key = _render_navigation(event_id)
    _render_data_generator_panel()

    current_role = permission_manager.get_current_role()
    role_label = ROLE_LABELS.get(current_role, current_role.value)
    if current_role == UserRole.EXTERNAL:
        st.warning(
            f"🔍 当前以 **{role_label}** 身份浏览：手机号、邮箱、票码、交易流水等敏感字段已自动脱敏。"
            f"请在左侧选择登录身份以获得完整功能。"
        )

    st.info(
        f"💡 当前视图：页面=`{page_key}` | 活动=`{event_id or '全部'}` | 角色=`{role_label}`"
    )

    _dispatch_page(page_key, event_id)


if __name__ == "__main__":
    main()
