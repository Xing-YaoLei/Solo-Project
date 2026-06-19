import dash_bootstrap_components as dbc
from dash import html, dcc
import dash_table


def create_work_order_detail_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Button([
                    html.I(className="fas fa-arrow-left me-2"),
                    "返回仪表盘"
                ], id="btn-back-to-dashboard", color="secondary", size="sm", className="mb-3")
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-info-circle me-2"),
                        html.Strong("工单基本信息", id="detail-order-title")
                    ]),
                    dbc.CardBody([
                        dbc.Row(id="detail-order-info", className="gy-3"),
                    ])
                ], className="mb-4")
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-list-ul me-2"),
                        html.Strong("工单项目明细")
                    ]),
                    dbc.CardBody([
                        dash_table.DataTable(
                            id="detail-items-table",
                            columns=[
                                {"name": "项目类型", "id": "item_type"},
                                {"name": "项目编码", "id": "item_code"},
                                {"name": "项目名称", "id": "item_name"},
                                {"name": "数量", "id": "quantity"},
                                {"name": "单价", "id": "unit_price"},
                                {"name": "金额", "id": "amount"},
                                {"name": "技师", "id": "technician"},
                                {"name": "状态", "id": "status"},
                            ],
                            style_table={"overflowX": "auto"},
                            style_header={
                                "backgroundColor": "rgb(230, 230, 230)",
                                "fontWeight": "bold"
                            },
                            style_data_conditional=[
                                {
                                    "if": {"filter_query": "{status} = 'shortage'"},
                                    "backgroundColor": "#fff3cd",
                                    "color": "#856404",
                                },
                                {
                                    "if": {"filter_query": "{item_type} = 'part'"},
                                    "backgroundColor": "#e7f5ff",
                                },
                            ],
                        )
                    ])
                ], className="mb-4")
            ], md=8),

            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className="fas fa-comment-dots me-2"),
                        html.Strong("备注")
                    ]),
                    dbc.CardBody([
                        dbc.InputGroup([
                            dbc.Input(id="remark-input", placeholder="输入备注内容...", type="text"),
                            dbc.Button([
                                html.I(className="fas fa-paper-plane me-1"),
                                "发送"
                            ], id="btn-send-remark", color="primary"),
                        ], className="mb-3"),
                        html.Div(id="remarks-list", className="overflow-auto", style={"maxHeight": "400px"})
                    ])
                ], className="mb-4")
            ], md=4),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Tabs([
                    dbc.Tab(label="配件库存", tab_id="tab-parts-stock", tabClassName="flex-grow-1 text-center"),
                    dbc.Tab(label="报价单", tab_id="tab-quotes", tabClassName="flex-grow-1 text-center"),
                    dbc.Tab(label="原始样本", tab_id="tab-original", tabClassName="flex-grow-1 text-center"),
                ], id="detail-tabs", active_tab="tab-parts-stock"),
                html.Div(id="detail-tabs-content", className="mt-3"),
            ], md=12),
        ]),

        dcc.Store(id="current-order-id", data=None),
    ], fluid=True, className="px-4")
