import os
import sys
from pathlib import Path
from datetime import date, timedelta

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))

from src.config import Role, ROLE_PERMISSIONS
from src.auth.permission import PermissionManager, UserContext
from src.reports.cleaning_funnel import CleaningFunnelReport
from src.data_sync.duckdb_store import DuckDBStore
from src.sample_data import seed_sample_data

DB_PATH = Path(__file__).parent / "data" / "cleaning_report.duckdb"
ROLE_LABELS = {
    Role.ADMIN: "系统管理员",
    Role.FINANCE: "财务",
    Role.HOUSEKEEPER: "管家",
    Role.MAINTENANCE: "维修员",
    Role.TENANT: "租客",
    Role.EXTERNAL: "外部人员",
}


def init_data():
    if not DB_PATH.exists():
        with st.spinner("正在初始化示例数据..."):
            info = seed_sample_data()
            st.success(f"示例数据已初始化: {info}")


def login_sidebar() -> UserContext:
    st.sidebar.header("用户登录")
    pm = PermissionManager()

    share_token = st.sidebar.text_input("分享链接 Token（可选）", value=st.query_params.get("token", ""))
    if share_token:
        user = pm.validate_share_link(share_token)
        if user:
            st.sidebar.success(f"以分享身份登录: {ROLE_LABELS.get(user.role, user.role)}")
            return user
        st.sidebar.warning("分享链接无效或已过期")

    demo_users = ["admin", "finance_zhang", "housekeeper_li", "maintenance_zhao", "tenant_001"]
    username = st.sidebar.selectbox("选择演示用户", demo_users, index=0)
    user = pm.get_user(username)
    if user is None:
        user = pm.create_user(username, Role.ADMIN)

    st.sidebar.info(f"当前角色: {ROLE_LABELS.get(user.role, user.role)}")
    if user.region:
        st.sidebar.info(f"管辖区域: {user.region}")
    if user.tenant_id:
        st.sidebar.info(f"租客编号: {user.tenant_id}")
    return user


def render_share_manager(user: UserContext):
    st.subheader("分享链接管理")
    if not user.has_permission("manage_shares"):
        st.warning("您没有分享链接管理权限")
        return

    pm = PermissionManager()
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        share_role = st.selectbox(
            "分享角色",
            [Role.EXTERNAL, Role.TENANT, Role.HOUSEKEEPER, Role.MAINTENANCE, Role.FINANCE],
            format_func=lambda r: ROLE_LABELS.get(r, r),
        )
    with col2:
        share_region = st.text_input("限制区域（可选）", value="")
    with col3:
        share_tenant = st.text_input("限制租客（可选）", value="")
    with col4:
        expires_days = st.number_input("有效天数", min_value=1, max_value=365, value=7)
    with col5:
        st.text("")
        if st.button("生成分享链接", type="primary"):
            token = pm.create_share_link(
                created_by=user.username,
                role=share_role,
                region=share_region or None,
                tenant_id=share_tenant or None,
                expires_days=expires_days,
            )
            share_url = f"{st.get_option('server.baseUrlPath') or ''}?token={token}"
            st.success(f"分享 Token: `{token}`")
            st.code(share_url)

    links = pm.list_share_links(user.username if not user.has_permission("view_all_regions") else None)
    if not links.is_empty():
        st.dataframe(links.to_pandas(), use_container_width=True)


def render_sync_audit(user: UserContext):
    st.subheader("同步节点审计")
    db = DuckDBStore()
    audit = db.get_sync_audit(200)
    if audit.is_empty():
        st.info("暂无同步记录，可运行数据同步管道生成记录")
        return
    st.dataframe(audit.to_pandas(), use_container_width=True)


def render_kpi_cards(report: CleaningFunnelReport, start_date: date, end_date: date, region):
    metrics = [
        ("arrival_rate", "到场率", "%"),
        ("on_time_rate", "准时率", "%"),
        ("completion_rate", "完成率", "%"),
        ("reminder_rate", "提醒覆盖率", "%"),
        ("total_scheduled", "排班总数", "单"),
    ]

    cols = st.columns(len(metrics))
    for i, (key, label, unit) in enumerate(metrics):
        mom = report.compare_metrics(key, start_date, end_date, region, "mom")
        yoy = report.compare_metrics(key, start_date, end_date, region, "yoy")
        val = mom["current"]
        delta = f"{mom['diff_pct']:+.1f}% 环比"
        if yoy["diff_pct"] != 0:
            delta += f" / {yoy['diff_pct']:+.1f}% 同比"

        with cols[i]:
            st.metric(
                label,
                f"{val:.1f}{unit}" if unit == "%" else f"{int(val)}{unit}",
                delta=delta,
            )


def render_funnel_tab(report: CleaningFunnelReport, start_date: date, end_date: date, region):
    render_kpi_cards(report, start_date, end_date, region)

    _, fig = report.build_funnel(start_date, end_date, region)
    st.plotly_chart(fig, use_container_width=True)

    col1, col2 = st.columns(2)
    with col1:
        group_by = st.selectbox("分组方式", ["date", "region", "cleaner", "region_date"], index=0,
                                format_func=lambda x: {"date": "按日期", "region": "按区域",
                                                       "cleaner": "按保洁员", "region_date": "按区域+日期"}[x])
        _, fig = report.build_arrival_rate_trend(start_date, end_date, region, group_by)
        st.plotly_chart(fig, use_container_width=True)
    with col2:
        _, fig = report.build_region_comparison(start_date, end_date)
        st.plotly_chart(fig, use_container_width=True)


def render_conflict_tab(report: CleaningFunnelReport):
    st.markdown("### 时段冲突检测")
    target_date = st.date_input("选择日期", value=date.today() - timedelta(days=5))
    conflicts, fig = report.build_conflict_chart(target_date)

    if conflicts.is_empty():
        st.success(f"{target_date} 未检测到时段冲突")
    else:
        st.warning(f"检测到 {len(conflicts)} 组时段冲突")
        st.plotly_chart(fig, use_container_width=True, on_select="rerun")

        st.markdown("#### 冲突明细 - 点击跳转")
        conflict_df = conflicts.to_pandas()
        event = st.dataframe(
            conflict_df,
            use_container_width=True,
            on_select="rerun",
            selection_mode=["multi-row"],
        )
        if event and event.selection and event.selection.get("rows"):
            selected_idx = event.selection["rows"][0]
            row = conflict_df.iloc[selected_idx]
            for sid in [row["schedule_a"], row["schedule_b"]]:
                st.markdown(f"**排班 {sid} 明细**")
                detail = report.get_schedule_detail(sid)
                if detail is not None and not detail.is_empty():
                    st.dataframe(detail.to_pandas(), use_container_width=True)


def render_calendar_tab(report: CleaningFunnelReport, start_date: date, end_date: date, region):
    st.markdown("### 日历视图 - 点击时段跳明细")
    model = report.schedule_model
    schedules = model.get_schedules(start_date, end_date, region)
    schedules = report._apply(schedules)
    if schedules.is_empty():
        st.info("该时间段无排班数据")
        return

    st.dataframe(
        schedules.to_pandas(),
        use_container_width=True,
        on_select="rerun",
        selection_mode=["multi-row"],
        hide_index=True,
    )

    event = st.session_state.get("dataframe_selection")
    if "dataframe_selection" in locals() or True:
        selected = st.selectbox("查看排班明细 (输入排班ID)", [""] + schedules["id"].to_list()[:50])
        if selected:
            detail = report.get_schedule_detail(selected)
            if detail is not None and not detail.is_empty():
                st.dataframe(detail.to_pandas(), use_container_width=True)


def render_reminder_tab(report: CleaningFunnelReport, start_date: date, end_date: date, region):
    st.markdown("### 到场状态与提醒名单（支持同环比）")

    metric = st.selectbox(
        "选择对比指标",
        ["arrival_rate", "on_time_rate", "reminder_rate", "total_scheduled"],
        format_func=lambda x: {
            "arrival_rate": "到场率",
            "on_time_rate": "准时率",
            "reminder_rate": "提醒覆盖率",
            "total_scheduled": "排班总数",
        }[x],
    )
    col1, col2 = st.columns(2)
    with col1:
        mom = report.compare_metrics(metric, start_date, end_date, region, "mom")
        st.markdown("#### 环比对比")
        st.json(mom)
    with col2:
        yoy = report.compare_metrics(metric, start_date, end_date, region, "yoy")
        st.markdown("#### 同比对比")
        st.json(yoy)

    st.markdown("#### 待提醒名单")
    reminders = report.build_reminder_list(start_date, end_date, region)
    if reminders.is_empty():
        st.success("暂无需要提醒的排班")
    else:
        st.dataframe(reminders.to_pandas(), use_container_width=True)


def render_capacity_tab(report: CleaningFunnelReport):
    st.markdown("### 容量规则说明")
    target_date = st.date_input("选择目标日期", value=date.today())
    region = st.selectbox("区域（可选）", [""] + ["东城区", "西城区", "朝阳区", "海淀区", "丰台区"])
    cap = report.build_capacity_explanation(target_date, region or None)
    st.info(cap["explanation"])

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("在岗保洁员", cap["total_cleaners_on_duty"])
    with col2:
        st.metric("人均任务数", cap["avg_tasks_per_cleaner"])
    with col3:
        st.metric("超员保洁员", cap["overloaded_cleaners"])
    with col4:
        st.metric("单日上限", cap["max_daily_tasks"])

    st.markdown("#### 容量规则配置")
    st.json(cap["rules"])

    if not cap["utilization_data"].is_empty():
        st.markdown("#### 各保洁员任务分布")
        st.dataframe(cap["utilization_data"].to_pandas(), use_container_width=True)


def main():
    st.set_page_config(page_title="长租公寓保洁排班漏斗报表", layout="wide")
    init_data()

    user = login_sidebar()
    report = CleaningFunnelReport(user)

    st.title("🏠 长租公寓保洁排班漏斗报表")
    st.caption(f"当前登录: {user.username} ({ROLE_LABELS.get(user.role, user.role)})")

    with st.sidebar:
        st.divider()
        st.header("筛选条件")
        end_date_default = date.today()
        start_date_default = end_date_default - timedelta(days=30)
        start_date = st.date_input("开始日期", value=start_date_default)
        end_date = st.date_input("结束日期", value=end_date_default)
        regions = ["东城区", "西城区", "朝阳区", "海淀区", "丰台区"]
        region = st.selectbox("区域（全部区域权限才可用）", [""] + regions)
        if not user.has_permission("view_all_regions") and user.region:
            st.info(f"权限限制：仅可见 {user.region}")
            region = user.region

    tabs = st.tabs([
        "📊 漏斗与到场率",
        "⚠️ 时段冲突",
        "📅 日历明细",
        "🔔 提醒名单(同环比)",
        "📏 容量规则",
        "🔗 分享链接",
        "📝 同步审计",
    ])

    with tabs[0]:
        render_funnel_tab(report, start_date, end_date, region or None)
    with tabs[1]:
        render_conflict_tab(report)
    with tabs[2]:
        render_calendar_tab(report, start_date, end_date, region or None)
    with tabs[3]:
        render_reminder_tab(report, start_date, end_date, region or None)
    with tabs[4]:
        render_capacity_tab(report)
    with tabs[5]:
        render_share_manager(user)
    with tabs[6]:
        render_sync_audit(user)


if __name__ == "__main__":
    main()
