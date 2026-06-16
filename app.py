from datetime import datetime
from dash import Dash, dcc, html, Input, Output, State, no_update
import dash_bootstrap_components as dbc
from flask import Flask, session as flask_session
import logging

from config import Config
from app.models import (
    get_session, User, UserRole, verify_user_credentials, init_default_users,
)
from app.dashboards.management_dashboard import build_management_layout, register_management_callbacks
from app.dashboards.executor_dashboard import build_executor_layout, register_executor_callbacks

logger = logging.getLogger(__name__)


server = Flask(__name__)
server.secret_key = Config.SECRET_KEY


def _build_login_layout():
    return dbc.Container([
        html.Br(), html.Br(), html.Br(),
        dbc.Row([
            dbc.Col(width=4),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H4("处方审核趋势看板 - 登录", className="text-center text-primary")),
                    dbc.CardBody([
                        html.Div(id="login-error", className="text-danger mb-3"),
                        dbc.Label("用户名"),
                        dbc.Input(id="login-username", placeholder="请输入用户名", type="text", className="mb-3"),
                        dbc.Label("密码"),
                        dbc.Input(id="login-password", placeholder="请输入密码", type="password", className="mb-3"),
                        dbc.Button("登录", id="login-btn", color="primary", n_clicks=0, className="w-100"),
                        html.Hr(),
                        html.P([
                            "测试账号：",
                            html.Br(),
                            "管理层: admin / admin123",
                            html.Br(),
                            "执行角色: worker / worker123",
                            html.Br(),
                            "药师: pharmacist / pharm123",
                        ], className="text-muted small text-center"),
                    ]),
                ]),
            ], width=4),
        ]),
    ], fluid=True)


def _get_current_user():
    user_id = flask_session.get("user_id")
    if not user_id:
        return None
    sess = get_session()
    try:
        return sess.query(User).filter(User.id == user_id).first()
    finally:
        sess.close()


def _build_navbar(user: User) -> dbc.NavbarSimple:
    return dbc.NavbarSimple([
        dbc.NavItem(dbc.NavLink(f"{user.full_name} ({user.role.value})", href="#")),
        dbc.DropdownMenu([
            dbc.DropdownMenuItem("退出登录", id="logout-btn", n_clicks=0),
        ], nav=True, in_navbar=True, label="账户"),
    ], brand="药店连锁处方审核趋势看板", brand_href="#", color="primary", dark=True, fluid=True)


def create_app() -> Dash:
    app = Dash(
        __name__,
        server=server,
        suppress_callback_exceptions=True,
        external_stylesheets=[dbc.themes.FLATLY],
        title="药店连锁处方审核趋势看板",
    )

    # ================================================================
    # 【启动阶段一次性注册全部回调】
    # 注册顺序：先注册两套看板回调，再注册路由/登录/登出回调
    # 这样登录后切换到任意角色的布局，交互都能真实触发更新
    # ================================================================
    register_management_callbacks(app)
    register_executor_callbacks(app)

    app.layout = html.Div([
        dcc.Location(id="url", refresh=False),
        html.Div(id="page-content"),
        dcc.Store(id="user-store"),
    ])

    # -------- 路由回调：根据登录状态渲染不同页面 --------
    @app.callback(
        [Output("page-content", "children"), Output("user-store", "data")],
        [Input("url", "pathname")],
    )
    def display_page(pathname):
        try:
            user = _get_current_user()
            if not user:
                return _build_login_layout(), {"user_id": None, "role": None, "name": None}

            user_info = {"user_id": user.id, "role": user.role.value, "name": user.full_name}
            nav = _build_navbar(user)

            if user.role in [UserRole.MANAGEMENT, UserRole.PHARMACIST]:
                content = build_management_layout()
            elif user.role == UserRole.EXECUTOR:
                content = build_executor_layout()
            else:
                content = html.Div("无权访问", className="text-danger p-5")

            return html.Div([nav, content]), user_info
        except Exception as e:
            logger.exception("display_page 路由失败")
            return html.Div([
                _build_login_layout(),
                dbc.Alert(f"页面加载异常: {str(e)}", color="danger", className="mt-3"),
            ]), {"user_id": None, "role": None, "name": None}

    # -------- 登录回调 --------
    @app.callback(
        [Output("url", "pathname"), Output("login-error", "children")],
        [Input("login-btn", "n_clicks")],
        [State("login-username", "value"), State("login-password", "value")],
        prevent_initial_call=True,
    )
    def do_login(n_clicks, username, password):
        try:
            if not username or not password:
                return no_update, "请输入用户名和密码"

            user = verify_user_credentials(username, password)
            if not user:
                return no_update, "用户名或密码错误"

            flask_session["user_id"] = user.id
            flask_session["username"] = user.username

            sess = get_session()
            try:
                u = sess.query(User).filter(User.id == user.id).first()
                if u:
                    u.last_login = datetime.utcnow()
                    sess.commit()
            finally:
                sess.close()

            return "/dashboard", ""
        except Exception as e:
            logger.exception("登录异常")
            return no_update, f"登录失败: {str(e)}"

    # -------- 登出回调（组件在已登录时才渲染，依靠 suppress_callback_exceptions） --------
    @app.callback(
        Output("url", "pathname", allow_duplicate=True),
        [Input("logout-btn", "n_clicks")],
        prevent_initial_call=True,
    )
    def do_logout(n_clicks):
        try:
            flask_session.clear()
            return "/login"
        except Exception as e:
            logger.exception("登出异常")
            return "/login"

    return app


if __name__ == "__main__":
    from app.models import Base, engine

    Base.metadata.create_all(bind=engine)
    init_default_users()

    app = create_app()
    app.run_server(debug=Config.DEBUG, host="0.0.0.0", port=8050)
