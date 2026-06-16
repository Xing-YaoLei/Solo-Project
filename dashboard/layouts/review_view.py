import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table


class ReviewView:
    @property
    def layout(self):
        return dbc.Container(
            [
                html.H3(
                    [html.I(className="fas fa-search-plus me-2 text-info"), "数据复盘视图"],
                    className="mb-4 text-white",
                ),
                dbc.Alert(
                    [
                        html.I(className="fas fa-info-circle me-2"),
                        "复盘说明与异常点关联展示，所有备注和判断将保存在系统中供后续追溯。",
                    ],
                    color="info",
                    className="mb-4",
                    dismissable=True,
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-filter me-2"),
                                            "复盘筛选",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    [
                                                        html.Label("异常类型", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="review-anomaly-type",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "预约表延迟", "value": "预约表延迟"},
                                                                {"label": "收费记录缺失", "value": "收费记录缺失"},
                                                                {"label": "HIS口径变化", "value": "HIS口径变化"},
                                                                {"label": "数据不一致", "value": "数据不一致"},
                                                                {"label": "金额异常", "value": "金额异常"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=3,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("严重程度", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="review-severity",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "严重", "value": "error"},
                                                                {"label": "警告", "value": "warning"},
                                                                {"label": "信息", "value": "info"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=3,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("处理状态", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="review-status",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "待处理", "value": "unresolved"},
                                                                {"label": "已处理", "value": "resolved"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=3,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("是否有备注", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="review-has-remark",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "有备注", "value": "yes"},
                                                                {"label": "无备注", "value": "no"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=3,
                                                ),
                                            ]
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 mb-4",
                            ),
                            lg=12,
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-chart-pie me-2"),
                                            "复盘概览",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="review-status-chart",
                                                        style={"height": "250px"},
                                                        config={"displayModeBar": False},
                                                    ),
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="review-type-chart",
                                                        style={"height": "250px"},
                                                        config={"displayModeBar": False},
                                                    ),
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="review-trend-chart",
                                                        style={"height": "250px"},
                                                        config={"displayModeBar": False},
                                                    ),
                                                    md=4,
                                                ),
                                            ]
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 mb-4",
                            ),
                            lg=12,
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-list me-2"),
                                            "异常点复盘列表",
                                            dbc.Badge(
                                                id="review-count-badge",
                                                color="info",
                                                className="ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dash_table.DataTable(
                                            id="review-table",
                                            columns=[
                                                {
                                                    "name": "异常类型",
                                                    "id": "anomaly_type",
                                                },
                                                {
                                                    "name": "严重程度",
                                                    "id": "severity",
                                                },
                                                {
                                                    "name": "检测时间",
                                                    "id": "detected_at",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "描述",
                                                    "id": "description",
                                                },
                                                {
                                                    "name": "关联预约",
                                                    "id": "appointment_no",
                                                },
                                                {
                                                    "name": "状态",
                                                    "id": "is_resolved",
                                                },
                                                {
                                                    "name": "复盘备注",
                                                    "id": "remark_content",
                                                },
                                                {
                                                    "name": "备注作者",
                                                    "id": "remark_author",
                                                },
                                                {
                                                    "name": "备注时间",
                                                    "id": "remark_time",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "数据快照",
                                                    "id": "data_snapshot",
                                                    "presentation": "markdown",
                                                },
                                            ],
                                            style_table={"overflowX": "auto"},
                                            style_header={
                                                "backgroundColor": "#374151",
                                                "color": "white",
                                                "fontWeight": "bold",
                                                "fontSize": "12px",
                                            },
                                            style_cell={
                                                "backgroundColor": "#1f2937",
                                                "color": "#e5e7eb",
                                                "fontSize": "11px",
                                                "padding": "8px",
                                                "textAlign": "left",
                                                "whiteSpace": "normal",
                                                "height": "auto",
                                                "maxWidth": "300px",
                                            },
                                            style_data_conditional=[
                                                {
                                                    "if": {"filter_query": "{severity} = 'error'"},
                                                    "backgroundColor": "#7f1d1d",
                                                    "color": "#fee2e2",
                                                },
                                                {
                                                    "if": {"filter_query": "{severity} = 'warning'"},
                                                    "backgroundColor": "#78350f",
                                                    "color": "#fef3c7",
                                                },
                                                {
                                                    "if": {
                                                        "filter_query": '{remark_content} is blank or {remark_content} = ""'
                                                    },
                                                    "border": "1px solid #ef4444",
                                                },
                                            ],
                                            page_size=10,
                                            sort_action="native",
                                            sort_mode="multi",
                                            filter_action="native",
                                            row_selectable="single",
                                            selected_rows=[],
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0",
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-sticky-note me-2"),
                                            "异常点详情与复盘记录",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        [
                                            html.Div(id="review-detail-content"),
                                            html.Hr(className="my-4"),
                                            html.Div(
                                                [
                                                    html.H5(
                                                        [
                                                            html.I(className="fas fa-edit me-2"),
                                                            "添加复盘备注",
                                                        ],
                                                        className="text-white mb-3",
                                                    ),
                                                    dbc.Row(
                                                        [
                                                            dbc.Col(
                                                                dbc.Input(
                                                                    id="review-remark-author",
                                                                    type="text",
                                                                    placeholder="复盘人姓名",
                                                                    className="bg-dark text-light",
                                                                ),
                                                                md=3,
                                                            ),
                                                            dbc.Col(
                                                                dbc.Textarea(
                                                                    id="review-remark-content",
                                                                    placeholder="请输入复盘判断和说明...",
                                                                    className="bg-dark text-light",
                                                                    rows=3,
                                                                ),
                                                                md=7,
                                                            ),
                                                            dbc.Col(
                                                                dbc.Button(
                                                                    [
                                                                        html.I(className="fas fa-save me-2"),
                                                                        "保存复盘",
                                                                    ],
                                                                    id="btn-save-review",
                                                                    color="success",
                                                                    className="w-100 h-100",
                                                                ),
                                                                md=2,
                                                            ),
                                                        ]
                                                    ),
                                                    html.Div(id="review-save-status", className="mt-2"),
                                                ],
                                                id="review-remark-section",
                                                style={"display": "none"},
                                            ),
                                        ]
                                    ),
                                ],
                                className="bg-secondary border-0",
                                id="review-detail-card",
                                style={"display": "none"},
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-history me-2"),
                                            "历史复盘记录",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        html.Div(id="review-history-remarks"),
                                    ),
                                ],
                                className="bg-secondary border-0",
                                id="review-history-card",
                                style={"display": "none"},
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
            ],
            fluid=True,
        )
