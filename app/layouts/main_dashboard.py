import dash_bootstrap_components as dbc
from dash import html, dcc, dash_table
from datetime import datetime, timedelta


def create_main_layout():
    today = datetime.now().date()
    start_date = today - timedelta(days=30)

    return dbc.Container([
        html.Div([
            html.H3([
                html.I(className="fas fa-chart-line me-2"),
                "汽车维修预约进厂风险监测图"
            ], className="mb-0"),
            html.Small("日常复盘 · 数据同步 · 异常追踪", className="text-muted")
        ], className="py-3 border-bottom mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.I(className="fas fa-calendar-check fa-2x text-primary"),
                            html.Div([
                                html.H5("今日预约", id="kpi-today-appointments", className="mb-0"),
                                html.Small("到店率 --", id="kpi-arrival-rate", className="text-muted")
                            ], className="ms-3")
                        ], className="d-flex align-items-center")
                    ])
                ], className="h-100")
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.I(className="fas fa-exclamation-triangle fa-2x text-warning"),
                            html.Div([
                                html.H5("待处理工单", id="kpi-pending-orders", className="mb-0"),
                                html.Small("缺货工单 --", id="kpi-shortage-orders", className="text-muted")
                            ], className="ms-3")
                        ], className="d-flex align-items-center")
                    ])
                ], className="h-100")
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.I(className="fas fa-redo fa-2x text-danger"),
                            html.Div([
                                html.H5("返修率", id="kpi-rework-rate", className="mb-0"),
                                html.Small("高风险 --", id="kpi-high-risk-count", className="text-muted")
                            ], className="ms-3")
                        ], className="d-flex align-items-center")
                    ])
                ], className="h-100")
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.I(className="fas fa-bell fa-2x text-info"),
                            html.Div([
                                html.H5("待处理异常", id="kpi-open-anomalies", className="mb-0"),
                                html.Small("严重 --", id="kpi-critical-anomalies", className="text-muted")
                            ], className="ms-3")
                        ], className="d-flex align-items-center")
                    ])
                ], className="h-100")
            ], md=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-filter me-2"),
                        "筛选条件"
                    ]),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                html.Label("日期范围", className="form-label fw-bold"),
                                dcc.DatePickerRange(
                                    id="date-picker-range",
                                    start_date=start_date,
                                    end_date=today,
                                    display_format="YYYY-MM-DD",
                                    className="w-100"
                                )
                            ], md=4),
                            dbc.Col([
                                html.Label("风险等级", className="form-label fw-bold"),
                                dcc.Dropdown(
                                    id="risk-level-filter",
                                    options=[
                                        {"label": "全部", "value": "all"},
                                        {"label": "高风险", "value": "high"},
                                        {"label": "中风险", "value": "medium"},
                                        {"label": "低风险", "value": "low"},
                                    ],
                                    value="all",
                                    clearable=False
                                )
                            ], md=2),
                            dbc.Col([
                                html.Label("工单状态", className="form-label fw-bold"),
                                dcc.Dropdown(
                                    id="order-status-filter",
                                    options=[
                                        {"label": "全部", "value": "all"},
                                        {"label": "待处理", "value": "pending"},
                                        {"label": "进行中", "value": "in_progress"},
                                        {"label": "配件待料", "value": "parts_pending"},
                                        {"label": "已完成", "value": "completed"},
                                    ],
                                    value="all",
                                    clearable=False
                                )
                            ], md=2),
                            dbc.Col([
                                html.Label("维修类型", className="form-label fw-bold"),
                                dcc.Dropdown(
                                    id="repair-type-filter",
                                    options=[{"label": "全部", "value": "all"}],
                                    value="all",
                                    clearable=False
                                )
                            ], md=2),
                            dbc.Col([
                                html.Label("仅显示缺货", className="form-label fw-bold"),
                                dbc.Switch(
                                    id="shortage-only-switch",
                                    label=False,
                                    value=False,
                                    className="mt-2"
                                )
                            ], md=2),
                        ])
                    ])
                ], className="mb-4")
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-chart-area me-2"),
                        "预约进厂趋势"
                    ]),
                    dbc.CardBody([
                        dcc.Graph(id="appointment-trend-chart", style={"height": "300px"})
                    ])
                ])
            ], md=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-chart-pie me-2"),
                        "风险等级分布"
                    ]),
                    dbc.CardBody([
                        dcc.Graph(id="risk-distribution-chart", style={"height": "300px"})
                    ])
                ])
            ], md=4),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-chart-bar me-2"),
                        "返修率趋势"
                    ]),
                    dbc.CardBody([
                        dcc.Graph(id="rework-rate-chart", style={"height": "280px"})
                    ])
                ])
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-tools me-2"),
                        "维修类型分布"
                    ]),
                    dbc.CardBody([
                        dcc.Graph(id="repair-type-chart", style={"height": "280px"})
                    ])
                ])
            ], md=6),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        dbc.Row([
                            dbc.Col([
                                html.I(className="fas fa-clipboard-list me-2"),
                                html.Strong("维修工单列表")
                            ]),
                            dbc.Col([
                                dbc.ButtonGroup([
                                    dbc.Button([
                                        html.I(className="fas fa-file-export me-1"),
                                        "导出返修率"
                                    ], id="btn-export-rework", color="primary", size="sm"),
                                    dbc.Button([
                                        html.I(className="fas fa-sync me-1"),
                                        "刷新数据"
                                    ], id="btn-refresh", color="secondary", size="sm"),
                                ], className="float-end")
                            ], className="text-end")
                        ])
                    ]),
                    dbc.CardBody([
                        dbc.Spinner(
                            dash_table.DataTable(
                                id="work-orders-table",
                                columns=[
                                    {"name": "工单号", "id": "order_no"},
                                    {"name": "车牌号", "id": "license_plate"},
                                    {"name": "车型", "id": "vehicle_model"},
                                    {"name": "客户", "id": "customer_name"},
                                    {"name": "维修类型", "id": "repair_type"},
                                    {"name": "状态", "id": "status"},
                                    {"name": "技师", "id": "technician"},
                                    {"name": "金额", "id": "total_amount"},
                                    {"name": "是否返修", "id": "is_rework"},
                                    {"name": "配件缺货", "id": "has_parts_shortage"},
                                ],
                                page_size=10,
                                sort_action="native",
                                filter_action="native",
                                style_table={"overflowX": "auto"},
                                style_header={
                                    "backgroundColor": "rgb(230, 230, 230)",
                                    "fontWeight": "bold"
                                },
                                style_data_conditional=[
                                    {
                                        "if": {"filter_query": "{has_parts_shortage} = True"},
                                        "backgroundColor": "#fff3cd",
                                    },
                                    {
                                        "if": {"filter_query": "{is_rework} = True"},
                                        "color": "#dc3545",
                                        "fontWeight": "bold",
                                    },
                                    {
                                        "if": {"filter_query": "{status} = 'parts_pending'"},
                                        "backgroundColor": "#f8d7da",
                                    },
                                ],
                                row_selectable="single",
                                selected_rows=[],
                            ),
                            size="sm"
                        )
                    ])
                ], className="mb-4")
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-exclamation-circle me-2 text-danger"),
                        html.Strong("异常清单")
                    ]),
                    dbc.CardBody([
                        dbc.Tabs([
                            dbc.Tab(label="全部异常", tab_id="all-anomalies"),
                            dbc.Tab(label="配件缺货", tab_id="parts-shortage"),
                            dbc.Tab(label="高返修工单", tab_id="review-flag"),
                            dbc.Tab(label="保险问题", tab_id="insurance-issue"),
                            dbc.Tab(label="数据错误", tab_id="data-error"),
                        ], id="anomaly-tabs", active_tab="all-anomalies"),
                        html.Div(id="anomalies-table-container", className="mt-3")
                    ])
                ])
            ], md=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-history me-2"),
                        html.Strong("同步任务状态")
                    ]),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                html.Div([
                                    html.Strong("配件系统同步"),
                                    html.Br(),
                                    html.Small(id="sync-parts-status", className="text-muted")
                                ])
                            ], md=3),
                            dbc.Col([
                                html.Div([
                                    html.Strong("维修工单同步"),
                                    html.Br(),
                                    html.Small(id="sync-orders-status", className="text-muted")
                                ])
                            ], md=3),
                            dbc.Col([
                                html.Div([
                                    html.Strong("保险材料同步"),
                                    html.Br(),
                                    html.Small(id="sync-insurance-status", className="text-muted")
                                ])
                            ], md=3),
                            dbc.Col([
                                html.Div([
                                    html.Strong("异常检测"),
                                    html.Br(),
                                    html.Small(id="sync-anomaly-status", className="text-muted")
                                ])
                            ], md=3),
                        ])
                    ])
                ])
            ], md=12),
        ]),

        dcc.Store(id="current-filter-state", data={}),
        dcc.Store(id="selected-work-order-id", data=None),
        dcc.Store(id="current-page", data="dashboard"),
        dcc.Interval(id="refresh-interval", interval=300 * 1000, n_intervals=0),
        dcc.Download(id="download-rework-report"),

        html.Footer([
            html.Hr(),
            html.Small("汽车维修预约进厂风险监测系统 · 数据每5分钟自动刷新", className="text-muted")
        ], className="mt-4 text-center"),
    ], fluid=True, className="px-4")
