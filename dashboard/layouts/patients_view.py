import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table


class PatientsView:
    @property
    def layout(self):
        return dbc.Container(
            [
                html.H3(
                    [html.I(className="fas fa-user-friends me-2 text-info"), "患者档案视图"],
                    className="mb-4 text-white",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-search me-2"),
                                            "患者搜索",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    [
                                                        html.Label("患者ID/姓名", className="text-light small mb-1"),
                                                        dbc.Input(
                                                            id="patient-search-input",
                                                            type="text",
                                                            placeholder="请输入患者ID或姓名搜索",
                                                            className="bg-dark text-light",
                                                        ),
                                                    ],
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("年龄段", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="patient-age-filter",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "0-17岁", "value": "0-17"},
                                                                {"label": "18-29岁", "value": "18-29"},
                                                                {"label": "30-44岁", "value": "30-44"},
                                                                {"label": "45-59岁", "value": "45-59"},
                                                                {"label": "60岁以上", "value": "60+"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("就诊次数", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="patient-visit-filter",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "初诊", "value": "1"},
                                                                {"label": "复诊(2-3次)", "value": "2-3"},
                                                                {"label": "高频(4次以上)", "value": "4+"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
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
                                            html.I(className="fas fa-chart-bar me-2"),
                                            "患者画像统计",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="patient-gender-chart",
                                                        style={"height": "250px"},
                                                        config={"displayModeBar": False},
                                                    ),
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="patient-age-chart",
                                                        style={"height": "250px"},
                                                        config={"displayModeBar": False},
                                                    ),
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    dcc.Graph(
                                                        id="patient-visit-chart",
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
                            self._build_patient_kpis(),
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
                                            "患者档案列表",
                                            dbc.Badge(
                                                id="patients-count-badge",
                                                color="info",
                                                className="ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dash_table.DataTable(
                                            id="patients-table",
                                            columns=[
                                                {
                                                    "name": "患者ID",
                                                    "id": "patient_id",
                                                },
                                                {
                                                    "name": "姓名",
                                                    "id": "name",
                                                },
                                                {
                                                    "name": "性别",
                                                    "id": "gender",
                                                },
                                                {
                                                    "name": "年龄",
                                                    "id": "age",
                                                    "type": "numeric",
                                                },
                                                {
                                                    "name": "手机号",
                                                    "id": "phone",
                                                },
                                                {
                                                    "name": "初诊日期",
                                                    "id": "first_visit_date",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "最近就诊",
                                                    "id": "last_visit_date",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "就诊次数",
                                                    "id": "total_visits",
                                                    "type": "numeric",
                                                },
                                                {
                                                    "name": "累计消费",
                                                    "id": "total_spent",
                                                    "type": "numeric",
                                                    "format": {"specifier": ",.2f"},
                                                },
                                                {
                                                    "name": "复诊率",
                                                    "id": "revisit_rate",
                                                    "type": "numeric",
                                                    "format": {"specifier": ".1f"},
                                                },
                                                {
                                                    "name": "状态",
                                                    "id": "is_active",
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
                                            page_size=15,
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
                                            html.I(className="fas fa-history me-2"),
                                            "患者就诊历史",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        html.Div(id="patient-history-detail"),
                                    ),
                                ],
                                className="bg-secondary border-0",
                                id="patient-history-card",
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

    def _build_patient_kpis(self):
        return dbc.Card(
            dbc.CardBody(
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.H6("患者总数", className="text-muted small"),
                                html.H4(
                                    id="kpi-patient-total",
                                    className="fw-bold text-info",
                                    children="0",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("新患者", className="text-muted small"),
                                html.H4(
                                    id="kpi-patient-new",
                                    className="fw-bold text-success",
                                    children="0",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("复诊患者", className="text-muted small"),
                                html.H4(
                                    id="kpi-patient-return",
                                    className="fw-bold text-primary",
                                    children="0",
                                ),
                            ],
                            md=3,
                        ),
                        dbc.Col(
                            [
                                html.H6("平均就诊次数", className="text-muted small"),
                                html.H4(
                                    id="kpi-patient-avg-visits",
                                    className="fw-bold text-warning",
                                    children="0",
                                ),
                            ],
                            md=3,
                        ),
                    ]
                )
            ),
            className="bg-secondary border-0",
        )
