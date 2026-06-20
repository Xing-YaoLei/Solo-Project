import dash
import dash_bootstrap_components as dbc
from app.config import Config

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.FONT_AWESOME],
    title="票务漏斗分析报表",
    suppress_callback_exceptions=True,
)

app.config.suppress_callback_exceptions = True

server = app.server
