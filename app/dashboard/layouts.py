from datetime import date
import dash_bootstrap_components as dbc
from dash import dcc, html

SIDEBAR_STYLE = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "260px",
    "padding": "20px 15px",
    "background-color": "#f8f9fa",
    "border-right": "1px solid #e9ecef",
}

CONTENT_STYLE = {
    "margin-left": "260px",
    "margin-right": "20px",
    "padding": "20px 10px",
}


def create_sidebar():
    return html.Div(
        [
            html.H4("票务漏斗分析", className="text-center mb-4 text-primary"),
            html.Hr(),
            html.H6("筛选条件", className="text-muted mb-3"),
            dbc.Card(
                [
                    dbc.CardBody(
                        [
                            html.Div(
                                [
                                    html.Label("活动选择", className="fw-bold"),
                                    dcc.Dropdown(
                                        id="activity-selector",
                                        placeholder="选择活动",
                                        clearable=False,
                                        className="mb-3",
                                    ),
                                ]
                            ),
                            html.Div(
                                [
                                    html.Label("日期范围", className="fw-bold"),
                                    dcc.DatePickerRange(
                                        id="date-range",
                                        start_date=date(2024, 6, 1),
                                        end_date=date(2024, 8, 31),
                                        display_format="YYYY-MM-DD",
                                        className="w-100 mb-3",
                                    ),
                                ]
                            ),
                            html.Div(
                                [
                                    html.Label("票种类型", className="fw-bold"),
                                    dcc.Dropdown(
                                        id="ticket-type-filter",
                                        placeholder="全部票种",
                                        multi=True,
                                        className="mb-3",
                                    ),
                                ]
                            ),
                            html.Div(
                                [
                                    html.Label("赞助级别", className="fw-bold"),
                                    dcc.Dropdown(
                                        id="sponsor-level-filter",
                                        placeholder="全部级别",
                                        multi=True,
                                        className="mb-3",
                                    ),
                                ]
                            ),
                            dbc.Button(
                                "应用筛选",
                                id="apply-filter-btn",
                                color="primary",
                                className="w-100 mt-2",
                                size="sm",
                            ),
                            dbc.Button(
                                "重置筛选",
                                id="reset-filter-btn",
                                color="secondary",
                                className="w-100 mt-2",
                                size="sm",
                                outline=True,
                            ),
                        ]
                    )
                ],
                className="mb-3",
            ),
            html.Hr(),
            html.H6("数据同步", className="text-muted mb-3"),
            dbc.Button(
                [html.I(className="fas fa-sync-alt me-2"), "同步数据"],
                id="sync-data-btn",
                color="success",
                className="w-100 mb-2",
                size="sm",
            ),
            dbc.Button(
                [html.I(className="fas fa-download me-2"), "导出报表"],
                id="export-btn",
                color="info",
                className="w-100",
                size="sm",
                outline=True,
            ),
            dcc.Interval(
                id="sync-status-interval",
                interval=5000,
                disabled=True,
            ),
            html.Div(id="sync-status", className="mt-2 small text-muted"),
        ],
        style=SIDEBAR_STYLE,
    )


def create_header():
    return dbc.Row(
        [
            dbc.Col(
                [
                    html.H2("活动票务 / 演出票务 漏斗分析", className="text-dark mb-1"),
                    html.P(
                        "团队例会专用口径 · 赞助 → 报名 → 支付 → 核销",
                        className="text-muted",
                    ),
                ],
                width=8,
            ),
            dbc.Col(
                [
                    html.Div(
                        [
                            html.Small("更新时间：", className="text-muted"),
                            html.Span(id="last-update-time", className="fw-bold"),
                        ],
                        className="text-end",
                    ),
                ],
                width=4,
                className="d-flex align-items-center justify-content-end",
            ),
        ],
        className="mb-4",
    )


def create_kpi_cards():
    return dbc.Row(
        [
            dbc.Col(
                dbc.Card(
                    [
                        dbc.CardBody(
                            [
                                html.Div(
                                    [
                                        html.I(
                                            className="fas fa-ticket-alt fa-2x text-primary me-3"
                                        ),
                                        html.Div(
                                            [
                                                html.H5(
                                                    id="kpi-sponsors",
                                                    className="card-title mb-0",
                                                ),
                                                html.Small(
                                                    "赞助票数",
                                                    className="text-muted",
                                                ),
                                            ]
                                        ),
                                    ],
                                    className="d-flex align-items-center",
                                )
                            ]
                        )
                    ],
                    className="shadow-sm",
                ),
                width=3,
            ),
            dbc.Col(
                dbc.Card(
                    [
                        dbc.CardBody(
                            [
                                html.Div(
                                    [
                                        html.I(
                                            className="fas fa-user-plus fa-2x text-success me-3"
                                        ),
                                        html.Div(
                                            [
                                                html.H5(
                                                    id="kpi-registrations",
                                                    className="card-title mb-0",
                                                ),
                                                html.Small(
                                                    "报名人数",
                                                    className="text-muted",
                                                ),
                                            ]
                                        ),
                                    ],
                                    className="d-flex align-items-center",
                                )
                            ]
                        )
                    ],
                    className="shadow-sm",
                ),
                width=3,
            ),
            dbc.Col(
                dbc.Card(
                    [
                        dbc.CardBody(
                            [
                                html.Div(
                                    [
                                        html.I(
                                            className="fas fa-credit-card fa-2x text-info me-3"
                                        ),
                                        html.Div(
                                            [
                                                html.H5(
                                                    id="kpi-payments",
                                                    className="card-title mb-0",
                                                ),
                                                html.Small(
                                                    "支付完成",
                                                    className="text-muted",
                                                ),
                                            ]
                                        ),
                                    ],
                                    className="d-flex align-items-center",
                                )
                            ]
                        )
                    ],
                    className="shadow-sm",
                ),
                width=3,
            ),
            dbc.Col(
                dbc.Card(
                    [
                        dbc.CardBody(
                            [
                                html.Div(
                                    [
                                        html.I(
                                            className="fas fa-door-open fa-2x text-warning me-3"
                                        ),
                                        html.Div(
                                            [
                                                html.H5(
                                                    id="kpi-checkins",
                                                    className="card-title mb-0",
                                                ),
                                                html.Small(
                                                    "核销入场",
                                                    className="text-muted",
                                                ),
                                            ]
                                        ),
                                    ],
                                    className="d-flex align-items-center",
                                )
                            ]
                        )
                    ],
                    className="shadow-sm",
                ),
                width=3,
            ),
        ],
        className="mb-4",
    )


def create_funnel_chart_section():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.Div(
                        [
                            html.H5("转化漏斗", className="mb-0"),
                            html.Div(
                                [
                                    dbc.Button(
                                        [html.I(className="fas fa-comment-alt me-1"), "备注"],
                                        id="funnel-remark-btn",
                                        size="sm",
                                        color="secondary",
                                        outline=True,
                                        className="me-2",
                                    ),
                                    dbc.Badge(
                                        id="funnel-remark-count",
                                        color="primary",
                                        className="me-2",
                                    ),
                                ],
                                className="ms-auto",
                            ),
                        ],
                        className="d-flex align-items-center",
                    )
                ],
                className="bg-white",
            ),
            dbc.CardBody(
                [
                    dcc.Graph(id="funnel-chart", style={"height": "400px"}),
                ]
            ),
        ],
        className="mb-4 shadow-sm",
    )


def create_sponsor_section():
    from dash import dash_table
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.H5("赞助清单", className="mb-0"),
                    html.Span("点击行可下钻查看核销记录", className="text-muted small ms-3"),
                ],
                className="bg-white d-flex align-items-center",
            ),
            dbc.CardBody(
                [
                    dash_table.DataTable(
                        id="sponsor-table",
                        columns=[
                            {"name": "赞助商名称", "id": "name"},
                            {"name": "赞助级别", "id": "sponsor_level"},
                            {"name": "分配票数", "id": "allocated_tickets"},
                            {"name": "已使用", "id": "used_tickets"},
                            {"name": "已核销", "id": "checked_tickets"},
                            {"name": "使用率", "id": "使用率"},
                            {"name": "核销率", "id": "核销率"},
                        ],
                        data=[],
                        row_selectable="single",
                        selected_rows=[],
                        style_table={"overflowX": "auto", "maxHeight": "400px"},
                        style_header={
                            "backgroundColor": "#f8f9fa",
                            "fontWeight": "bold",
                        },
                        style_cell={
                            "textAlign": "left",
                            "padding": "10px",
                            "fontSize": "13px",
                        },
                        style_data_conditional=[
                            {
                                "if": {"row_index": "odd"},
                                "backgroundColor": "#fafafa",
                            },
                            {
                                "if": {"state": "selected"},
                                "backgroundColor": "#e3f2fd",
                                "border": "1px solid #2196f3",
                            },
                        ],
                        style_as_list_view=True,
                        page_size=10,
                        sort_action="native",
                    ),
                ]
            ),
        ],
        className="mb-4 shadow-sm",
    )


def create_drilldown_section():
    return html.Div(
        id="drilldown-container",
        children=[
            dbc.Card(
                [
                    dbc.CardHeader(
                        [
                            html.Div(
                                [
                                    html.H5("下钻详情", className="mb-0"),
                                    dbc.Button(
                                        "关闭",
                                        id="close-drilldown-btn",
                                        size="sm",
                                        color="secondary",
                                        outline=True,
                                    ),
                                ],
                                className="d-flex justify-content-between align-items-center",
                            )
                        ],
                        className="bg-white",
                    ),
                    dbc.CardBody(
                        [
                            dbc.Tabs(
                                [
                                    dbc.Tab(
                                        label="核销记录",
                                        tab_id="gate-records-tab",
                                        children=[
                                            html.Div(
                                                id="gate-records-content",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                    dbc.Tab(
                                        label="票种规则",
                                        tab_id="ticket-rules-tab",
                                        children=[
                                            html.Div(
                                                id="ticket-rules-content",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                    dbc.Tab(
                                        label="原始样本",
                                        tab_id="raw-samples-tab",
                                        children=[
                                            html.Div(
                                                id="raw-samples-content",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                ],
                                id="drilldown-tabs",
                                active_tab="gate-records-tab",
                            ),
                        ]
                    ),
                ],
                className="mb-4 shadow-sm",
            )
        ],
        style={"display": "none"},
    )


def create_anomaly_section():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.H5("异常清单", className="mb-0"),
                    dbc.Badge(
                        id="anomaly-count",
                        color="danger",
                        className="ms-3",
                    ),
                ],
                className="bg-white d-flex align-items-center",
            ),
            dbc.CardBody(
                [
                    html.Div(
                        id="anomaly-table-container",
                        style={"maxHeight": "300px", "overflowY": "auto"},
                    ),
                ]
            ),
        ],
        className="mb-4 shadow-sm",
    )


def create_checkin_efficiency_section():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.H5("核销效率", className="mb-0"),
                    html.Small("按小时统计核销人数", className="text-muted ms-3"),
                ],
                className="bg-white d-flex align-items-center",
            ),
            dbc.CardBody(
                [
                    dcc.Graph(id="checkin-efficiency-chart", style={"height": "300px"}),
                ]
            ),
        ],
        className="mb-4 shadow-sm",
    )


def create_ticket_type_section():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.H5("票种分析", className="mb-0"),
                ],
                className="bg-white",
            ),
            dbc.CardBody(
                [
                    dcc.Graph(id="ticket-type-chart", style={"height": "350px"}),
                ]
            ),
        ],
        className="shadow-sm",
    )


def create_remark_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("备注信息")),
            dbc.ModalBody(
                [
                    html.Div(
                        id="remark-list",
                        className="mb-3",
                        style={"maxHeight": "300px", "overflowY": "auto"},
                    ),
                    html.Hr(),
                    dbc.Textarea(
                        id="remark-input",
                        placeholder="输入备注内容...",
                        rows=3,
                    ),
                    dbc.Input(
                        id="remark-author",
                        placeholder="你的名字",
                        className="mt-2",
                    ),
                ]
            ),
            dbc.ModalFooter(
                [
                    dbc.Button("添加备注", id="add-remark-btn", color="primary"),
                    dbc.Button("关闭", id="close-remark-modal", color="secondary", outline=True),
                ]
            ),
        ],
        id="remark-modal",
        is_open=False,
        size="lg",
    )


def create_export_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("导出报表")),
            dbc.ModalBody(
                [
                    html.P("导出核销效率报表，包含当前筛选口径和生成时间。", className="text-muted"),
                    dbc.Form(
                        [
                            dbc.Label("导出格式"),
                            dcc.Dropdown(
                                id="export-format",
                                options=[
                                    {"label": "Excel (.xlsx)", "value": "xlsx"},
                                    {"label": "CSV (.csv)", "value": "csv"},
                                ],
                                value="xlsx",
                                clearable=False,
                                className="mb-3",
                            ),
                            dbc.Label("导出内容"),
                            dbc.Checklist(
                                id="export-content",
                                options=[
                                    {"label": "核销效率数据", "value": "efficiency"},
                                    {"label": "漏斗转化数据", "value": "funnel"},
                                    {"label": "赞助清单", "value": "sponsors"},
                                    {"label": "异常清单", "value": "anomalies"},
                                    {"label": "票种分析", "value": "ticket_types"},
                                ],
                                value=["efficiency", "funnel"],
                                className="mb-3",
                            ),
                            html.Div(
                                id="export-filters-info",
                                className="bg-light p-3 rounded mb-3",
                            ),
                        ]
                    ),
                ]
            ),
            dbc.ModalFooter(
                [
                    dbc.Button("确认导出", id="confirm-export-btn", color="primary"),
                    dbc.Button("取消", id="close-export-modal", color="secondary", outline=True),
                ]
            ),
        ],
        id="export-modal",
        is_open=False,
    )


def create_layout():
    return html.Div(
        [
            create_sidebar(),
            html.Div(
                [
                    create_header(),
                    create_kpi_cards(),
                    dbc.Row(
                        [
                            dbc.Col(create_funnel_chart_section(), width=7),
                            dbc.Col(create_checkin_efficiency_section(), width=5),
                        ]
                    ),
                    create_sponsor_section(),
                    create_drilldown_section(),
                    dbc.Row(
                        [
                            dbc.Col(create_ticket_type_section(), width=6),
                            dbc.Col(create_anomaly_section(), width=6),
                        ]
                    ),
                    create_remark_modal(),
                    create_export_modal(),
                    dcc.Download(id="download-excel"),
                    dcc.Store(id="selected-sponsor-id"),
                    dcc.Store(id="current-filters"),
                ],
                style=CONTENT_STYLE,
            ),
        ]
    )
