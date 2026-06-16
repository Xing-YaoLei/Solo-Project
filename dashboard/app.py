import os
import dash
import dash_bootstrap_components as dbc
from dash import dcc, html

from config import settings

app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.CYBORG,
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
    ],
    suppress_callback_exceptions=True,
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
)

app.title = "洁牙预约漏斗报表"

server = app.server

from dashboard.layouts import serve_layout
from dashboard.callbacks import register_callbacks

app.layout = serve_layout

register_callbacks(app)
