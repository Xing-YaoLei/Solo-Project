import dash
import dash_bootstrap_components as dbc
from flask import Flask

from config import DEBUG

server = Flask(__name__)

app = dash.Dash(
    __name__,
    server=server,
    external_stylesheets=[dbc.themes.BOOTSTRAP, "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"],
    suppress_callback_exceptions=True,
    title="汽车维修预约进厂风险监测",
)

app.config.suppress_callback_exceptions = True
