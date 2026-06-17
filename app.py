import os
import logging
from dash import Dash
import dash_bootstrap_components as dbc
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    ],
    suppress_callback_exceptions=True,
    title="养老护理入住评估趋势看板",
)

server = app.server

from app.layouts.main_layout import build_main_layout
app.layout = build_main_layout()

from app.callbacks.trend_callbacks import register_trend_callbacks
from app.callbacks.elder_callbacks import register_elder_callbacks
from app.callbacks.export_callbacks import register_export_callbacks

register_trend_callbacks(app)
register_elder_callbacks(app)
register_export_callbacks(app)


if __name__ == "__main__":
    debug = os.getenv("DEBUG", "True").lower() == "true"
    port = int(os.getenv("PORT", "8050"))
    app.run_server(debug=debug, host="0.0.0.0", port=port)
