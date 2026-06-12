from dash import html, dcc, dash_table, Input, Output, State
import dash_bootstrap_components as dbc


def create_detail_layout():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Label("门店"),
                dbc.Select(id="detail-store-filter", placeholder="选择门店"),
            ], width=6),
            dbc.Col([
                dbc.Label("数据标签"),
                dbc.Select(
                    id="detail-tab-selector",
                    options=[
                        {"label": "库存台账", "value": "tab-inventory"},
                        {"label": "批次效期", "value": "tab-batch"},
                        {"label": "供应商信息", "value": "tab-supplier"},
                        {"label": "复盘材料", "value": "tab-review"},
                    ],
                    value="tab-inventory",
                ),
            ], width=6),
        ], className="mb-4"),

        dbc.Tabs([
            dbc.Tab([
                dbc.Row([
                    dbc.Col(dbc.Card([
                        dbc.CardBody([
                            html.H5(id="kpi-inbound-count", className="text-success"),
                            html.P("入库笔数", className="text-muted mb-0"),
                        ])
                    ]), width=3),
                    dbc.Col(dbc.Card([
                        dbc.CardBody([
                            html.H5(id="kpi-outbound-count", className="text-danger"),
                            html.P("出库笔数", className="text-muted mb-0"),
                        ])
                    ]), width=3),
                    dbc.Col(dbc.Card([
                        dbc.CardBody([
                            html.H5(id="kpi-consume-count", className="text-warning"),
                            html.P("消耗笔数", className="text-muted mb-0"),
                        ])
                    ]), width=3),
                    dbc.Col(dbc.Card([
                        dbc.CardBody([
                            html.H5(id="kpi-adjust-count", className="text-primary"),
                            html.P("调整笔数", className="text-muted mb-0"),
                        ])
                    ]), width=3),
                ], className="mb-3"),
                dbc.Row([
                    dbc.Col([
                        dbc.Label("类型筛选"),
                        dbc.Select(
                            id="detail-ledger-type-filter",
                            options=[
                                {"label": "全部", "value": "all"},
                                {"label": "入库", "value": "入库"},
                                {"label": "出库", "value": "出库"},
                                {"label": "消耗", "value": "消耗"},
                                {"label": "调整", "value": "调整"},
                            ],
                            value="all",
                        ),
                    ], width=4),
                ], className="mb-2"),
                dash_table.DataTable(
                    id="detail-inventory-table",
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "left", "padding": "8px"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    page_size=15,
                    sort_action="native",
                    filter_action="native",
                ),
            ], label="库存台账"),
            dbc.Tab([
                dash_table.DataTable(id="detail-batch-table"),
            ], label="批次效期"),
            dbc.Tab([
                dash_table.DataTable(id="detail-supplier-table"),
            ], label="供应商信息"),
            dbc.Tab([
                dbc.Card([
                    dbc.CardBody([
                        dash_table.DataTable(id="detail-review-table"),
                        html.Div([
                            dbc.Row([
                                dbc.Col([
                                    html.Div(id="review-root-cause"),
                                ], width=6),
                                dbc.Col([
                                    html.Div(id="review-action-plan"),
                                ], width=6),
                            ], className="mt-3"),
                        ]),
                    ]),
                ]),
            ], label="复盘材料"),
        ]),

        dcc.Store(id="detail-store"),
    ])
