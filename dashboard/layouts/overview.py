from dash import html, dcc, dash_table, Input, Output, State
import dash_bootstrap_components as dbc


def create_overview_layout():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("-", className="card-value"),
                        html.P("库存物料总数"),
                    ])
                ], id="kpi-material-count"),
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("-", className="card-value"),
                        html.P("低库存预警数"),
                    ])
                ], id="kpi-alert-count"),
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("-", className="card-value"),
                        html.P("待处理复盘"),
                    ])
                ], id="kpi-review-count"),
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("-", className="card-value"),
                        html.P("平均周转天数"),
                    ])
                ], id="kpi-avg-turnover"),
            ], width=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="overview-inventory-chart"),
            ], width=6),
            dbc.Col([
                dcc.Graph(id="overview-batch-chart"),
            ], width=6),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="overview-supplier-chart"),
            ], width=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("预警阈值管理"),
                    dbc.CardBody([
                        dash_table.DataTable(id="threshold-table"),
                        html.Div([
                            dbc.ButtonGroup([
                                dbc.Button("新增阈值", id="btn-add-threshold", color="primary"),
                                dbc.Button("刷新", id="btn-refresh-threshold", color="secondary"),
                            ], className="mt-3"),
                        ]),
                    ]),
                ]),
            ], width=12),
        ], className="mb-4"),

        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("新增/编辑阈值")),
            dbc.ModalBody([
                dbc.Row([
                    dbc.Col([
                        dbc.Label("物料编码"),
                        dbc.Input(id="threshold-material-code", type="text", placeholder="物料编码"),
                    ], width=6),
                    dbc.Col([
                        dbc.Label("门店编码"),
                        dbc.Input(id="threshold-store-code", type="text", placeholder="门店编码"),
                    ], width=6),
                ], className="mb-3"),
                dbc.Row([
                    dbc.Col([
                        dbc.Label("阈值类型"),
                        dbc.Select(
                            id="threshold-type",
                            options=[
                                {"label": "周转天数", "value": "turnover"},
                                {"label": "效期预警", "value": "expiry"},
                                {"label": "缺货预警", "value": "stockout"},
                            ],
                        ),
                    ], width=6),
                    dbc.Col([
                        dbc.Label("阈值"),
                        dbc.Input(id="threshold-value", type="number", placeholder="阈值"),
                    ], width=6),
                ]),
            ]),
            dbc.ModalFooter([
                dbc.Button("保存", id="modal-threshold-save", color="primary", className="ms-auto"),
                dbc.Button("取消", id="modal-threshold-close", color="secondary"),
            ]),
        ], id="threshold-modal", is_open=False),

        dcc.Store(id="overview-store"),
    ])
