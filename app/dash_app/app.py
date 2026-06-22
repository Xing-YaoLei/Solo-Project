import dash
import dash_bootstrap_components as dbc
from dash import dcc, html, Input, Output
from flask_login import current_user

from app.config import Config
from app.dash_app.server import server
from app.dash_app.layouts import (
    build_navbar, build_overview_layout, build_import_layout, build_batches_layout,
)
from app.dash_app.callbacks import register_callbacks


def create_app():
    app = dash.Dash(
        __name__,
        server=server,
        url_base_pathname="/",
        suppress_callback_exceptions=True,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        title="合规审计制度检查看板",
    )

    app.layout = html.Div(
        [
            dcc.Location(id="url", refresh=False),
            html.Div(id="navbar-container"),
            dbc.Container(id="page-content", fluid=True, className="mb-5"),
        ]
    )

    @app.callback(
        [Output("navbar-container", "children"), Output("page-content", "children")],
        Input("url", "pathname"),
    )
    def display_page(pathname):
        if not current_user.is_authenticated:
            return html.Div(), html.Div()

        navbar = build_navbar(current_user)

        if pathname == "/import":
            return navbar, build_import_layout()
        elif pathname == "/batches":
            return navbar, build_batches_layout()
        else:
            return navbar, build_overview_layout()

    register_callbacks(app)
    return app


app = create_app()

if __name__ == "__main__":
    app.run_server(debug=Config.DASH_DEBUG, host="0.0.0.0", port=8050)
