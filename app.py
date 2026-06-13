import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dash import Dash, dcc, html, Input, Output, State, callback, no_update
import dash_bootstrap_components as dbc

from dash_app.components import create_layout
from dash_app.pages import overview, capacity, conflicts, reschedule, reports
from utils.db_adapter import DB_TYPE, init_db, seed_test_data


def create_app():
    if DB_TYPE == "sqlite":
        db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fitness_pt.db")
        if not os.path.exists(db_file):
            print(f"SQLite数据库不存在，正在初始化并生成测试数据...")
            init_db()
            seed_test_data(days=60)
    else:
        init_db()

    app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        suppress_callback_exceptions=True,
        meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
        title="健身私教预约趋势看板 | PT Dashboard",
        assets_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "dash_app/assets"),
    )

    app.index_string = """
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
"""

    PAGES = {
        "overview": overview.register_page(),
        "capacity": capacity.register_page(),
        "conflicts": conflicts.register_page(),
        "reschedule": reschedule.register_page(),
        "reports": reports.register_page(),
    }

    for page_id, page_obj in PAGES.items():
        if page_obj.get("register_callbacks"):
            page_obj["register_callbacks"](app)

    app.layout = html.Div([
        dcc.Location(id="url", refresh=False),
        html.Div(id="sidebar-container"),
        html.Div(id="page-content", className="main-content"),
        dcc.Store(id="shared-db-type", data=DB_TYPE),
    ], className="app-container")

    @callback(
        Output("sidebar-container", "children"),
        Output("page-content", "children"),
        Input("url", "pathname"),
    )
    def display_page(pathname):
        path_map = {
            "/": ("overview", PAGES["overview"]),
            "/capacity": ("capacity", PAGES["capacity"]),
            "/conflicts": ("conflicts", PAGES["conflicts"]),
            "/reschedule": ("reschedule", PAGES["reschedule"]),
            "/reports": ("reports", PAGES["reports"]),
        }
        active_id, page_obj = path_map.get(pathname or "/", ("overview", PAGES["overview"]))
        sidebar = create_layout(active_id)

        try:
            content = page_obj["layout"]()
        except Exception as e:
            import traceback
            error_html = html.Div([
                html.H3("页面加载错误", style={"color": "#e53935"}),
                html.Pre(traceback.format_exc(), style={
                    "background": "#fafafa",
                    "padding": "16px",
                    "border": "1px solid #e0e0e0",
                    "borderRadius": "8px",
                    "maxHeight": "500px",
                    "overflow": "auto",
                    "fontSize": "12px",
                })
            ], className="card")
            content = error_html

        return sidebar, content

    return app


if __name__ == "__main__":
    from config import dash_config
    app = create_app()
    print(f"\n🚀 启动健身私教预约趋势看板 (数据库: {DB_TYPE})")
    print(f"📊 访问地址: http://{dash_config.HOST}:{dash_config.PORT}")
    app.run_server(
        host=dash_config.HOST,
        port=dash_config.PORT,
        debug=dash_config.DEBUG,
        dev_tools_hot_reload=False,
    )
