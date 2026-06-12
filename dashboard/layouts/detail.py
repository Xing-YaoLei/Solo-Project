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
                dash_table.DataTable(id="detail-inventory-table"),
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
