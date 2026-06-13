import logging

import dash
import dash_bootstrap_components as dbc
from sqlalchemy import create_engine

from config import config
from views.layout import create_layout
from views.callbacks import register_callbacks

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))
logger = logging.getLogger(__name__)


def get_regions():
    engine = create_engine(config.DATABASE_URL)
    try:
        import pandas as pd
        df = pd.read_sql("SELECT DISTINCT region_code, region_name FROM funnel_metric ORDER BY region_code", engine)
        return [{"label": row["region_name"], "value": row["region_code"]} for _, row in df.iterrows()]
    except Exception:
        return []


def create_app():
    regions = get_regions()

    app = dash.Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        suppress_callback_exceptions=True,
        title="社区团购预售团单漏斗报表",
    )

    app.layout = create_layout(regions)
    register_callbacks(app)

    return app


app = create_app()
server = app.server

if __name__ == "__main__":
    app.run_server(
        host=config.DASH_HOST,
        port=config.DASH_PORT,
        debug=config.DASH_DEBUG,
    )
