import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table, Input, Output, State, callback, ctx


class PaymentsView:
    @property
    def layout(self):
        return dbc.Container(
            [
                html.H3(
                    [html.I(className="fas fa-receipt me-2 text-info"), "收费明细视图"],
                    className="mb-4 text-white",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-chart-line me-2"),
                                            "收费趋势",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="payments-trend-chart",
                                            style={"height": "300px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 h-100",
                            ),
                            lg=6,
                            className="mb-4",
                        ),
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-chart-pie me-2"),
                                            "收费项目分布",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="payments-item-chart",
                                            style={"height": "300px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 h-100",
                            ),
                            lg=6,
                            className="mb-4",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            self._build_summary_kpi(),
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
                                            html.I(className="fas fa-list me-2"),
                                            "收费明细",
                                            dbc.Badge(
                                                id="payments-count-badge",
                                                color="info",
                                                className="ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        [
                                            dash_table.DataTable(
                                                id="payments-table",
                                                columns=[
                                                    {
                                                        "name": "收费单号",
                                                        "id": "payment_no",
                                                    },
                                                    {
                                                        "name": "关联预约",
                                                        "id": "appointment_no",
                                                    },
                                                    {
                                                        "name": "患者ID",
                                                        "id": "patient_id",
                                                    },
                                                    {
                                                        "name": "收费日期",
                                                        "id": "payment_date",
                                                        "type": "datetime",
                                                    },
                                                    {
                                                        "name": "项目名称",
                                                        "id": "item_name",
                                                    },
                                                    {
                                                        "name": "项目类型",
                                                        "id": "item_type",
                                                    },
                                                    {
                                                        "name": "数量",
                                                        "id": "quantity",
                                                        "type": "numeric",
                                                    },
                                                    {
                                                        "name": "单价",
                                                        "id": "unit_price",
                                                        "type": "numeric",
                                                        "format": {"specifier": ",.2f"},
                                                    },
                                                    {
                                                        "name": "原价",
                                                        "id": "total_amount",
                                                        "type": "numeric",
                                                        "format": {"specifier": ",.2f"},
                                                    },
                                                    {
                                                        "name": "折扣",
                                                        "id": "discount_amount",
                                                        "type": "numeric",
                                                        "format": {"specifier": ",.2f"},
                                                    },
                                                    {
                                                        "name": "实付",
                                                        "id": "actual_amount",
                                                        "type": "numeric",
                                                        "format": {"specifier": ",.2f"},
                                                    },
                                                    {
                                                        "name": "支付方式",
                                                        "id": "payment_method",
                                                    },
                                                    {
                                                        "name": "发票号",
                                                        "id": "invoice_no",
                                                    },
                                                    {
                                                        "name": "异常标记",
                                                        "id": "has_anomaly",
                                                    },
                                                    {
                                                        "name": "操作",
                                                        "id": "actions",
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
                                                },
                                                style_data_conditional=[
                                                    {
                                                        "if": {"filter_query": "{has_anomaly} = '有异常'"},
                                                        "backgroundColor": "#7f1d1d",
                                                        "color": "#fee2e2",
                                                    },
                                                ],
                                                page_size=15,
                                                sort_action="native",
                                                sort_mode="multi",
                                                filter_action="native",
                                                row_selectable="single",
                                                selected_rows=[],
                                                editable=False,
                                            ),
                                            html.Hr(className="my-4"),
                                            html.Div(
                                                [
                                                    html.H5(
                                                        [
                                                            html.I(className="fas fa-sticky-note me-2"),
                                                            "添加备注",
                                                        ],
                                                        className="text-white mb-3",
                                                    ),
                                                    dbc.Row(
                                                        [
                                                            dbc.Col(
                                                                dbc.Input(
                                                                    id="remark-author",
                                                                    type="text",
                                                                    placeholder="请输入您的姓名",
                                                                    className="bg-dark text-light",
                                                                ),
                                                                md=3,
                                                            ),
                                                            dbc.Col(
                                                                dbc.Textarea(
                                                                    id="remark-content",
                                                                    placeholder="请输入备注内容，记录您的判断...",
                                                                    className="bg-dark text-light",
                                                                    rows=2,
                                                                ),
                                                                md=7,
                                                            ),
                                                            dbc.Col(
                                                                dbc.Button(
                                                                    [
                                                                        html.I(className="fas fa-plus me-2"),
                                                                        "保存备注",
                                                                    ],
                                                                    id="btn-save-remark",
                                                                    color="primary",
                                                                    className="w-100 h-100",
                                                                ),
                                                                md=2,
                                                            ),
                                                        ]
                                                    ),
                                                    html.Div(id="remark-save-status", className="mt-2"),
                                                ],
                                                id="remark-section",
                                                style={"display": "none"},
                                            ),
                                            html.Hr(className="my-4"),
                                            html.Div(
                                                [
                                                    html.H5(
                                                        [
                                                            html.I(className="fas fa-history me-2"),
                                                            "历史备注",
                                                        ],
                                                        className="text-white mb-3",
                                                    ),
                                                    html.Div(id="payment-remarks-history"),
                                                ],
                                                id="remarks-history-section",
                                                style={"display": "none"},
                                            ),
                                        ]
                                    ),
                                ],
                                className="bg-secondary border-0",
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
            ],
            fluid=True,
        )

    def _build_summary_kpi(self):
        return dbc.Card(
            dbc.CardBody(
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.H6("总收费金额", className="text-muted small"),
                                html.H4(
                                    [
                                        "¥",
                                        html.Span(id="kpi-payment-total", children="0"),
                                    ],
                                    className="fw-bold text-success",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("收费笔数", className="text-muted small"),
                                html.H4(
                                    id="kpi-payment-count",
                                    className="fw-bold text-info",
                                    children="0",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("平均客单价", className="text-muted small"),
                                html.H4(
                                    [
                                        "¥",
                                        html.Span(id="kpi-payment-avg", children="0"),
                                    ],
                                    className="fw-bold text-primary",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("折扣总额", className="text-muted small"),
                                html.H4(
                                    [
                                        "¥",
                                        html.Span(id="kpi-discount-total", children="0"),
                                    ],
                                    className="fw-bold text-warning",
                                ),
                            ],
                            md=3,
                        ),
                    ]
                )
            ),
            className="bg-secondary border-0",
        )
