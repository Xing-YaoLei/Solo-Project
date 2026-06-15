import os
import logging

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
from dash import Input, Output, State, html, dcc, callback_context, no_update


with server.app_context():
    main_layout = create_main_layout()
    drilldown_layout = create_drilldown_layout()


register_main_callbacks()
register_drilldown_callbacks()


@app.callback(Output("page-content", "children"), [Input("url", "pathname")])
def display_page(pathname):
    logger.info(f"路由跳转: pathname={pathname}")
    if pathname and pathname.startswith("/drilldown/"):
        return drilldown_layout
    return main_layout


app.layout = html.Div(
    [
        dcc.Location(id="url", refresh=False),
        dcc.Store(id="drilldown-grade-id", data=None),
        html.Div(id="page-content"),
    ]
)


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
