import dash
import dash_bootstrap_components as dbc
from config.settings import settings

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title=settings.app_name
)

server = app.server

from app.layouts.main_layout import create_main_layout

app.layout = create_main_layout()

from app.callbacks import main_callbacks
