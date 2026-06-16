import dash
import dash_bootstrap_components as dbc
from flask_caching import Cache
from config.settings import Config

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title="口腔诊所洁牙预约风险监测看板"
)

if Config.DEMO_MODE:
    app.server.config["CACHE_TYPE"] = "SimpleCache"
    app.server.config["CACHE_DEFAULT_TIMEOUT"] = Config.CACHE_TIMEOUT
else:
    app.server.config["CACHE_TYPE"] = "RedisCache"
    app.server.config["CACHE_REDIS_URL"] = Config.REDIS_URL

cache = Cache(app.server)
