from datetime import datetime, timedelta
import dash
import dash_bootstrap_components as dbc
from dash import dcc, html, Input, Output, State, callback

from dashboard.layouts.funnel_dashboard import FunnelDashboard
from dashboard.layouts.images_view import ImagesView
from dashboard.layouts.payments_view import PaymentsView
from dashboard.layouts.patients_view import PatientsView
from dashboard.layouts.review_view import ReviewView


def serve_layout():
    navbar = dbc.NavbarSimple(
        children=[
            dbc.NavItem(dbc.NavLink("漏斗看板", href="/", id="nav-funnel")),
            dbc.NavItem(dbc.NavLink("影像附件", href="/images", id="nav-images")),
            dbc.NavItem(dbc.NavLink("收费明细", href="/payments", id="nav-payments")),
            dbc.NavItem(dbc.NavLink("患者档案", href="/patients", id="nav-patients")),
            dbc.NavItem(dbc.NavLink("数据复盘", href="/review", id="nav-review")),
            dbc.DropdownMenu(
                children=[
                    dbc.DropdownMenuItem(
                        [html.I(className="fas fa-sync-alt me-2"), "手动刷新"],
                        id="btn-manual-refresh",
                    ),
                    dbc.DropdownMenuItem(
                        [html.I(className="fas fa-download me-2"), "导出数据"],
                        id="btn-export-data",
                    ),
                ],
                nav=True,
                in_navbar=True,
                label=[
                    html.I(className="fas fa-cog me-1"),
                    "操作",
                ],
                align_end=True,
            ),
        ],
        brand=[
            html.I(className="fas fa-tooth me-2", style={"color": "#0dcaf0"}),
            "洁牙预约漏斗报表",
        ],
        brand_href="/",
        color="dark",
        dark=True,
        sticky="top",
        fluid=True,
        className="mb-4 shadow-lg",
    )

    date_filter = dbc.Card(
        dbc.CardBody(
            [
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.Label("时间范围", className="text-light small mb-1"),
                                dcc.Dropdown(
                                    id="date-range-preset",
                                    options=[
                                        {"label": "今日", "value": "today"},
                                        {"label": "本周", "value": "this_week"},
                                        {"label": "上周", "value": "last_week"},
                                        {"label": "本月", "value": "this_month"},
                                        {"label": "上月", "value": "last_month"},
                                        {"label": "本季度", "value": "this_quarter"},
                                        {"label": "本年", "value": "this_year"},
                                        {"label": "自定义", "value": "custom"},
                                    ],
                                    value="this_month",
                                    clearable=False,
                                    className="bg-dark text-light",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.Label("开始日期", className="text-light small mb-1"),
                                dcc.DatePickerSingle(
                                    id="start-date-picker",
                                    date=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                                    display_format="YYYY-MM-DD",
                                    className="bg-dark",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.Label("结束日期", className="text-light small mb-1"),
                                dcc.DatePickerSingle(
                                    id="end-date-picker",
                                    date=datetime.now().strftime("%Y-%m-%d"),
                                    display_format="YYYY-MM-DD",
                                    className="bg-dark",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.Label("分组维度", className="text-light small mb-1"),
                                dcc.Dropdown(
                                    id="group-by-selector",
                                    options=[
                                        {"label": "按日", "value": "day"},
                                        {"label": "按周", "value": "week"},
                                        {"label": "按月", "value": "month"},
                                    ],
                                    value="week",
                                    clearable=False,
                                    className="bg-dark text-light",
                                ),
                            ],
                            md=3,
                        ),
                    ],
                    className="align-items-center",
                )
            ]
        ),
        className="mb-4 bg-secondary border-0",
    )

    alert_container = html.Div(id="alert-container", className="mb-4")

    content = html.Div(id="page-content")

    return html.Div(
        [
            dcc.Location(id="url", refresh=False),
            dcc.Store(id="data-store", storage_type="memory"),
            dcc.Store(id="anomaly-store", storage_type="memory"),
            dcc.Download(id="download-excel"),
            dcc.Interval(
                id="auto-refresh-interval",
                interval=5 * 60 * 1000,
                n_intervals=0,
            ),
            navbar,
            dbc.Container(
                [
                    date_filter,
                    alert_container,
                    content,
                ],
                fluid=True,
            ),
            html.Footer(
                dbc.Container(
                    [
                        html.Hr(className="mt-4 mb-2"),
                        html.P(
                            [
                                html.I(className="fas fa-info-circle me-2"),
                                "洁牙预约漏斗报表系统 · 数据每5分钟自动刷新",
                            ],
                            className="text-center text-muted small",
                        ),
                    ],
                    fluid=True,
                )
            ),
        ],
        className="min-vh-100 bg-dark",
    )


@callback(
    Output("start-date-picker", "date"),
    Output("end-date-picker", "date"),
    Input("date-range-preset", "value"),
    State("start-date-picker", "date"),
    State("end-date-picker", "date"),
    prevent_initial_call=False,
)
def update_date_range(preset_value, current_start, current_end):
    if preset_value == "custom":
        return dash.no_update, dash.no_update

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    if preset_value == "today":
        start = end = today
    elif preset_value == "this_week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif preset_value == "last_week":
        start = today - timedelta(days=today.weekday() + 7)
        end = start + timedelta(days=6)
    elif preset_value == "this_month":
        start = today.replace(day=1)
        if start.month == 12:
            next_month = start.replace(year=start.year + 1, month=1)
        else:
            next_month = start.replace(month=start.month + 1)
        end = next_month - timedelta(days=1)
    elif preset_value == "last_month":
        if today.month == 1:
            last_month = today.replace(year=today.year - 1, month=12, day=1)
        else:
            last_month = today.replace(month=today.month - 1, day=1)
        if last_month.month == 12:
            next_month = last_month.replace(year=last_month.year + 1, month=1)
        else:
            next_month = last_month.replace(month=last_month.month + 1)
        start = last_month
        end = next_month - timedelta(days=1)
    elif preset_value == "this_quarter":
        quarter = (today.month - 1) // 3 + 1
        start = today.replace(month=(quarter - 1) * 3 + 1, day=1)
        if quarter == 4:
            next_quarter = start.replace(year=start.year + 1, month=1)
        else:
            next_quarter = start.replace(month=quarter * 3 + 1, day=1)
        end = next_quarter - timedelta(days=1)
    elif preset_value == "this_year":
        start = today.replace(month=1, day=1)
        end = today.replace(month=12, day=31)
    else:
        start, end = current_start, current_end

    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


@callback(
    Output("page-content", "children"),
    Output("nav-funnel", "active"),
    Output("nav-images", "active"),
    Output("nav-payments", "active"),
    Output("nav-patients", "active"),
    Output("nav-review", "active"),
    Input("url", "pathname"),
)
def display_page(pathname):
    pages = {
        "/": (FunnelDashboard().layout, True, False, False, False, False),
        "/images": (ImagesView().layout, False, True, False, False, False),
        "/payments": (PaymentsView().layout, False, False, True, False, False),
        "/patients": (PatientsView().layout, False, False, False, True, False),
        "/review": (ReviewView().layout, False, False, False, False, True),
    }

    default = (FunnelDashboard().layout, True, False, False, False, False)

    return pages.get(pathname, default)
