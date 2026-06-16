import os
import hashlib
from dash import Dash, dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
from flask import Flask, request, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from app.models import get_session, User, UserRole
from app.dashboards.management_dashboard import build_management_layout, build_management_callbacks
from app.dashboards.executor_dashboard import build_executor_layout, build_executor_callbacks


server = Flask(__name__)
server.secret_key = Config.SECRET_KEY


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _verify_password(password: str, hashed: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed


def create_app() -> Dash:
    app = Dash(
        __name__,
        server=server,
        suppress_callback_exceptions=True,
        external_stylesheets=[dbc.themes.FLATLY],
        title="药店连锁处方审核趋势看板",
    )

    def _get_current_user():
        user_id = session.get("user_id")
        if not user_id:
            return None
        sess = get_session()
        try:
            return sess.query(User).filter(User.id == user_id).first()
        finally:
            sess.close()

    login_layout = dbc.Container([
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

    app.layout = html.Div([
        dcc.Location(id="url", refresh=False),
        html.Div(id="page-content"),
        dcc.Store(id="user-store"),
    ])

    @app.callback(
        [Output("page-content", "children"), Output("user-store", "data")],
        [Input("url", "pathname")],
    )
    def display_page(pathname):
        user = _get_current_user()
        if not user:
            return login_layout, {"user_id": None, "role": None}

        user_info = {"user_id": user.id, "role": user.role.value, "name": user.full_name}

        nav = dbc.NavbarSimple([
            dbc.NavItem(dbc.NavLink(f"{user.full_name} ({user.role.value})", href="#")),
            dbc.DropdownMenu([
                dbc.DropdownMenuItem("退出登录", id="logout-btn", n_clicks=0),
            ], nav=True, in_navbar=True, label="账户"),
        ], brand="药店连锁处方审核趋势看板", brand_href="#", color="primary", dark=True, fluid=True)

        if user.role in [UserRole.MANAGEMENT, UserRole.PHARMACIST]:
            content = build_management_layout()
            build_management_callbacks(app)
        elif user.role == UserRole.EXECUTOR:
            content = build_executor_layout(user.id)
            build_executor_callbacks(app, user.id)
        else:
            content = html.Div("无权访问", className="text-danger p-5")

        full_layout = html.Div([nav, content])
        return full_layout, user_info

    @app.callback(
        Output("login-error", "children"),
        [Input("login-btn", "n_clicks")],
        [State("login-username", "value"), State("login-password", "value")],
        prevent_initial_call=True,
    )
    def do_login(n_clicks, username, password):
        if not username or not password:
            return "请输入用户名和密码"

        sess = get_session()
        try:
            user = sess.query(User).filter(User.username == username, User.is_active == True).first()
            if not user:
                return "用户不存在"
            if not _verify_password(password, user.password_hash):
                return "密码错误"

            session["user_id"] = user.id
            session["username"] = user.username
            user.last_login = __import__("datetime").datetime.utcnow()
            sess.commit()
            return dcc.Location(pathname="/dashboard", id="login-redirect")
        finally:
            sess.close()

    @app.callback(
        Output("url", "pathname"),
        [Input("logout-btn", "n_clicks")],
        prevent_initial_call=True,
    )
    def do_logout(n_clicks):
        session.clear()
        return "/login"

    return app


def init_default_users():
    sess = get_session()
    try:
        default_users = [
            {"username": "admin", "password": "admin123", "full_name": "系统管理员", "role": UserRole.MANAGEMENT},
            {"username": "worker", "password": "worker123", "full_name": "回访专员", "role": UserRole.EXECUTOR},
            {"username": "pharmacist", "password": "pharm123", "full_name": "执业药师", "role": UserRole.PHARMACIST},
        ]
        for u in default_users:
            existing = sess.query(User).filter(User.username == u["username"]).first()
            if not existing:
                user = User(
                    username=u["username"],
                    password_hash=_hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True,
                )
                sess.add(user)
        sess.commit()
    finally:
        sess.close()


if __name__ == "__main__":
    from app.models import Base, engine
    Base.metadata.create_all(bind=engine)
    init_default_users()

    app = create_app()
    app.run_server(debug=Config.DEBUG, host="0.0.0.0", port=8050)
