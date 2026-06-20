from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc

from app.pages.common import build_filter_bar, build_kpi_row, build_user_banner


def build_management_layout(user_info: dict):
    return dbc.Container(fluid=True, className="px-4 py-4", children=[
        build_user_banner(user_info),
        build_filter_bar(show_zone_filter=True, is_management=True),
        build_kpi_row(include_consumed=True),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        dcc.Graph(id="chart-status-dist", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=4, md=12, className="mb-4"),

            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        dcc.Graph(id="chart-funnel", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=8, md=12, className="mb-4"),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-calendar-heatmap text-info me-2"), "日历时段排行"], className="mb-3 fw-bold"),
                        dcc.Graph(id="chart-timeslot-heatmap", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm",
                ),
            ], lg=12, className="mb-4"),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-shield-slash text-danger me-2"), "容量规则变化趋势"], className="mb-3 fw-bold"),
                        dcc.Graph(id="chart-capacity-change", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=7, className="mb-4"),

            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-bar-chart-steps text-secondary me-2"), "区域指标对比"], className="mb-3 fw-bold"),
                        dcc.Graph(id="chart-zone-rate", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=5, className="mb-4"),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-clock-history text-dark me-2"), "数据处理批次记录"], className="mb-3 fw-bold"),
                        dash_table.DataTable(
                            id="table-batches",
                            page_size=8,
                            style_table={"overflowX": "auto"},
                            style_header={
                                "backgroundColor": "#343a40",
                                "color": "white",
                                "fontWeight": "bold",
                                "textAlign": "center",
                            },
                            style_cell={
                                "textAlign": "center",
                                "padding": "8px 12px",
                                "fontSize": "13px",
                            },
                            style_cell_conditional=[
                                {"if": {"column_id": "备注"}, "textAlign": "left"},
                            ],
                            style_data_conditional=[
                                {"if": {"filter_query": "{状态} = '已完成'"}, "color": "#198754"},
                                {"if": {"filter_query": "{状态} = '失败'"}, "color": "#dc3545", "fontWeight": "bold"},
                                {"if": {"filter_query": "{状态} = '处理中'"}, "color": "#0d6efd"},
                            ],
                        ),
                    ]),
                    className="shadow-sm",
                ),
            ], lg=12, className="mb-4"),
        ]),
    ])
