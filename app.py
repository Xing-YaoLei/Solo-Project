from dash import Dash, dcc, html
import dash_bootstrap_components as dbc

from utils.config import settings
from app.components.filters import build_filter_panel
from app.components.kpi_cards import build_kpi_cards
from app.components.calendar_view import build_calendar_view, build_detail_modal, build_note_modal
from app.components.trend_charts import build_trend_view, build_anomaly_view
from app.callbacks.main_callbacks import register_callbacks


def create_app() -> Dash:
    app = Dash(
        __name__,
        external_stylesheets=[
            dbc.themes.BOOTSTRAP,
            "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        ],
        suppress_callback_exceptions=True,
        title="旅游民宿房态管理趋势看板"
    )

    app.layout = html.Div([
        dcc.Store(id="store-selected-context", data={}),
        dcc.Download(id="export-download"),

        dbc.Toast(
            id="note-save-toast",
            is_open=False,
            position="top-end",
            style={"marginTop": "80px", "marginRight": "20px"}
        ),
        dbc.Toast(
            id="export-toast",
            is_open=False,
            position="top-end",
            style={"marginTop": "80px", "marginRight": "20px"}
        ),

        dcc.Interval(id={"type": "initial-load", "index": "main"}, interval=1, max_intervals=1),

        dbc.NavbarSimple(
            brand=[
                html.I(className="bi bi-house-heart-fill me-2", style={"fontSize": "1.5rem"}),
                "旅游民宿房态管理趋势看板"
            ],
            brand_href="#",
            color="primary",
            dark=True,
            className="mb-4",
            children=[
                dbc.NavItem(dbc.NavLink("首页", href="#")),
                dbc.DropdownMenu(
                    children=[
                        dbc.DropdownMenuItem("同步OTA订单", id="menu-sync-ota", n_clicks=0),
                        dbc.DropdownMenuItem("同步收款流水", id="menu-sync-payment", n_clicks=0),
                        dbc.DropdownMenuItem("同步门锁记录", id="menu-sync-lock", n_clicks=0),
                        dbc.DropdownMenuItem(divider=True),
                        dbc.DropdownMenuItem("全部同步", id="menu-sync-all", n_clicks=0),
                    ],
                    nav=True,
                    in_navbar=True,
                    label="数据同步",
                ),
            ]
        ),

        dbc.Container(fluid=True, children=[
            build_filter_panel(),
            build_kpi_cards(),
            build_calendar_view(),
            build_trend_view(),
            build_anomaly_view(),

            html.Hr(),
            html.Footer([
                html.Small(
                    "© 2026 旅游民宿房态管理系统 | "
                    "技术栈: Python Dash + Plotly + Pandas + PostgreSQL + Celery",
                    className="text-muted"
                )
            ], className="text-center mb-4")
        ]),

        build_detail_modal(),
        build_note_modal(),
    ])

    register_callbacks(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=settings.DASH_HOST,
        port=settings.DASH_PORT,
        debug=settings.DASH_DEBUG
    )
