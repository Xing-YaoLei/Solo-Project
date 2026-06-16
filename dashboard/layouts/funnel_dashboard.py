import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table


class FunnelDashboard:
    @property
    def layout(self):
        return dbc.Container(
            [
                html.H3(
                    [html.I(className="fas fa-chart-pie me-2 text-info"), "洁牙预约漏斗看板"],
                    className="mb-4 text-white",
                ),
                self._build_kpi_row(),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-filter me-2"),
                                            "预约转化漏斗",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="funnel-chart",
                                            style={"height": "400px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="h-100 bg-secondary border-0",
                            ),
                            lg=6,
                            className="mb-4",
                        ),
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-exclamation-triangle me-2 text-warning"),
                                            "异常检测概览",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="anomaly-summary-chart",
                                            style={"height": "400px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="h-100 bg-secondary border-0",
                            ),
                            lg=6,
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
                                            html.I(className="fas fa-chart-line me-2"),
                                            "预约趋势分析",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="trend-chart",
                                            style={"height": "400px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="h-100 bg-secondary border-0",
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
                                            html.I(className="fas fa-user-slash me-2 text-danger"),
                                            "爽约率走势分析",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        [
                                            dcc.Graph(
                                                id="no-show-trend-chart",
                                                style={"height": "350px"},
                                                config={"displayModeBar": False},
                                            ),
                                            html.Div(id="no-show-impact-periods", className="mt-3"),
                                        ]
                                    ),
                                ],
                                className="h-100 bg-secondary border-0",
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
                                            html.I(className="fas fa-list me-2"),
                                            "异常明细",
                                            dbc.Badge(
                                                id="anomaly-count-badge",
                                                color="danger",
                                                className="ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dash_table.DataTable(
                                            id="anomaly-table",
                                            columns=[
                                                {
                                                    "name": "异常类型",
                                                    "id": "anomaly_type",
                                                    "type": "text",
                                                },
                                                {
                                                    "name": "严重程度",
                                                    "id": "severity",
                                                    "type": "text",
                                                },
                                                {
                                                    "name": "检测时间",
                                                    "id": "detected_at",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "描述",
                                                    "id": "description",
                                                    "type": "text",
                                                },
                                                {
                                                    "name": "关联预约",
                                                    "id": "appointment_no",
                                                    "type": "text",
                                                },
                                                {
                                                    "name": "状态",
                                                    "id": "is_resolved",
                                                    "type": "text",
                                                },
                                                {
                                                    "name": "备注",
                                                    "id": "remark_content",
                                                    "type": "text",
                                                },
                                            ],
                                            style_table={
                                                "overflowX": "auto",
                                                "minHeight": "300px",
                                            },
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
                                                    "if": {"filter_query": "{is_resolved} = '已处理'"},
                                                    "opacity": 0.6,
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
            ],
            fluid=True,
        )

    def _build_kpi_row(self):
        kpi_configs = [
            {
                "id": "kpi-total",
                "icon": "fas fa-calendar-check",
                "icon_color": "text-info",
                "title": "总预约数",
                "value_id": "kpi-total-value",
                "change_id": "kpi-total-change",
            },
            {
                "id": "kpi-completed",
                "icon": "fas fa-check-circle",
                "icon_color": "text-success",
                "title": "已完成",
                "value_id": "kpi-completed-value",
                "change_id": "kpi-completed-change",
            },
            {
                "id": "kpi-completion-rate",
                "icon": "fas fa-percentage",
                "icon_color": "text-primary",
                "title": "完成率",
                "value_id": "kpi-completion-rate-value",
                "change_id": "kpi-completion-rate-change",
                "suffix": "%",
            },
            {
                "id": "kpi-no-show",
                "icon": "fas fa-user-slash",
                "icon_color": "text-danger",
                "title": "爽约数",
                "value_id": "kpi-no-show-value",
                "change_id": "kpi-no-show-change",
            },
            {
                "id": "kpi-no-show-rate",
                "icon": "fas fa-exclamation-triangle",
                "icon_color": "text-warning",
                "title": "爽约率",
                "value_id": "kpi-no-show-rate-value",
                "change_id": "kpi-no-show-rate-change",
                "suffix": "%",
            },
            {
                "id": "kpi-revenue",
                "icon": "fas fa-yen-sign",
                "icon_color": "text-success",
                "title": "营收",
                "value_id": "kpi-revenue-value",
                "change_id": "kpi-revenue-change",
                "prefix": "¥",
            },
        ]

        return dbc.Row(
            [
                dbc.Col(
                    self._build_kpi_card(**config),
                    md=6,
                    lg=2,
                    className="mb-4",
                )
                for config in kpi_configs
            ]
        )

    def _build_kpi_card(
        self,
        id,
        icon,
        icon_color,
        title,
        value_id,
        change_id,
        prefix="",
        suffix="",
    ):
        return dbc.Card(
            dbc.CardBody(
                [
                    html.Div(
                        [
                            html.I(className=f"{icon} {icon_color} fa-2x"),
                        ],
                        className="float-end",
                    ),
                    html.H6(
                        title,
                        className="text-muted small mb-2",
                    ),
                    html.H4(
                        [prefix, html.Span(id=value_id, children="0"), suffix],
                        className="fw-bold text-white mb-1",
                    ),
                    html.Small(
                        id=change_id,
                        className="text-muted",
                        children="--",
                    ),
                ],
                className="py-3",
            ),
            className="bg-secondary border-0 h-100",
        )
