from dash import dcc, html
import dash_bootstrap_components as dbc
from datetime import date, timedelta

from config import Config


def _prefixed(prefix: str, id_name: str) -> str:
    if not prefix:
        return id_name
    return f"{prefix}-{id_name}"


def build_filter_bar(prefix: str = "", show_zone_filter: bool = True, is_management: bool = True):
    today = date.today()
    week_ago = today - timedelta(days=7)

    controls = [
        dbc.Col(
            html.Label("日期范围", className="fw-bold text-muted small"),
            width="auto",
            align="center",
        ),
        dbc.Col(
            dcc.DatePickerRange(
                id=_prefixed(prefix, "date-range"),
                start_date=week_ago,
                end_date=today,
                display_format="YYYY-MM-DD",
                start_date_placeholder_text="开始日期",
                end_date_placeholder_text="结束日期",
                calendar_orientation="horizontal",
                className="border-0",
            ),
            width="auto",
        ),
    ]

    if show_zone_filter and is_management:
        controls.extend([
            dbc.Col(
                html.Label("选择区域", className="fw-bold text-muted small ms-3"),
                width="auto",
                align="center",
            ),
            dbc.Col(
                dcc.Dropdown(
                    id=_prefixed(prefix, "zone-filter"),
                    options=[{"label": z, "value": z} for z in Config.ZONES],
                    value=None,
                    multi=True,
                    placeholder="全部区域",
                    searchable=True,
                    clearable=True,
                    style={"minWidth": "220px"},
                ),
                width=4,
            ),
        ])

    controls.extend([
        dbc.Col(
            dcc.Dropdown(
                id=_prefixed(prefix, "slot-filter"),
                options=[{"label": s, "value": s} for s in Config.TIME_SLOTS],
                value=None,
                multi=True,
                placeholder="全部时段",
                clearable=True,
                style={"minWidth": "180px"},
            ),
            width=3,
        ),
        dbc.Col(
            dbc.Button(
                [html.I(className="bi bi-arrow-clockwise me-2"), "刷新数据"],
                id=_prefixed(prefix, "refresh-btn"),
                color="primary",
                outline=True,
                className="ms-auto",
                n_clicks=0,
            ),
            width="auto",
            className="ms-auto",
        ),
    ])

    return dbc.Row(controls, className="g-2 align-items-center mb-3 p-3 bg-light rounded-3 border")


def build_kpi_row(prefix: str = "", include_consumed: bool = True):
    cols = [
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-calendar-check fs-4 text-primary"),
                        html.Span("预约总数", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-reservation"), className="mt-2 mb-0 text-primary fw-bold", children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=3, sm=6, className="mb-3",
        ),
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-door-open fs-4 text-success"),
                        html.Span("到场总数", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-checkin"), className="mt-2 mb-0 text-success fw-bold", children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=3, sm=6, className="mb-3",
        ),
    ]
    if include_consumed:
        cols.append(
            dbc.Col(
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.I(className="bi bi-bag-check fs-4 text-warning"),
                            html.Span("关联预约消费人数", className="ms-2 text-muted small fw-bold"),
                        ]),
                        html.H2(id=_prefixed(prefix, "kpi-consumed"), className="mt-2 mb-0 text-warning fw-bold", children="—"),
                    ]),
                    className="shadow-sm border-0 h-100",
                ),
                md=3, sm=6, className="mb-3",
            )
        )
    cols.append(
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-percent fs-4 text-info"),
                        html.Span("平均到场率", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-rate"), className="mt-2 mb-0 text-info fw-bold", children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=3, sm=6, className="mb-3",
        )
    )
    return dbc.Row(cols, className="mb-4")


def build_operation_kpi_row(prefix: str = ""):
    cols = [
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-camera-video fs-4 text-secondary"),
                        html.Span("摄像头总客流", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-camera-flow"), className="mt-2 mb-0 text-secondary fw-bold", children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=4, sm=6, className="mb-3",
        ),
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-shop-window fs-4 text-purple"),
                        html.Span("商户总客流(含散客)", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-merchant-visitors"), className="mt-2 mb-0 fw-bold", style={"color": "#6f42c1"}, children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=4, sm=6, className="mb-3",
        ),
        dbc.Col(
            dbc.Card(
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-cash-stack fs-4 text-success"),
                        html.Span("商户总营业额(含散客)", className="ms-2 text-muted small fw-bold"),
                    ]),
                    html.H2(id=_prefixed(prefix, "kpi-merchant-amount"), className="mt-2 mb-0 text-success fw-bold", children="—"),
                ]),
                className="shadow-sm border-0 h-100",
            ),
            md=4, sm=6, className="mb-3",
        ),
    ]
    return dbc.Row(cols, className="mb-2")


def build_user_banner(prefix: str = "", user_info: dict = None, show_logout_btn: bool = True):
    user_info = user_info or {}
    role_badge = dbc.Badge(
        "管理层" if user_info.get("is_management") else "一线人员",
        color="danger" if user_info.get("is_management") else "primary",
        pill=True,
        className="ms-2",
    )
    zone_text = "全局权限" if user_info.get("is_management") else f"负责区域: {user_info.get('assigned_zone') or '未分配'}"

    right_col_children = []
    if show_logout_btn:
        right_col_children.append(
            dbc.Button(
                [html.I(className="bi bi-box-arrow-right me-2"), "退出登录"],
                id=_prefixed(prefix, "logout-btn"),
                color="secondary",
                outline=True,
                size="sm",
                className="float-end mt-3",
                n_clicks=0,
            )
        )

    return dbc.Row(
        [
            dbc.Col([
                html.H3([
                    html.I(className="bi bi-bar-chart-line-fill text-primary me-2"),
                    "景区门票预约漏斗报表",
                ], className="mb-1 fw-bold"),
                html.Div([
                    html.Span([html.I(className="bi bi-person-circle me-1"), user_info.get("full_name") or user_info.get("username") or ""]),
                    role_badge,
                    html.Span(f" · {zone_text}", className="text-muted ms-2"),
                ], className="text-muted"),
            ], md=8),
            dbc.Col(
                right_col_children,
                md=4,
            ),
        ],
        className="align-items-center mb-4 pb-3 border-bottom",
    )
