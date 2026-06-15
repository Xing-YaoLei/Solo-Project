import os
import logging
from datetime import datetime, timedelta, date

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

from app import app, server, db
from app.pages import create_main_layout, create_drilldown_layout
from app.callbacks import register_main_callbacks, register_drilldown_callbacks
from dash import Input, Output, html, dcc


with server.app_context():
    main_layout = create_main_layout()
    drilldown_layout = create_drilldown_layout()


register_main_callbacks()
register_drilldown_callbacks()


app.layout = main_layout


if __name__ == "__main__":
    debug = os.getenv("DASH_DEBUG", "True").lower() == "true"
    port = int(os.getenv("DASH_PORT", "8050"))

    logger.info("=" * 60)
    logger.info("职业教育在线课程漏斗报表系统启动")
    logger.info("=" * 60)
    logger.info(f"早会快速访问: http://localhost:{port}/")
    logger.info(f"调试模式: {debug}")
    logger.info("=" * 60)

    app.run(debug=debug, port=port, host="0.0.0.0")
