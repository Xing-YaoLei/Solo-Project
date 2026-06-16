import dash
from dash import dcc, html, Input, Output, State, callback, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
from datetime import date, timedelta
import pandas as pd
import numpy as np
from etl.data_service import DataService
from config.settings import settings

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.FLATLY],
    suppress_callback_exceptions=True,
    title="康复中心康复评估风险监测系统",
)

server = app.server

data_service = DataService()

from dashboard.callbacks.main_callbacks import *

NAVBAR = dbc.Navbar(
    dbc.Container([
        dbc.NavbarBrand("🏥 康复中心康复评估风险监测系统", className="ms-2"),
        dbc.Nav([
            dbc.NavItem(dbc.NavLink("风险监测", href="/", active="exact")),
            dbc.NavItem(dbc.NavLink("治疗日历", href="/treatment-calendar", active="exact")),
            dbc.NavItem(dbc.NavLink("器械状态", href="/equipment", active="exact")),
            dbc.NavItem(dbc.NavLink("护理日志", href="/nursing-logs", active="exact")),
        ], pills=True),
        dbc.Button("🔄 刷新数据", id="refresh-btn", color="primary", className="me-2"),
        dcc.Interval(id="auto-refresh-interval", interval=300000, n_intervals=0),
    ], fluid=True),
    color="primary",
    dark=True,
    className="mb-4",
)

CONTENT = html.Div(id="page-content")

app.layout = html.Div([dcc.Location(id="url"), NAVBAR, CONTENT])


@app.callback(Output("page-content", "children"), [Input("url", "pathname")])
def render_page_content(pathname):
    if pathname == "/":
        return render_risk_monitor_page()
    elif pathname == "/treatment-calendar":
        return render_treatment_calendar_page()
    elif pathname == "/equipment":
        return render_equipment_page()
    elif pathname == "/nursing-logs":
        return render_nursing_logs_page()
    else:
        return dbc.Jumbotron(
            [
                html.H1("404: Not found", className="text-danger"),
                html.Hr(),
                html.P(f"The pathname {pathname} was not recognised..."),
            ]
        )


def render_risk_monitor_page():
    return dbc.Container([
        html.H2("康复评估风险监测图", className="mb-4"),

        dbc.Row([
            dbc.Col(dbc.Card(
                dbc.CardBody([
                    html.H5("综合风险评分", className="card-title"),
                    html.H2(id="risk-score", className="text-primary"),
                    html.P(id="risk-score-change", className="small"),
                ]),
                className="mb-3",
            ), md=3),
            dbc.Col(dbc.Card(
                dbc.CardBody([
                    html.H5("平均训练完成率", className="card-title"),
                    html.H2(id="avg-completion", className="text-success"),
                    html.P("过去30天", className="small text-muted"),
                ]),
                className="mb-3",
            ), md=3),
            dbc.Col(dbc.Card(
                dbc.CardBody([
                    html.H5("平均收费延迟率", className="card-title"),
                    html.H2(id="avg-delay", className="text-warning"),
                    html.P("过去30天", className="small text-muted"),
                ]),
                className="mb-3",
            ), md=3),
            dbc.Col(dbc.Card(
                dbc.CardBody([
                    html.H5("未解决异常", className="card-title"),
                    html.H2(id="unresolved-anomalies", className="text-danger"),
                    html.P("近3天", className="small text-muted"),
                ]),
                className="mb-3",
            ), md=3),
        ]),

        dbc.Row([
            dbc.Col([
                html.H5("时间范围"),
                dcc.Dropdown(
                    id="date-range-dropdown",
                    options=[
                        {"label": "最近7天", "value": 7},
                        {"label": "最近14天", "value": 14},
                        {"label": "最近30天", "value": 30},
                        {"label": "最近90天", "value": 90},
                    ],
                    value=30,
                    clearable=False,
                ),
            ], md=3),
            dbc.Col([
                html.H5("指标选择"),
                dcc.Dropdown(
                    id="metrics-dropdown",
                    options=[
                        {"label": "全部指标", "value": "all"},
                        {"label": "训练完成率", "value": "训练完成率"},
                        {"label": "收费表延迟率", "value": "收费表延迟率"},
                        {"label": "病历完整度", "value": "病历完整度"},
                        {"label": "打卡一致性", "value": "打卡一致性"},
                        {"label": "医保拒付率", "value": "医保拒付率"},
                    ],
                    value="all",
                    multi=True,
                ),
            ], md=6),
            dbc.Col([
                html.H5("下载数据"),
                dbc.Button("📥 导出CSV", id="download-btn", color="success", className="w-100 mt-2"),
                dcc.Download(id="download-csv"),
            ], md=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="risk-monitor-chart", style={"height": "500px"}),
            ], md=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H4("异常标记与复盘记录", className="mb-3"),
                dbc.Alert(
                    "⚠️ 复盘说明与异常点关联展示，不分开存储。点击异常行可查看详细复盘内容。",
                    color="info",
                    className="mb-3",
                ),
                dash_table.DataTable(
                    id="anomalies-table",
                    columns=[
                        {"name": "日期", "id": "date"},
                        {"name": "异常类型", "id": "anomaly_type"},
                        {"name": "严重程度", "id": "severity"},
                        {"name": "描述", "id": "description"},
                        {"name": "是否解决", "id": "is_resolved"},
                        {"name": "复盘次数", "id": "review_count"},
                        {"name": "复盘内容", "id": "review_contents"},
                        {"name": "复盘人员", "id": "reviewers"},
                    ],
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "left", "padding": "10px"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    style_data_conditional=[
                        {
                            "if": {"filter_query": '{severity} = "high"'},
                            "backgroundColor": "#ffebee",
                            "color": "red",
                        },
                        {
                            "if": {"filter_query": '{severity} = "medium"'},
                            "backgroundColor": "#fff8e1",
                        },
                        {
                            "if": {"filter_query": '{is_resolved} = true'},
                            "opacity": "0.6",
                        },
                    ],
                    page_size=10,
                ),
            ], md=12),
        ]),

        html.Hr(),

        dbc.Row([
            dbc.Col([
                html.H5("指标定义", className="mb-3"),
                dbc.Accordion(id="metrics-accordion", always_open=True),
            ], md=12),
        ]),

        html.Div(id="refresh-status", className="mt-3"),
    ], fluid=True)


def render_treatment_calendar_page():
    return dbc.Container([
        html.H2("治疗日历", className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H5("查看天数"),
                dcc.Dropdown(
                    id="calendar-days",
                    options=[{"label": f"{d}天", "value": d} for d in [7, 14, 21, 30]],
                    value=14,
                    clearable=False,
                ),
            ], md=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="treatment-calendar-chart", style={"height": "600px"}),
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                html.H4("治疗明细", className="mt-4 mb-3"),
                dash_table.DataTable(
                    id="treatment-details-table",
                    columns=[
                        {"name": "日期", "id": "date"},
                        {"name": "患者ID", "id": "patient_id"},
                        {"name": "治疗类型", "id": "treatment_type"},
                        {"name": "治疗师", "id": "therapist"},
                        {"name": "时长(分钟)", "id": "duration"},
                        {"name": "是否完成", "id": "is_completed"},
                        {"name": "疼痛减轻", "id": "pain_reduction"},
                    ],
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "left", "padding": "8px"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    page_size=20,
                ),
            ], md=12),
        ]),
    ], fluid=True)


def render_equipment_page():
    return dbc.Container([
        html.H2("器械状态", className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="equipment-status-chart", style={"height": "500px"}),
            ], md=8),
            dbc.Col([
                html.H5("器械使用统计", className="mb-3"),
                html.Div(id="equipment-stats-cards"),
            ], md=4),
        ]),

        dbc.Row([
            dbc.Col([
                html.H4("器械明细", className="mt-4 mb-3"),
                dash_table.DataTable(
                    id="equipment-details-table",
                    columns=[
                        {"name": "器械ID", "id": "equipment_id"},
                        {"name": "名称", "id": "name"},
                        {"name": "类型", "id": "type"},
                        {"name": "位置", "id": "location"},
                        {"name": "状态", "id": "status"},
                        {"name": "使用率(%)", "id": "utilization_rate"},
                        {"name": "上次维护", "id": "last_maintenance"},
                        {"name": "下次维护", "id": "next_maintenance"},
                    ],
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "left", "padding": "8px"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    style_data_conditional=[
                        {
                            "if": {"filter_query": '{status} = "maintenance"'},
                            "backgroundColor": "#fff3e0",
                        },
                        {
                            "if": {"filter_query": '{status} = "broken"'},
                            "backgroundColor": "#ffebee",
                            "color": "red",
                        },
                        {
                            "if": {"filter_query": '{utilization_rate} > 80'},
                            "backgroundColor": "#e8f5e9",
                        },
                    ],
                    page_size=15,
                ),
            ], md=12),
        ]),
    ], fluid=True)


def render_nursing_logs_page():
    return dbc.Container([
        html.H2("护理日志", className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H5("查看天数"),
                dcc.Dropdown(
                    id="nursing-days",
                    options=[{"label": f"{d}天", "value": d} for d in [7, 14, 30]],
                    value=7,
                    clearable=False,
                ),
            ], md=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="nursing-summary-chart", style={"height": "400px"}),
            ], md=12),
        ]),

        dbc.Row([
            dbc.Col([
                html.H4("护理日志明细", className="mt-4 mb-3"),
                dash_table.DataTable(
                    id="nursing-logs-table",
                    columns=[
                        {"name": "日期", "id": "date"},
                        {"name": "时间", "id": "time"},
                        {"name": "患者ID", "id": "patient_id"},
                        {"name": "护士", "id": "nurse"},
                        {"name": "护理措施", "id": "nursing_measures"},
                        {"name": "患者反应", "id": "patient_response"},
                        {"name": "有无异常", "id": "has_abnormalities"},
                    ],
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "left", "padding": "8px"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    style_data_conditional=[
                        {
                            "if": {"filter_query": '{has_abnormalities} = true'},
                            "backgroundColor": "#ffebee",
                        },
                    ],
                    page_size=15,
                ),
            ], md=12),
        ]),
    ], fluid=True)
