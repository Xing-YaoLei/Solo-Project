from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc

from app.pages.common import build_filter_bar, build_user_banner, build_operation_kpi_row


def build_frontline_layout(user_info: dict):
    zones = user_info.get("assigned_zone") or "未分配区域"
    return dbc.Container(fluid=True, className="px-4 py-4", children=[
        build_user_banner(prefix="fl", user_info=user_info, show_logout_btn=True),
        build_filter_bar(prefix="fl", show_zone_filter=False, is_management=False),

        dbc.Alert(
            [
                html.I(className="bi bi-info-circle-fill me-2"),
                html.Strong("一线人员视图："),
                f"仅显示您负责范围内的到场率明细数据（{zones}）。如需全局总览请联系管理层。",
            ],
            color="info",
            className="mb-4",
            dismissable=True,
        ),

        html.H5([html.I(className="bi bi-funnel-fill text-primary me-2"), "预约追踪漏斗指标"], className="mb-2 fw-bold text-primary"),
        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.I(className="bi bi-people-fill fs-4 text-primary"),
                            html.Span("负责区域预约数", className="ms-2 text-muted small fw-bold"),
                        ]),
                        html.H2(id="fl-kpi-reservation", className="mt-2 mb-0 text-primary fw-bold", children="—"),
                    ]),
                    className="shadow-sm border-0 h-100",
                ),
            ], md=3, sm=6, className="mb-3"),
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.I(className="bi bi-check2-circle fs-4 text-success"),
                            html.Span("负责区域到场数", className="ms-2 text-muted small fw-bold"),
                        ]),
                        html.H2(id="fl-kpi-checkin", className="mt-2 mb-0 text-success fw-bold", children="—"),
                    ]),
                    className="shadow-sm border-0 h-100",
                ),
            ], md=3, sm=6, className="mb-3"),
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.I(className="bi bi-percent fs-4 text-info"),
                            html.Span("本区域到场率", className="ms-2 text-muted small fw-bold"),
                        ]),
                        html.H2(id="fl-kpi-rate", className="mt-2 mb-0 text-info fw-bold", children="—"),
                    ]),
                    className="shadow-sm border-0 h-100",
                ),
            ], md=3, sm=6, className="mb-3"),
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.I(className="bi bi-exclamation-triangle fs-4 text-warning"),
                            html.Span("需重点跟进数", className="ms-2 text-muted small fw-bold"),
                        ]),
                        html.H2(id="fl-kpi-pending", className="mt-2 mb-0 text-warning fw-bold", children="—"),
                    ]),
                    className="shadow-sm border-0 h-100",
                ),
            ], md=3, sm=6, className="mb-3"),
        ], className="mb-4"),

        html.H5([html.I(className="bi bi-graph-up text-success me-2"), "独立运营指标（含散客）"], className="mb-2 fw-bold text-success mt-3"),
        build_operation_kpi_row(prefix="fl"),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-pin-map-fill text-danger me-2"), "到场率明细（负责区域）"], className="mb-3 fw-bold"),
                        dcc.Graph(id="fl-chart-zone-rate", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=6, className="mb-4"),

            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-megaphone-fill text-warning me-2"), "待重点提醒名单"], className="mb-3 fw-bold"),
                        dcc.Graph(id="fl-chart-pending-reminder", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm h-100",
                ),
            ], lg=6, className="mb-4"),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-calendar-heatmap text-info me-2"), "负责区域时段热力图"], className="mb-3 fw-bold"),
                        dcc.Graph(id="fl-chart-timeslot-heatmap", config={"displayModeBar": False}),
                    ]),
                    className="shadow-sm",
                ),
            ], lg=12, className="mb-4"),
        ]),

        dbc.Row([
            dbc.Col([
                dbc.Card(
                    dbc.CardBody([
                        html.H5([html.I(className="bi bi-list-task text-dark me-2"), "到场率明细表（可导出）"], className="mb-3 fw-bold"),
                        dash_table.DataTable(
                            id="fl-table-funnel-detail",
                            export_format="xlsx",
                            page_size=12,
                            sort_action="native",
                            filter_action="native",
                            style_table={"overflowX": "auto"},
                            style_header={
                                "backgroundColor": "#0d6efd",
                                "color": "white",
                                "fontWeight": "bold",
                                "textAlign": "center",
                            },
                            style_cell={
                                "textAlign": "center",
                                "padding": "6px 10px",
                                "fontSize": "13px",
                            },
                            style_data_conditional=[
                                {
                                    "if": {"filter_query": "{arrival_status} = 'normal'", "column_id": "arrival_status"},
                                    "backgroundColor": "#d1e7dd", "color": "#0f5132",
                                },
                                {
                                    "if": {"filter_query": "{arrival_status} = 'warning'", "column_id": "arrival_status"},
                                    "backgroundColor": "#fff3cd", "color": "#664d03",
                                },
                                {
                                    "if": {"filter_query": "{arrival_status} = 'critical'", "column_id": "arrival_status"},
                                    "backgroundColor": "#f8d7da", "color": "#842029",
                                },
                                {
                                    "if": {"column_id": "checkin_rate"},
                                    "format": {"specifier": ".1%", },
                                },
                                {
                                    "if": {"column_id": "in_zone_rate"},
                                    "format": {"specifier": ".1%"},
                                },
                                {
                                    "if": {"column_id": "conversion_rate"},
                                    "format": {"specifier": ".1%"},
                                },
                                {"if": {"column_id": "remark"}, "textAlign": "left"},
                            ],
                        ),
                    ]),
                    className="shadow-sm",
                ),
            ], lg=12, className="mb-4"),
        ]),
    ])
