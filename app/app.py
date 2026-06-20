import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from dash import Dash, dcc, html, Input, Output, State, callback, ctx, no_update, clientside_callback
import dash_bootstrap_components as dbc

from config import Config
from app.auth import AuthContext
from app.data_service import DataService
from app.charts import (
    create_arrival_status_chart,
    create_reminder_funnel_chart,
    create_timeslot_heatmap,
    create_capacity_change_chart,
    create_kpi_cards,
    create_zone_rate_bar,
    create_pending_reminder_bar,
)
from app.pages.login_view import build_login_layout
from app.pages.management_view import build_management_layout
from app.pages.frontline_view import build_frontline_layout


app = Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    ],
    suppress_callback_exceptions=True,
    title="景区门票预约漏斗报表",
)
app.server.secret_key = Config.DASH_SECRET_KEY


app.layout = html.Div([
    dcc.Location(id="url", refresh=False),
    dcc.Store(id="user-store", data=None),
    dcc.Store(id="filter-zone-store", data=None),
    html.Div(id="page-content"),
])


@callback(
    Output("page-content", "children"),
    Output("user-store", "data"),
    Input("url", "pathname"),
    State("login-username", "value"),
    State("login-password", "value"),
    Input("login-submit", "n_clicks"),
    Input("logout-btn", "n_clicks"),
    prevent_initial_call=False,
)
def render_page(pathname, username, password, login_clicks, logout_clicks):
    triggered = ctx.triggered_id

    if triggered == "logout-btn":
        AuthContext.clear_session()
        return build_login_layout(), None

    if triggered == "login-submit" and login_clicks and login_clicks > 0:
        if not username or not password:
            return build_login_layout("请输入用户名和密码"), None
        user = AuthContext.login(username, password)
        if not user:
            return build_login_layout("用户名或密码错误"), None
        AuthContext.set_session_user(user)
        user_info = AuthContext.get_current_user()
        if user_info["is_management"]:
            return build_management_layout(user_info), user_info
        else:
            return build_frontline_layout(user_info), user_info

    user_info = AuthContext.get_current_user()
    if not user_info["is_authenticated"]:
        return build_login_layout(), None

    if user_info["is_management"]:
        return build_management_layout(user_info), user_info
    else:
        return build_frontline_layout(user_info), user_info


def _load_filtered_data(user_info, start_date_str, end_date_str, zones_selected, slots_selected):
    if not start_date_str or not end_date_str:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    start_date = date.fromisoformat(start_date_str)
    end_date = date.fromisoformat(end_date_str)

    if user_info["is_management"]:
        zones = zones_selected if zones_selected else None
    else:
        zones = AuthContext.get_accessible_zones()

    df = DataService.get_funnel_data(start_date, end_date, zones=zones, time_slots=slots_selected)
    df_status = DataService.get_arrival_status_distribution(df)
    df_funnel = DataService.get_funnel_summary(df)
    df_rank = DataService.get_calendar_timeslot_rank(df)
    df_cap = DataService.get_capacity_changes(start_date, end_date, zones=zones)
    df_zone = DataService.get_zone_detail_rates(df)
    df_pending = DataService.get_reminder_list(df)
    df_batches = DataService.get_recent_batches(limit=15)

    return df, df_status, df_funnel, df_rank, df_cap, df_zone, df_pending, df_batches


@app.callback(
    [
        Output("kpi-reservation", "children"),
        Output("kpi-checkin", "children"),
        Output("kpi-consumed", "children"),
        Output("kpi-rate", "children"),
        Output("chart-status-dist", "figure"),
        Output("chart-funnel", "figure"),
        Output("chart-timeslot-heatmap", "figure"),
        Output("chart-capacity-change", "figure"),
        Output("chart-zone-rate", "figure"),
        Output("table-batches", "data"),
        Output("table-batches", "columns"),
    ],
    [
        Input("date-range", "start_date"),
        Input("date-range", "end_date"),
        Input("zone-filter", "value"),
        Input("slot-filter", "value"),
        Input("refresh-btn", "n_clicks"),
    ],
    State("user-store", "data"),
    prevent_initial_call=False,
)
def update_management_dashboard(start_date, end_date, zones, slots, refresh_clicks, user_info):
    if not user_info or not user_info.get("is_management"):
        return [no_update] * 11

    try:
        df, df_status, df_funnel, df_rank, df_cap, df_zone, df_pending, df_batches = _load_filtered_data(
            user_info, start_date, end_date, zones, slots
        )
    except Exception:
        df, df_status, df_funnel, df_rank, df_cap, df_zone = [pd.DataFrame()] * 6
        df_batches = pd.DataFrame()

    kpi_vals = create_kpi_cards(df)
    fig_status = create_arrival_status_chart(df_status)
    fig_funnel = create_reminder_funnel_chart(df_funnel)
    fig_heatmap = create_timeslot_heatmap(df_rank)
    fig_cap = create_capacity_change_chart(df_cap)
    fig_zone = create_zone_rate_bar(df_zone)

    batch_cols = [{"name": c, "id": c} for c in df_batches.columns.tolist()] if not df_batches.empty else []

    return [
        kpi_vals[0],
        kpi_vals[1],
        kpi_vals[2],
        kpi_vals[3],
        fig_status,
        fig_funnel,
        fig_heatmap,
        fig_cap,
        fig_zone,
        df_batches.to_dict("records") if not df_batches.empty else [],
        batch_cols,
    ]


@app.callback(
    [
        Output("kpi-reservation", "children", allow_duplicate=True),
        Output("kpi-checkin", "children", allow_duplicate=True),
        Output("kpi-rate", "children", allow_duplicate=True),
        Output("kpi-pending", "children"),
        Output("chart-zone-rate", "figure", allow_duplicate=True),
        Output("chart-pending-reminder", "figure"),
        Output("chart-timeslot-heatmap", "figure", allow_duplicate=True),
        Output("table-funnel-detail", "data"),
        Output("table-funnel-detail", "columns"),
    ],
    [
        Input("date-range", "start_date"),
        Input("date-range", "end_date"),
        Input("slot-filter", "value"),
        Input("refresh-btn", "n_clicks"),
    ],
    State("user-store", "data"),
    prevent_initial_call="initial_duplicate",
)
def update_frontline_dashboard(start_date, end_date, slots, refresh_clicks, user_info):
    if not user_info or user_info.get("is_management"):
        return [no_update] * 9

    try:
        df, df_status, df_funnel, df_rank, df_cap, df_zone, df_pending, df_batches = _load_filtered_data(
            user_info, start_date, end_date, None, slots
        )
    except Exception:
        df, df_rank, df_zone, df_pending = [pd.DataFrame()] * 4

    total_resv = int(df["reservation_count"].sum()) if not df.empty else 0
    total_checkin = int(df["checked_in"].sum()) if not df.empty else 0
    avg_rate = df["checkin_rate"].mean() if not df.empty and "checkin_rate" in df.columns else 0
    pending_total = int(df_pending["pending_reminder"].sum()) if not df_pending.empty else 0

    fig_zone = create_zone_rate_bar(df_zone)
    fig_pending = create_pending_reminder_bar(df_pending)
    fig_heatmap = create_timeslot_heatmap(df_rank)

    detail_cols = []
    detail_data = []
    if not df.empty:
        disp_df = df.rename(columns={
            "date": "日期",
            "time_slot": "时段",
            "zone": "区域",
            "reservation_count": "预约数",
            "reminder_sent": "已提醒",
            "checked_in": "已到场",
            "in_zone": "已到区域",
            "consumed": "已消费",
            "cancelled": "已取消",
            "no_show": "未到场",
            "checkin_rate": "到场率",
            "in_zone_rate": "到区域率",
            "conversion_rate": "消费转化率",
            "arrival_status": "状态",
            "remark": "备注说明",
        })
        preferred = ["日期", "时段", "区域", "预约数", "已到场", "未到场",
                     "到场率", "到区域率", "消费转化率", "状态", "备注说明"]
        cols = [c for c in preferred if c in disp_df.columns]
        detail_cols = [{"name": c, "id": c} for c in cols]
        detail_data = disp_df[cols].to_dict("records")

    return [
        f"{total_resv:,}",
        f"{total_checkin:,}",
        f"{avg_rate * 100:.1f}%" if avg_rate else "0.0%",
        f"{pending_total:,}",
        fig_zone,
        fig_pending,
        fig_heatmap,
        detail_data,
        detail_cols,
    ]


if __name__ == "__main__":
    print("=" * 60)
    print(" 景区门票预约漏斗报表系统")
    print(" 访问地址: http://localhost:8050")
    print("=" * 60)
    print()
    print("测试账号:")
    print("  管理层  -> admin  / admin123")
    print("  一线人员 -> staff  / staff123  (主入口区,核心景区A)")
    print()
    app.run_server(debug=True, host="0.0.0.0", port=8050)
