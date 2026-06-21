import os
import dash
import dash_bootstrap_components as dbc
from dotenv import load_dotenv
from flask_caching import Cache

load_dotenv()

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP, 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.0/dist/lumen/bootstrap.min.css'],
    suppress_callback_exceptions=True,
    title='跑腿订单风险监测系统',
    meta_tags=[
        {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}
    ]
)

server = app.server

cache = Cache(
    server,
    config={
        'CACHE_TYPE': 'SimpleCache',
        'CACHE_DEFAULT_TIMEOUT': 60
    }
)

from dash_app.layout import get_layout
from dash_app.callbacks import register_callbacks

app.layout = get_layout()
register_callbacks(app, cache)

if __name__ == '__main__':
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    port = int(os.getenv('PORT', '8050'))
    app.run_server(debug=debug, host='0.0.0.0', port=port)
