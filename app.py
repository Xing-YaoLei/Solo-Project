from dash import Dash, dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
from datetime import datetime, timedelta
from config import Config
from flask_caching import Cache

app = Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.FONT_AWESOME],
    suppress_callback_exceptions=True,
    title="即时下单漏斗报表",
)

app.config.suppress_callback_exceptions = True

server = app.server

cache = Cache()
cache.init_app(server, config={
    "CACHE_TYPE": "simple",
    "CACHE_DEFAULT_TIMEOUT": 300,
})


def serve_layout():
    return html.Div([
        dcc.Store(id="selected-order-store", data=None),
        dcc.Store(id="selected-anomaly-store", data=None),
        dcc.Store(id="refresh-trigger", data=0),
        dcc.Store(id="notification-store", data=[]),
        dcc.Interval(
            id="interval-refresh",
            interval=5 * 60 * 1000,
            n_intervals=0,
        ),
        html.Div(id="dummy-output", style={"display": "none"}),
        build_navbar(),
        dbc.Container([
            build_alert_banner(),
            dbc.Tabs(id="main-tabs", active_tab="funnel", children=[
                dbc.Tab(label="漏斗分析", tab_id="funnel"),
                dbc.Tab(label="订单地址", tab_id="orders"),
                dbc.Tab(label="骑手轨迹", tab_id="tracks"),
                dbc.Tab(label="补贴规则", tab_id="subsidy"),
                dbc.Tab(label="异常监测", tab_id="anomaly"),
                dbc.Tab(label="复盘备注", tab_id="review"),
            ]),
            html.Div(id="tab-content"),
        ], fluid=True, className="mt-3"),
    ])


def build_navbar():
    return dbc.NavbarSimple([
        dbc.NavItem(dbc.NavLink("仪表盘", href="#")),
        dbc.DropdownMenu([
            dbc.DropdownMenuItem("刷新数据", id="btn-refresh-data", n_clicks=0),
            dbc.DropdownMenuItem("导出报表", id="btn-export", n_clicks=0),
            dbc.DropdownMenuItem(divider=True),
            dbc.DropdownMenuItem("保存当前视图", id="btn-save-view", n_clicks=0),
        ], nav=True, in_navbar=True, label="操作", id="action-dropdown"),
        dbc.NavItem(dcc.Download(id="download-excel")),
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("保存视图")),
            dbc.ModalBody([
                dbc.Label("视图名称"),
                dbc.Input(id="view-name-input", placeholder="输入视图名称"),
                html.Br(),
                dbc.Label("视图类型"),
                dcc.Dropdown(
                    id="view-type-dropdown",
                    options=[
                        {"label": "漏斗分析", "value": "funnel"},
                        {"label": "订单地址", "value": "orders"},
                        {"label": "骑手轨迹", "value": "tracks"},
                        {"label": "补贴规则", "value": "subsidy"},
                    ],
                    value="funnel",
                ),
            ]),
            dbc.ModalFooter([
                dbc.Button("取消", id="btn-cancel-save", color="secondary", n_clicks=0),
                dbc.Button("保存", id="btn-confirm-save", color="primary", n_clicks=0),
            ]),
        ], id="save-view-modal", is_open=False),
    ], brand="即时下单漏斗报表看板", brand_href="#", color="primary", dark=True)


def build_alert_banner():
    return html.Div(id="alert-banner-container")


def build_date_range_picker():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    return dbc.Row([
        dbc.Col([
            dbc.Label("时间范围"),
            dcc.DatePickerRange(
                id="date-range-picker",
                start_date=start_date,
                end_date=end_date,
                display_format="YYYY-MM-DD",
            ),
        ], width=6),
        dbc.Col([
            html.Br(),
            dbc.Button([
                html.I(className="fas fa-sync-alt me-2"),
                "刷新数据",
            ], id="btn-refresh", color="info", outline=True, className="me-2"),
            dbc.Badge(id="anomaly-count-badge", color="danger", className="ms-2", pill=True),
        ], width="auto"),
    ], className="mb-3", align="center")


app.layout = serve_layout

from callbacks import *

if __name__ == "__main__":
    from models import init_db
    init_db()
    app.run_server(debug=Config.DEBUG, host="0.0.0.0", port=8050)
