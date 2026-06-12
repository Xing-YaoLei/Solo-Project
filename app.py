from dash import Dash, dcc, html, Input, Output
import dash_bootstrap_components as dbc

from config import DASH_HOST, DASH_PORT
from dashboard.layouts.overview import create_overview_layout
from dashboard.layouts.trend import create_trend_layout
from dashboard.layouts.detail import create_detail_layout
from dashboard.callbacks.overview import register_overview_callbacks
from dashboard.callbacks.trend import register_trend_callbacks
from dashboard.callbacks.detail import register_detail_callbacks


CUSTOM_CSS = """
.card-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2c3e50;
    margin: 0;
}
.card-value + p {
    color: #7f8c8d;
    margin-top: 0.5rem;
    margin-bottom: 0;
}
.nav-link {
    cursor: pointer;
}
.page-content {
    padding: 2rem 1.5rem;
    background-color: #f8f9fa;
    min-height: calc(100vh - 80px);
}
.sidebar {
    background-color: #2c3e50;
    min-height: 100vh;
    padding-top: 1.5rem;
}
.sidebar .nav-link {
    color: #ecf0f1 !important;
    padding: 0.75rem 1.25rem;
    border-left: 4px solid transparent;
    transition: all 0.2s;
}
.sidebar .nav-link:hover {
    background-color: #34495e;
    color: #ffffff !important;
}
.sidebar .nav-link.active {
    background-color: #34495e;
    border-left-color: #3498db;
    color: #ffffff !important;
}
.sidebar .brand {
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: bold;
    padding: 0 1.25rem 1.5rem;
    border-bottom: 1px solid #34495e;
    margin-bottom: 1rem;
}
"""


def create_app():
    app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.FLATLY],
        suppress_callback_exceptions=True,
        title="连锁咖啡原料补货趋势看板",
    )

    app.index_string = f"""
    <!DOCTYPE html>
    <html>
        <head>
            {{%metas%}}
            <title>{{%title%}}</title>
            {{%favicon%}}
            {{%css%}}
            <style>{CUSTOM_CSS}</style>
        </head>
        <body>
            {{%app_entry%}}
            <footer>
                {{%config%}}
                {{%scripts%}}
                {{%renderer%}}
            </footer>
        </body>
    </html>
    """

    sidebar = html.Div(
        className="sidebar col-md-2",
        children=[
            html.Div("☕ 咖啡补货看板", className="brand"),
            dbc.Nav(
                vertical=True,
                pills=True,
                children=[
                    dbc.NavLink("总览", href="/", id="nav-overview", active="exact"),
                    dbc.NavLink("趋势分析", href="/trend", id="nav-trend"),
                    dbc.NavLink("数据明细", href="/detail", id="nav-detail"),
                ],
            ),
        ],
    )

    content = html.Div(
        className="page-content col-md-10",
        children=[
            dcc.Location(id="url", refresh=False),
            html.Div(id="page-content"),
        ],
    )

    app.layout = dbc.Row(
        [
            sidebar,
            content,
        ],
        className="g-0",
    )

    @app.callback(
        Output("page-content", "children"),
        [Input("url", "pathname")],
    )
    def render_page(pathname):
        if pathname == "/trend":
            return create_trend_layout()
        elif pathname == "/detail":
            return create_detail_layout()
        else:
            return create_overview_layout()

    register_overview_callbacks(app)
    register_trend_callbacks(app)
    register_detail_callbacks(app)

    return app


def main():
    app = create_app()
    app.run_server(
        host=DASH_HOST,
        port=DASH_PORT,
        debug=True,
    )


if __name__ == "__main__":
    main()
