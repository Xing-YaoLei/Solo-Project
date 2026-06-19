from datetime import date, timedelta
from dash import dcc, html
import dash_bootstrap_components as dbc


def build_filter_panel():
    today = date.today()
    default_start = today - timedelta(days=30)
    default_end = today + timedelta(days=60)

    return dbc.Card(
        dbc.CardBody([
            html.H5("筛选条件", className="mb-3"),
            dbc.Row([
                dbc.Col([
                    html.Label("日期范围", className="fw-bold"),
                    dcc.DatePickerRange(
                        id="date-range-picker",
                        start_date=default_start,
                        end_date=default_end,
                        display_format="YYYY-MM-DD",
                        start_date_placeholder_text="开始日期",
                        end_date_placeholder_text="结束日期",
                        className="w-100"
                    )
                ], md=4),
                dbc.Col([
                    html.Label("房源", className="fw-bold"),
                    dcc.Dropdown(
                        id="property-dropdown",
                        placeholder="选择房源（可多选）",
                        multi=True,
                        clearable=True
                    )
                ], md=4),
                dbc.Col([
                    html.Label("渠道", className="fw-bold"),
                    dcc.Dropdown(
                        id="channel-dropdown",
                        placeholder="选择渠道（可多选）",
                        multi=True,
                        clearable=True
                    )
                ], md=4)
            ], className="mb-3"),
            dbc.Row([
                dbc.Col([
                    html.Label("统计维度", className="fw-bold"),
                    dcc.Dropdown(
                        id="group-by-dropdown",
                        options=[
                            {"label": "按天", "value": "day"},
                            {"label": "按周", "value": "week"},
                            {"label": "按月", "value": "month"}
                        ],
                        value="day",
                        clearable=False
                    )
                ], md=3),
                dbc.Col([
                    html.Label("显示异常数据", className="fw-bold"),
                    dbc.Switch(
                        id="show-anomaly-switch",
                        label="包含异常值",
                        value=True,
                        className="mt-2"
                    )
                ], md=3),
                dbc.Col([
                    html.Label("仅显示冲突", className="fw-bold"),
                    dbc.Switch(
                        id="show-conflict-only-switch",
                        label="仅冲突房态",
                        value=False,
                        className="mt-2"
                    )
                ], md=3),
                dbc.Col([
                    html.Label("&nbsp;", className="fw-bold d-block"),
                    dbc.ButtonGroup([
                        dbc.Button(
                            "初始化演示数据",
                            id="init-demo-btn",
                            color="info",
                            className="me-2",
                            outline=True
                        ),
                        dbc.Button(
                            "刷新数据",
                            id="refresh-btn",
                            color="primary",
                            className="me-2"
                        ),
                        dbc.Button(
                            "导出报表",
                            id="export-btn",
                            color="success"
                        )
                    ])
                ], md=4)
            ])
        ]),
        className="mb-4"
    )
