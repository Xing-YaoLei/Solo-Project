import dash_bootstrap_components as dbc
from dash import html, dcc


def make_filter_bar(regions):
    return dbc.Card(
        dbc.CardBody(
            [
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.Label("开始日期"),
                                dcc.DatePickerSingle(
                                    id="filter-start-date",
                                    date=None,
                                    display_format="YYYY-MM-DD",
                                    placeholder="开始日期",
                                    style={"width": "100%"},
                                ),
                            ],
                            width=2,
                        ),
                        dbc.Col(
                            [
                                html.Label("结束日期"),
                                dcc.DatePickerSingle(
                                    id="filter-end-date",
                                    date=None,
                                    display_format="YYYY-MM-DD",
                                    placeholder="结束日期",
                                    style={"width": "100%"},
                                ),
                            ],
                            width=2,
                        ),
                        dbc.Col(
                            [
                                html.Label("区域"),
                                dcc.Dropdown(
                                    id="filter-region",
                                    options=[{"label": "全部", "value": ""}] + regions,
                                    value="",
                                    placeholder="选择区域",
                                    clearable=True,
                                ),
                            ],
                            width=2,
                        ),
                        dbc.Col(
                            [
                                html.Label("履约准时率"),
                                dcc.Dropdown(
                                    id="filter-fulfillment",
                                    options=[
                                        {"label": "全部", "value": "all"},
                                        {"label": "≥90%", "value": "0.9"},
                                        {"label": "≥80%", "value": "0.8"},
                                        {"label": "<80%", "value": "below0.8"},
                                    ],
                                    value="all",
                                    clearable=False,
                                ),
                            ],
                            width=2,
                        ),
                        dbc.Col(
                            [
                                html.Label("商品标签"),
                                dcc.Dropdown(
                                    id="filter-tag",
                                    options=[
                                        {"label": "全部", "value": ""},
                                        {"label": "品类", "value": "品类"},
                                        {"label": "季节", "value": "季节"},
                                        {"label": "促销", "value": "促销"},
                                        {"label": "供应商等级", "value": "供应商等级"},
                                    ],
                                    value="",
                                    clearable=True,
                                ),
                            ],
                            width=2,
                        ),
                        dbc.Col(
                            [
                                html.Label("操作"),
                                dbc.Button("查询", id="btn-query", color="primary", className="mt-3"),
                            ],
                            width=2,
                        ),
                    ],
                    align="end",
                )
            ]
        ),
        className="mb-3",
    )


def make_funnel_chart():
    return dbc.Card(
        dbc.CardBody(
            [
                html.H5("预售团单漏斗", className="card-title"),
                dcc.Loading(dcc.Graph(id="funnel-chart", config={"displayModeBar": True})),
            ]
        ),
        className="mb-3",
    )


def make_fulfillment_comparison():
    return dbc.Card(
        dbc.CardBody(
            [
                html.H5("履约准时率对比", className="card-title"),
                dcc.Tabs(
                    id="fulfillment-tab",
                    value="by-date",
                    children=[
                        dcc.Tab(label="按日期", value="by-date"),
                        dcc.Tab(label="按区域", value="by-region"),
                    ],
                ),
                dcc.Loading(dcc.Graph(id="fulfillment-chart")),
            ]
        ),
        className="mb-3",
    )


def make_comparison_chart():
    return dbc.Card(
        dbc.CardBody(
            [
                html.H5("结算单同环比", className="card-title"),
                dcc.Tabs(
                    id="comparison-tab",
                    value="settlement",
                    children=[
                        dcc.Tab(label="结算单同环比", value="settlement"),
                        dcc.Tab(label="商品标签同环比", value="tag"),
                    ],
                ),
                dcc.Loading(dcc.Graph(id="comparison-chart")),
            ]
        ),
        className="mb-3",
    )


def make_shortage_section():
    return dbc.Card(
        dbc.CardBody(
            [
                html.H5("到货短少追踪", className="card-title"),
                dcc.Loading(dcc.Graph(id="shortage-chart")),
                html.Hr(),
                html.H6("短少样本记录（点击图表柱体可追踪）", className="mt-3"),
                html.Div(id="shortage-sample-table"),
            ]
        ),
        className="mb-3",
    )


def make_batch_detail_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("团购批次明细")),
            dbc.ModalBody(
                [
                    html.Div(id="batch-detail-info"),
                    html.Hr(),
                    html.H6("到货清单（口径说明）"),
                    html.Div(id="batch-arrival-table"),
                ]
            ),
            dbc.ModalFooter(dbc.Button("关闭", id="btn-close-batch-modal", className="ms-auto")),
        ],
        id="batch-detail-modal",
        size="xl",
        is_open=False,
    )


def make_shortage_detail_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("短少样本记录")),
            dbc.ModalBody(html.Div(id="shortage-detail-content")),
            dbc.ModalFooter(
                dbc.Button("关闭", id="btn-close-shortage-modal", className="ms-auto")
            ),
        ],
        id="shortage-detail-modal",
        size="xl",
        is_open=False,
    )


def make_sync_batch_panel():
    return dbc.Card(
        dbc.CardBody(
            [
                html.H5("同步批次回看", className="card-title"),
                html.Div(id="sync-batch-table"),
            ]
        ),
        className="mb-3",
    )
