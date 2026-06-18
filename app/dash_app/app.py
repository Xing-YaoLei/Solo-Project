from dash import Dash, html, dcc, callback, Input, Output, State, dash_table, no_update, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime
import base64
import os
from pathlib import Path

from config import Config
from app.database import init_db
from app.auth import (
    create_default_users, authenticate, has_view_permission,
    can_view_amount, RoleEnum, create_shared_view, validate_shared_view
)
from app.data.queries import (
    get_last_refresh_time, get_project_funnel, get_refresh_history,
    get_payment_cycle_data
)
from app.tasks.refresh_tasks import full_refresh_task
from app.tasks.import_tasks import import_design_export_task
from app.tasks.photo_tasks import process_photo_task
from app.exporter import export_full_report, export_single_sheet
from app.dash_app.components.layout import (
    build_navbar, build_footer, build_permission_banner, get_nav_items
)
from app.dash_app.components.funnel import create_funnel_chart, create_funnel_summary_cards
from app.dash_app.components.reconciliation import (
    create_reconciliation_trend_chart, create_category_diff_bar,
    create_reconciliation_datatable
)
from app.dash_app.components.attachments import (
    create_attachment_type_chart, create_attachment_legend_cards,
    create_attachment_detail_table
)
from app.dash_app.components.documents import (
    create_document_detail_view
)
from app.dash_app.components.approvals import (
    create_approval_abnormal_chart, create_timeline_chart,
    create_approval_abnormal_table, create_abnormal_summary_cards
)


CURRENT_USER = {
    "username": "admin",
    "role": RoleEnum.ADMIN,
    "full_name": "系统管理员"
}

RUNNING_TASK_ID = None


def create_dash_app():
    Config.ensure_dirs()
    init_db()
    create_default_users()

    external_stylesheets = [
        dbc.themes.FLATLY,
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css",
    ]
    app = Dash(
        __name__,
        external_stylesheets=external_stylesheets,
        suppress_callback_exceptions=True,
        title="家装量房报价漏斗报表",
        update_title="加载中...",
    )

    app.layout = html.Div([
        dcc.Store(id="session-store", data={
            "username": CURRENT_USER["username"],
            "role": CURRENT_USER["role"].value,
            "full_name": CURRENT_USER["full_name"],
            "task_id": None
        }),
        dcc.Store(id="recon-data-store"),
        dcc.Store(id="attachment-data-store"),
        dcc.Store(id="approval-data-store"),
        dcc.Interval(id="refresh-poll", interval=5000, n_intervals=0),
        dcc.Interval(id="fast-poll", interval=2000, max_intervals=0),

        html.Div(id="login-view", children=build_login_view()),
        html.Div(id="main-app-view", style={"display": "none"}, children=build_main_app_view()),

        html.Div(id="toast-container"),
        html.Div(id="modal-container"),
        dcc.Download(id="download-report"),
        dcc.Upload(id="hidden-upload", style={"display": "none"}),
    ])

    register_callbacks(app)
    return app


def build_login_view():
    return dbc.Container([
        html.Br(), html.Br(), html.Br(),
        dbc.Row([
            dbc.Col(
                dbc.Card(
                    dbc.CardBody([
                        html.H2("🏗️ 家装量房报价漏斗报表", className="text-center mb-4",
                                style={"color": "#1F4E79"}),
                        html.Hr(),
                        dbc.Row([
                            dbc.Label("用户名", width=3),
                            dbc.Col(
                                dbc.Input(id="login-username", type="text", value="admin",
                                          placeholder="输入用户名"),
                                width=9, className="mb-3"
                            ),
                        ]),
                        dbc.Row([
                            dbc.Label("密码", width=3),
                            dbc.Col(
                                dbc.Input(id="login-password", type="password", value="admin123",
                                          placeholder="输入密码"),
                                width=9, className="mb-3"
                            ),
                        ]),
                        dbc.Row([
                            dbc.Col(width=3),
                            dbc.Col(
                                dbc.Button("登录", id="btn-login", color="primary", n_clicks=0,
                                           size="lg", className="w-100"),
                                width=9
                            ),
                        ], className="mt-2"),
                        html.Hr(),
                        html.Div([
                            html.Small("默认账号（开发环境）：", className="text-muted"),
                            html.Br(),
                            html.Small("• admin / admin123 (管理员，全权限)", className="text-muted"),
                            html.Br(),
                            html.Small("• finance / finance123 (财务，可见金额)", className="text-muted"),
                            html.Br(),
                            html.Small("• viewer / viewer123 (只读，金额脱敏)", className="text-muted"),
                        ], className="text-center small"),
                    ]),
                    className="shadow-lg",
                    style={"maxWidth": "520px"}
                ),
                width={"size": 8, "offset": 2},
                lg={"size": 6, "offset": 3},
            )
        ]),
        html.Div(id="login-error", className="text-center text-danger mt-3 fw-bold"),
    ], fluid=True, className="bg-light min-vh-100")


def build_main_app_view():
    user_role = CURRENT_USER["role"]
    username = CURRENT_USER["full_name"]
    last_refresh = get_last_refresh_time()

    funnel_df = get_project_funnel()

    sections = []

    nav = dbc.Row(dbc.Col(get_nav_items(user_role)))
    sections.append(nav)

    if build_permission_banner(user_role):
        sections.append(build_permission_banner(user_role))

    if has_view_permission(user_role, "funnel"):
        cards = create_funnel_summary_cards(funnel_df, user_role)
        if cards:
            sections.append(html.Section(id="funnel-section", children=[
                html.H3("🏠 漏斗概览", className="mb-3",
                        style={"borderBottom": "3px solid #2E75B6", "paddingBottom": "8px",
                               "color": "#1F4E79"}),
                dbc.Row(cards),
                dbc.Row(dbc.Col(dcc.Graph(id="funnel-chart", figure=create_funnel_chart(user_role)))),
            ], className="mb-5"))

    if has_view_permission(user_role, "reconciliation"):
        recon_fig, recon_df = create_reconciliation_trend_chart(6, user_role)
        sections.append(html.Section(id="recon-section", children=[
                html.H3("📊 对账差异趋势", className="mb-3",
                        style={"borderBottom": "3px solid #2E75B6", "paddingBottom": "8px",
                               "color": "#1F4E79"}),
                dbc.Row([
                    dbc.Col([
                        dbc.Label("查看月份范围："),
                        dcc.Slider(id="recon-months-slider", min=1, max=24, step=1, value=6,
                                   marks={m: f"{m}月" for m in [3, 6, 12, 18, 24]})
                    ], width=8),
                ], className="mb-3"),
                dbc.Row(dbc.Col(dcc.Graph(id="recon-trend-chart", figure=recon_fig))),
                dbc.Row(dbc.Col(dcc.Graph(id="recon-cat-chart", figure=create_category_diff_bar(6)))),
                html.H5("📋 对账差异明细", className="mt-4 mb-2"),
                create_reconciliation_datatable(recon_df, user_role),
            ], className="mb-5"))

    if has_view_permission(user_role, "contract_attachment"):
        attach_fig, attach_df = create_attachment_type_chart()
        legend_cards = create_attachment_legend_cards(attach_df)
        sections.append(html.Section(id="attach-section", children=[
                html.H3("📎 合同附件构成", className="mb-3",
                        style={"borderBottom": "3px solid #2E75B6", "paddingBottom": "8px",
                               "color": "#1F4E79"}),
                dbc.Row(legend_cards),
                dbc.Row(dbc.Col(dcc.Graph(id="attach-chart", figure=attach_fig))),
                html.H5("📑 合同附件明细", className="mt-4 mb-2"),
                create_attachment_detail_table(attach_df),
            ], className="mb-5"))

    if has_view_permission(user_role, "document_detail"):
        doc_df, doc_cards, doc_table = create_document_detail_view("quotation", None, user_role)
        sections.append(html.Section(id="doc-section", children=[
                html.H3("📝 单据明细（可追溯报价/采购来源）", className="mb-3",
                        style={"borderBottom": "3px solid #2E75B6", "paddingBottom": "8px",
                               "color": "#1F4E79"}),
                dbc.Row([
                    dbc.Col([
                        dbc.Label("单据类型："),
                        dcc.RadioItems(
                            id="doc-type-switch",
                            options=[
                                {"label": " 报价单明细", "value": "quotation"},
                                {"label": " 采购单明细", "value": "purchase"},
                            ],
                            value="quotation",
                            inline=True,
                            inputStyle={"marginRight": "5px", "marginLeft": "10px"}
                        ),
                    ], width=6),
                ], className="mb-3"),
                dbc.Row(id="doc-summary-cards", children=doc_cards),
                doc_table,
                html.Div(id="doc-trace-note", className="mt-2 text-muted small", children=[
                    "📌 说明：采购单中的「报价关联」字段可追溯对应报价单条目，用于对账差异分析。"
                ]),
            ], className="mb-5"))

    if has_view_permission(user_role, "approval_abnormal"):
        appr_fig, appr_df = create_approval_abnormal_chart()
        summary_cards = create_abnormal_summary_cards(appr_df)
        timeline_fig = create_timeline_chart(appr_df)
        sections.append(html.Section(id="approval-section", children=[
                html.H3("⚖️ 审批节点异常标注", className="mb-3",
                        style={"borderBottom": "3px solid #C00000", "paddingBottom": "8px",
                               "color": "#C00000"}),
                dbc.Row(summary_cards),
                dbc.Row([
                    dbc.Col(dcc.Graph(id="approval-chart", figure=appr_fig), md=6),
                    dbc.Col(dcc.Graph(id="approval-timeline", figure=timeline_fig), md=6),
                ]),
                html.H5("⚠️ 审批异常明细（红色=异常）", className="mt-4 mb-2"),
                create_approval_abnormal_table(appr_df),
                html.Div(className="mt-2 mb-3", children=[
                    dbc.Badge("异常判定规则：", color="danger", className="me-2"),
                    html.Small("1) 审批超期望时效；2) 审批被驳回；3) 待审批超7天"),
                ]),
            ], className="mb-5"))

    if has_view_permission(user_role, "payment_cycle"):
        pay_df = get_payment_cycle_data()
        pay_fig = _build_payment_cycle_chart(pay_df, user_role)
        sections.append(html.Section(id="payment-section", children=[
                html.H3("💰 回款周期分析", className="mb-3",
                        style={"borderBottom": "3px solid #2E75B6", "paddingBottom": "8px",
                               "color": "#1F4E79"}),
                dbc.Alert(
                    "【回款周期口径】回款周期 = 实际回款日期 - 合同签订日期；"
                    "逾期天数 = 实际回款日期 - 计划回款日期。详见导出文件「回款周期口径」工作表。",
                    color="info", is_open=True, dismissable=True
                ),
                dbc.Row(dbc.Col(dcc.Graph(id="payment-chart", figure=pay_fig))),
            ], className="mb-5"))

    return html.Div([
        html.Div(id="nav-placeholder"),
        dbc.Container(sections, fluid=True, style={"maxWidth": "1600px"}),
        build_footer(),
    ])


def _build_payment_cycle_chart(df: pd.DataFrame, user_role):
    show_amount = can_view_amount(user_role)
    if df.empty:
        return go.Figure().update_layout(title="暂无回款数据", height=420)

    stage_order = ["定金", "开工款", "进度款", "竣工款", "质保金"]
    existing_stages = [s for s in stage_order if s in df["回款阶段"].unique()]
    other_stages = [s for s in df["回款阶段"].unique() if s not in stage_order and s]
    all_stages = existing_stages + other_stages

    stats = df.groupby("回款阶段").agg(
        笔数=("项目编号", "count"),
        平均周期=("回款周期(天)", lambda x: round(x.dropna().mean(), 1) if x.dropna().any() else 0),
        平均逾期=("逾期天数", lambda x: round(x.dropna().mean(), 1) if x.dropna().any() else 0),
        计划总额=("计划回款金额", "sum"),
        实际总额=("实际回款金额", "sum"),
    ).reindex(all_stages).reset_index()

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=stats["回款阶段"],
        y=stats["平均周期"],
        name="平均回款周期(天)",
        marker_color="#2E75B6",
        text=[f"{v:.0f}天" if v > 0 else "无数据" for v in stats["平均周期"]],
        textposition="outside"
    ))
    fig.add_trace(go.Scatter(
        x=stats["回款阶段"],
        y=stats["平均逾期"],
        name="平均逾期(天)",
        mode="lines+markers",
        yaxis="y2",
        line=dict(color="#C00000", width=3),
        marker=dict(size=12, color="#C00000"),
        text=[f"{v:.0f}天" for v in stats["平均逾期"]],
        textposition="top center"
    ))

    if show_amount:
        for i, row in stats.iterrows():
            fig.add_annotation(
                x=i, y=row["平均周期"],
                xref="x", yref="y",
                text=f"实￥{row['实际总额']/10000:.0f}万",
                showarrow=False,
                yshift=30,
                font=dict(size=9, color="#70AD47")
            )

    fig.update_layout(
        title=dict(text="⏱️ 各回款阶段平均周期与逾期分析",
                   font=dict(size=15, color="#1F4E79", family="微软雅黑"), x=0.5),
        height=420,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=60, r=60, t=100, b=40),
        paper_bgcolor="#FAFAFA", plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        yaxis=dict(title="平均回款周期（天）", gridcolor="#E0E0E0"),
        yaxis2=dict(title="平均逾期（天）", overlaying="y", side="right",
                    gridcolor="rgba(192,0,0,0.1)"),
    )
    return fig


def register_callbacks(app: Dash):

    @app.callback(
        Output("login-error", "children"),
        Output("session-store", "data"),
        Output("login-view", "style"),
        Output("main-app-view", "style"),
        Output("nav-placeholder", "children"),
        Input("btn-login", "n_clicks"),
        State("login-username", "value"),
        State("login-password", "value"),
        State("session-store", "data"),
        prevent_initial_call=False
    )
    def do_login(n_clicks, username, password, session):
        triggered = ctx.triggered_id
        if triggered != "btn-login" and session and session.get("role"):
            role = RoleEnum(session["role"])
            user_full = session.get("full_name", session["username"])
            nav = build_navbar(role, user_full, get_last_refresh_time(), False)
            return "", session, {"display": "none"}, {"display": "block"}, nav

        if not n_clicks:
            return no_update, no_update, no_update, no_update, no_update

        if not username or not password:
            return "请输入用户名和密码", no_update, no_update, no_update, no_update

        user = authenticate(username.strip(), password)
        if not user:
            return "❌ 用户名或密码错误", no_update, no_update, no_update, no_update

        CURRENT_USER["username"] = user.username
        CURRENT_USER["role"] = user.role
        CURRENT_USER["full_name"] = user.full_name

        session = {
            "username": user.username,
            "role": user.role.value,
            "full_name": user.full_name,
            "task_id": None
        }
        nav = build_navbar(user.role, user.full_name, get_last_refresh_time(), False)
        return "", session, {"display": "none"}, {"display": "block"}, nav


    @app.callback(
        Output("toast-container", "children", allow_duplicate=True),
        Output("session-store", "data", allow_duplicate=True),
        Output("fast-poll", "max_intervals"),
        Input("btn-refresh", "n_clicks"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def trigger_refresh(n_clicks, session):
        global RUNNING_TASK_ID
        if not n_clicks:
            return no_update, no_update, 0
        user_role = RoleEnum(session["role"]) if session and session.get("role") else None
        if not has_view_permission(user_role, "refresh"):
            return dbc.Toast("无刷新权限", header="权限不足", icon="danger", duration=4000), no_update, 0

        task = full_refresh_task.delay()
        RUNNING_TASK_ID = task.id
        session["task_id"] = task.id
        toast = dbc.Toast(
            f"已发起全量刷新任务（任务ID: {task.id[:8]}...），请稍候...",
            header="刷新任务已启动", icon="info", duration=5000, dismissable=True
        )
        return toast, session, 30


    @app.callback(
        Output("nav-placeholder", "children", allow_duplicate=True),
        Output("toast-container", "children", allow_duplicate=True),
        Input("fast-poll", "n_intervals"),
        Input("refresh-poll", "n_intervals"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def poll_refresh(n1, n2, session):
        global RUNNING_TASK_ID
        user_role = RoleEnum(session["role"]) if session and session.get("role") else RoleEnum.VIEWER
        user_full = session.get("full_name", "") if session else ""

        running = False
        task_id = session.get("task_id") if session else None

        if task_id:
            try:
                from celery.result import AsyncResult
                from app.celery_app import celery_app
                result = AsyncResult(task_id, app=celery_app)
                if result.state in ("SUCCESS", "FAILURE"):
                    RUNNING_TASK_ID = None
                    toast = dbc.Toast(
                        f"刷新完成！共处理{result.result.get('records_processed', '?') if result.state == 'SUCCESS' else 0}条记录"
                        if result.state == "SUCCESS" else f"刷新失败：{result.result}",
                        header="刷新完成", icon="success" if result.state == "SUCCESS" else "danger",
                        duration=5000, dismissable=True
                    )
                    return (build_navbar(user_role, user_full, get_last_refresh_time(), False),
                            toast)
                else:
                    running = True
            except Exception:
                pass

        return build_navbar(user_role, user_full, get_last_refresh_time(), running), no_update


    @app.callback(
        Output("recon-trend-chart", "figure"),
        Output("recon-cat-chart", "figure"),
        Output("recon-detail-table", "data"),
        Input("recon-months-slider", "value"),
        State("session-store", "data"),
    )
    def update_recon(months, session):
        user_role = RoleEnum(session["role"]) if session and session.get("role") else None
        fig, df = create_reconciliation_trend_chart(months or 6, user_role)
        cat_fig = create_category_diff_bar(months or 6)
        table = create_reconciliation_datatable(df, user_role)
        return fig, cat_fig, table.data


    @app.callback(
        Output("doc-summary-cards", "children"),
        Output("doc-detail-table", "columns"),
        Output("doc-detail-table", "data"),
        Input("doc-type-switch", "value"),
        State("session-store", "data"),
    )
    def update_doc_view(doc_type, session):
        user_role = RoleEnum(session["role"]) if session and session.get("role") else None
        df, cards, table = create_document_detail_view(doc_type or "quotation", None, user_role)
        return cards, table.columns, table.data


    @app.callback(
        Output("download-report", "data"),
        Output("toast-container", "children", allow_duplicate=True),
        Input("btn-export-full", "n_clicks"),
        Input("btn-export-summary", "n_clicks"),
        Input("btn-export-current", "n_clicks"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def handle_export(n_full, n_sum, n_cur, session):
        triggered = ctx.triggered_id
        if not triggered:
            return no_update, no_update

        user_role = RoleEnum(session["role"]) if session and session.get("role") else None
        if not has_view_permission(user_role, "export"):
            return no_update, dbc.Toast("无导出权限", header="权限不足", icon="danger", duration=4000)

        try:
            if triggered == "btn-export-full":
                filepath = export_full_report()
                with open(filepath, "rb") as f:
                    data = f.read()
                download = dcc.send_bytes(data, filename=Path(filepath).name)
                toast = dbc.Toast(
                    f"完整报表已导出：{Path(filepath).name}",
                    header="导出成功", icon="success", duration=5000
                )
                return download, toast
            else:
                return no_update, dbc.Toast("请使用完整导出功能", header="提示", icon="info", duration=3000)
        except Exception as e:
            return no_update, dbc.Toast(f"导出失败：{str(e)}", header="错误", icon="danger", duration=6000)


    @app.callback(
        Output("modal-container", "children", allow_duplicate=True),
        Input("btn-share-view", "n_clicks"),
        Input("btn-import-design", "n_clicks"),
        Input("btn-import-purchase", "n_clicks"),
        Input("btn-import-photo", "n_clicks"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def open_modals(n_share, n_design, n_purchase, n_photo, session):
        triggered = ctx.triggered_id
        if not triggered:
            return no_update

        user_role = RoleEnum(session["role"]) if session and session.get("role") else None

        if triggered == "btn-share-view":
            if not has_view_permission(user_role, "share_view"):
                return dbc.Toast("无分享权限", header="权限不足", icon="danger", duration=4000)

            return dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle("🔗 创建分享视图")),
                dbc.ModalBody([
                    dbc.Row([
                        dbc.Label("视图名称", width=3),
                        dbc.Col(
                            dbc.Input(id="share-name", placeholder="例如：本周漏斗周报", value="量房报价漏斗分享"),
                            width=9, className="mb-3"
                        ),
                    ]),
                    dbc.Row([
                        dbc.Label("允许角色", width=3),
                        dbc.Col([
                            dcc.Checklist(
                                id="share-roles",
                                options=[
                                    {"label": r.value, "value": r.value}
                                    for r in [RoleEnum.MANAGER, RoleEnum.FINANCE, RoleEnum.SALES,
                                              RoleEnum.DESIGNER, RoleEnum.SUPERVISOR, RoleEnum.VIEWER]
                                ],
                                value=[RoleEnum.VIEWER.value, RoleEnum.SALES.value],
                                inputStyle={"marginRight": "5px", "marginLeft": "5px"},
                                labelStyle={"display": "inline-block", "marginRight": "15px"}
                            )
                        ], width=9, className="mb-3"),
                    ]),
                    dbc.Row([
                        dbc.Label("有效期(天)", width=3),
                        dbc.Col(
                            dbc.Input(id="share-expiry", type="number", value=7, min=1, max=365),
                            width=9, className="mb-3"
                        ),
                    ]),
                    dbc.Alert(
                        "🛡️ 安全机制：分享视图严格受角色权限约束，未授权角色即使获取链接也无法查看金额等敏感字段。",
                        color="warning"
                    ),
                ]),
                dbc.ModalFooter([
                    dbc.Button("取消", id="share-cancel", color="secondary"),
                    dbc.Button("生成分享链接", id="share-create", color="primary", n_clicks=0),
                ])
            ], id="share-modal", is_open=True, size="lg")

        elif triggered == "btn-import-design":
            return _build_import_modal("设计软件导出导入", "design",
                                       "支持 JSON / Excel / CSV 格式，导入后将自动生成对应报价单。",
                                       ["设计软件导出 (JSON, CSV, XLSX)", ".json", ".csv", ".xlsx", ".xls"])
        elif triggered == "btn-import-purchase":
            return _build_import_modal("采购单导入", "purchase",
                                       "支持 Excel / CSV 采购单明细，用于对账差异追溯。",
                                       ["采购单文件", ".xlsx", ".xls", ".csv"])
        elif triggered == "btn-import-photo":
            return _build_import_modal("监理照片上传", "photo",
                                       "支持 JPG / PNG 格式，将自动解析拍摄时间、照片类别并生成缩略图。",
                                       ["图片文件", ".jpg", ".jpeg", ".png"])

        return no_update


    @app.callback(
        Output("share-modal", "is_open", allow_duplicate=True),
        Output("toast-container", "children", allow_duplicate=True),
        Input("share-create", "n_clicks"),
        Input("share-cancel", "n_clicks"),
        State("share-name", "value"),
        State("share-roles", "value"),
        State("share-expiry", "value"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def handle_share_create(n_create, n_cancel, name, roles, expiry, session):
        triggered = ctx.triggered_id
        if triggered == "share-cancel":
            return False, no_update
        if triggered != "share-create" or not n_create:
            return no_update, no_update

        user_id = 1
        shared = create_shared_view(
            view_name=name or "未命名视图",
            view_config={"type": "dashboard", "created_at": datetime.now().isoformat()},
            allowed_roles=roles or [RoleEnum.VIEWER.value],
            created_by=user_id,
            expires_days=expiry or 7
        )
        return (False, dbc.Toast([
            html.Div(f"✅ 已创建分享视图：{shared.view_name}"),
            html.Div([
                html.Span("访问码：", className="fw-bold"),
                html.Code(shared.view_code, className="bg-light px-2 py-1 rounded"),
            ], className="mt-2 small"),
            html.Div(f"有效期至：{shared.expires_at.strftime('%Y-%m-%d %H:%M')}",
                     className="mt-1 text-muted small"),
        ], header="分享链接已生成", icon="success", duration=12000))


def _build_import_modal(title: str, import_type: str, desc: str, accept):
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle(f"📥 {title}")),
        dbc.ModalBody([
            html.P(desc, className="text-muted mb-3"),
            dbc.Row([
                dbc.Label("关联项目ID（可选）", width=4),
                dbc.Col(
                    dbc.Input(id=f"import-project-id-{import_type}", type="number", placeholder="不填则创建新项目"),
                    width=8, className="mb-3"
                ),
            ]),
            dcc.Upload(
                id=f"upload-{import_type}",
                children=html.Div([
                    "📂 拖拽文件到此处 或 ",
                    html.A("点击选择文件", className="text-primary fw-bold")
                ]),
                style={
                    'width': '100%', 'height': '120px', 'lineHeight': '120px',
                    'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '10px',
                    'textAlign': 'center', 'margin': '10px 0', 'backgroundColor': '#F5F9FF'
                },
                multiple=False,
                accept=",".join(accept[1:]) if len(accept) > 1 else None
            ),
            html.Div(id=f"upload-info-{import_type}", className="mt-2 small text-muted"),
        ]),
        dbc.ModalFooter([
            dbc.Button("关闭", id=f"import-cancel-{import_type}", color="secondary",
                       **{f"data-type": import_type}),
        ])
    ], id=f"import-modal-{import_type}", is_open=True, size="lg")
