from dash import dcc, html, Input, Output, State, callback, ctx, no_update
import dash_bootstrap_components as dbc

from app.auth import AuthContext


def build_login_layout(error_msg: str = None):
    login_card = dbc.Card(
        dbc.CardBody(className="p-5", children=[
            html.Div([
                html.I(className="bi bi-ticket-perforated-fill text-primary display-4"),
            ], className="text-center mb-4"),
            html.H2("景区运营门票预约漏斗报表", className="text-center mb-2 fw-bold"),
            html.P("请登录后访问数据看板", className="text-center text-muted mb-4"),
            dbc.Alert(
                [html.I(className="bi bi-exclamation-triangle me-2"), error_msg],
                color="danger",
                is_open=bool(error_msg),
                className="mb-3",
                dismissable=True,
            ),
            dbc.Form([
                dbc.Label("用户名", className="fw-bold small text-muted"),
                dbc.Input(
                    id="login-username",
                    type="text",
                    placeholder="请输入用户名",
                    size="lg",
                    class_name="mb-3",
                    autoComplete="off",
                ),
                dbc.Label("密码", className="fw-bold small text-muted"),
                dbc.Input(
                    id="login-password",
                    type="password",
                    placeholder="请输入密码",
                    size="lg",
                    class_name="mb-4",
                ),
                dbc.Button(
                    [html.I(className="bi bi-box-arrow-in-right me-2"), "登 录"],
                    id="login-submit",
                    color="primary",
                    size="lg",
                    className="w-100 mb-3",
                    n_clicks=0,
                ),
                html.Div([
                    html.Small("测试账号：", className="text-muted"),
                    html.Br(),
                    html.Code("admin / admin123 (管理层)"),
                    html.Br(),
                    html.Code("staff / staff123 (一线:主入口区,核心景区A)"),
                ], className="text-center small text-muted bg-light p-3 rounded"),
            ]),
        ]),
        className="shadow-lg border-0 rounded-4",
        style={"maxWidth": "460px", "width": "100%"},
    )

    return dbc.Container(
        fluid=True,
        className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient",
        style={
            "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        children=[
            login_card,
            dcc.Store(id="login-error", data=None),
        ],
    )
