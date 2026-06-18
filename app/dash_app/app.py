from dash import Dash, html, dcc, callback, Input, Output, State, dash_table, no_update, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime
import base64
import uuid
import traceback
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from config import Config
from app.database import init_db, SessionLocal
from app.models import (
    Project, DesignExport, SitePhoto,
    PurchaseOrder, PurchaseItem, RoleEnum
)
from app.auth import (
    create_default_users, authenticate, has_view_permission,
    can_view_amount, RoleEnum, create_shared_view,
    validate_shared_view, check_share_code_valid
)
from app.data.queries import (
    get_last_refresh_time, get_project_funnel, get_refresh_history,
    get_payment_cycle_data, get_project_list
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
    "username": None,
    "role": None,
    "full_name": None
}

CURRENT_SHARE = {
    "active": False,
    "view": None
}

RUNNING_TASK_ID = None


def create_dash_app():
    Config.ensure_dirs()
    try:
        init_db()
        create_default_users()
    except Exception as e:
        print(f"[警告] 数据库初始化失败，首页将以空数据模式启动：{e}")

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
        dcc.Location(id="url-location", refresh=False),
        dcc.Store(id="session-store", data={
            "username": None,
            "role": None,
            "full_name": None,
            "task_id": None,
            "share_code": None,
            "share_view": None,
        }),
        dcc.Store(id="recon-data-store"),
        dcc.Store(id="attachment-data-store"),
        dcc.Store(id="approval-data-store"),
        dcc.Interval(id="refresh-poll", interval=5000, n_intervals=0),
        dcc.Interval(id="fast-poll", interval=2000, max_intervals=0),

        html.Div(id="login-view", children=build_login_view()),
        html.Div(id="main-app-view", style={"display": "none"}, children=build_main_app_view()),

        html.Div(id="share-view-container", style={"display": "none"}),
        html.Div(id="toast-container"),
        html.Div(id="modal-container"),
        html.Div(id="extra-modals"),
        dcc.Download(id="download-report"),
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
                        dbc.Tabs([
                            dbc.Tab(label="账号登录", tab_id="tab-login", children=[
                                html.Br(),
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
                            ]),
                            dbc.Tab(label="分享访问码", tab_id="tab-share", children=[
                                html.Br(),
                                dbc.Alert(
                                    "🔒 分享视图严格受角色权限约束。输入访问码后需使用对应角色登录，"
                                    "未授权角色即使持有访问码也无法查看。",
                                    color="info", is_open=True
                                ),
                                dbc.Row([
                                    dbc.Label("访问码", width=3),
                                    dbc.Col(
                                        dbc.Input(id="share-code-input", type="text",
                                                  placeholder="请输入分享访问码（如：AbCdEf123456）"),
                                        width=7, className="mb-2"
                                    ),
                                    dbc.Col(
                                        dbc.Button("确认", id="btn-share-open", color="success", n_clicks=0),
                                        width=2
                                    ),
                                ], className="mt-2"),
                                dbc.Row([
                                    dbc.Label("说明", width=3),
                                    dbc.Col([
                                        html.Small("1. 输入访问码并点击「确认」，系统仅校验访问码有效性。"),
                                        html.Br(),
                                        html.Small("2. 确认后切换到「账号登录」，使用对应角色登录。"),
                                        html.Br(),
                                        html.Small("3. 登录后系统按真实角色校验权限，授权则打开视图，否则提示角色不匹配。"),
                                    ], width=9, className="text-muted"),
                                ]),
                            ]),
                        ]),
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
                    style={"maxWidth": "560px"}
                ),
                width={"size": 10, "offset": 1},
                lg={"size": 8, "offset": 2},
            )
        ]),
        html.Div(id="login-error", className="text-center text-danger mt-3 fw-bold"),
        html.Div(id="share-open-result", className="text-center mt-3"),
    ], fluid=True, className="bg-light min-vh-100")


def build_main_app_view(share_view_info=None):
    user_role = CURRENT_USER["role"] or RoleEnum.VIEWER
    username = CURRENT_USER["full_name"] or "访客"
    share_active = share_view_info is not None or CURRENT_SHARE.get("active")

    last_refresh = get_last_refresh_time()

    try:
        funnel_df = get_project_funnel()
    except Exception:
        funnel_df = pd.DataFrame(columns=["阶段", "项目数", "报价金额(万)", "转化率", "阶段留存率"])

    sections = []

    nav = dbc.Row(dbc.Col(get_nav_items(user_role)))
    sections.append(nav)

    if share_active:
        info = share_view_info or CURRENT_SHARE.get("view") or {}
        sections.append(dbc.Alert([
            html.I(className="bi bi-share-fill me-2"),
            html.B(f"正在浏览分享视图：「{info.get('name', '未命名分享')}」  "),
            html.Small(f"(访问码：{info.get('code', '')}) ", className="me-3"),
            html.Small("受角色权限控制，金额字段可能已脱敏。", className="text-muted"),
        ], color="info", className="mb-3", dismissable=True))

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
        try:
            recon_fig, recon_df = create_reconciliation_trend_chart(6, user_role)
        except Exception:
            recon_fig = go.Figure().update_layout(title="暂无数据", height=420)
            recon_df = pd.DataFrame()
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
        try:
            attach_fig, attach_df = create_attachment_type_chart()
            legend_cards = create_attachment_legend_cards(attach_df)
        except Exception:
            attach_fig = go.Figure().update_layout(title="暂无数据", height=420)
            attach_df = pd.DataFrame()
            legend_cards = []
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
        try:
            doc_df, doc_cards, doc_table = create_document_detail_view("quotation", None, user_role)
        except Exception:
            doc_df, doc_cards, doc_table = pd.DataFrame(), [], dash_table.DataTable(columns=[], data=[])
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
        try:
            appr_fig, appr_df = create_approval_abnormal_chart()
            summary_cards = create_abnormal_summary_cards(appr_df)
            timeline_fig = create_timeline_chart(appr_df)
        except Exception:
            appr_fig = go.Figure().update_layout(title="暂无数据", height=420)
            appr_df = pd.DataFrame()
            summary_cards = []
            timeline_fig = go.Figure().update_layout(title="暂无数据", height=320)
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
        try:
            pay_df = get_payment_cycle_data()
            pay_fig = _build_payment_cycle_chart(pay_df, user_role)
        except Exception:
            pay_fig = go.Figure().update_layout(title="暂无数据", height=420)
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
    if df is None or df.empty:
        return go.Figure().update_layout(title="暂无回款数据", height=420)

    stage_order = ["定金", "开工款", "进度款", "竣工款", "质保金"]
    existing = [s for s in stage_order if s in df["回款阶段"].unique()]
    others = [s for s in df["回款阶段"].unique() if s not in stage_order and s]
    all_stages = existing + others

    try:
        stats = df.groupby("回款阶段").agg(
            笔数=("项目编号", "count"),
            平均周期=("回款周期(天)", lambda x: round(x.dropna().mean(), 1) if x.dropna().any() else 0),
            平均逾期=("逾期天数", lambda x: round(x.dropna().mean(), 1) if x.dropna().any() else 0),
            计划总额=("计划回款金额", "sum"),
            实际总额=("实际回款金额", "sum"),
        ).reindex(all_stages).reset_index()
    except Exception:
        return go.Figure().update_layout(title="暂无回款数据", height=420)

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
        for i, (_, row) in enumerate(stats.iterrows()):
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


def _decode_upload_contents(contents, filename):
    """解析 base64 上传内容，返回 (bytes_data, safe_filename, file_size)"""
    if not contents:
        return None, "", 0
    parts = contents.split(",", 1)
    if len(parts) != 2:
        return None, "", 0
    try:
        data = base64.b64decode(parts[1])
    except Exception:
        return None, "", 0
    size = len(data)
    suffix = Path(filename).suffix if filename else ""
    safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{suffix}"
    return data, safe_name, size


def _save_bytes_to_dir(data: bytes, sub_dir: str, safe_name: str):
    target_dir = Config.UPLOAD_DIR / sub_dir
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / safe_name
    with open(target, "wb") as f:
        f.write(data)
    return str(target)


def _find_or_create_project(db, project_id, user_id):
    """创建上传时关联的项目（如果没有传 project_id）"""
    if project_id:
        proj = db.query(Project).filter(Project.id == int(project_id)).first()
        if proj:
            return proj
    proj = Project(
        project_no=f"TMP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        project_name="导入数据临时项目（待补全）",
        status="已量房",
        designer_id=user_id
    )
    db.add(proj)
    db.flush()
    return proj


def register_callbacks(app: Dash):

    @app.callback(
        Output("url-location", "search", allow_duplicate=True),
        Input("btn-share-open", "n_clicks"),
        State("share-code-input", "value"),
        prevent_initial_call=True
    )
    def open_share_code_in_url(n_clicks, code):
        if not n_clicks or not code:
            return no_update
        return f"?share={code.strip()}"

    @app.callback(
        Output("session-store", "data", allow_duplicate=True),
        Output("login-error", "children", allow_duplicate=True),
        Output("share-open-result", "children"),
        Output("share-code-input", "value"),
        Output("login-view", "style", allow_duplicate=True),
        Output("main-app-view", "style", allow_duplicate=True),
        Output("nav-placeholder", "children", allow_duplicate=True),
        Output("main-app-view", "children", allow_duplicate=True),
        Input("url-location", "search"),
        State("session-store", "data"),
        prevent_initial_call='initial_duplicate'
    )
    def parse_url_share_code(search, session):
        session = session or {}
        result_info = no_update
        new_code_val = no_update
        err = no_update
        lv_style = no_update
        mv_style = no_update
        nav_children = no_update
        main_children = no_update

        if not search:
            return session, err, result_info, new_code_val, lv_style, mv_style, nav_children, main_children

        try:
            parsed = urlparse(search)
            params = parse_qs(parsed.query)
            code = params.get("share", [None])[0]
        except Exception:
            code = None

        if not code:
            return session, err, result_info, new_code_val, lv_style, mv_style, nav_children, main_children

        code = code.strip()
        CURRENT_SHARE["active"] = False
        CURRENT_SHARE["view"] = None

        if session.get("role"):
            user_role = RoleEnum(session["role"])
            info = validate_shared_view(code, user_role)
            if not info:
                session["share_code"] = code
                session["share_view"] = None
                result_info = dbc.Alert(
                    [html.I(className="bi bi-x-circle-fill me-2"),
                     f"❌ 访问码有效但当前角色（{user_role.value}）无访问权限。",
                     html.Br(),
                     html.Small("此分享视图仅允许角色：" + "、".join(
                         check_share_code_valid(code).get("allowed_roles", []) if check_share_code_valid(code) else []
                     ) + "，请使用对应角色账号重新登录。")],
                    color="danger"
                )
                return session, err, result_info, new_code_val, lv_style, mv_style, nav_children, main_children

            session["share_code"] = code
            session["share_view"] = info
            CURRENT_SHARE["active"] = True
            CURRENT_SHARE["view"] = info

            role = RoleEnum(session["role"])
            user_full = session.get("full_name", session.get("username", "访客"))
            CURRENT_USER["username"] = session.get("username")
            CURRENT_USER["role"] = role
            CURRENT_USER["full_name"] = user_full
            nav_children = build_navbar(role, user_full, get_last_refresh_time(), False)
            main_children = build_main_app_view(info)
            lv_style = {"display": "none"}
            mv_style = {"display": "block"}
            result_info = no_update
        else:
            info = check_share_code_valid(code)
            if not info:
                session["share_code"] = None
                session["share_view"] = None
                result_info = dbc.Alert(
                    [html.I(className="bi bi-x-circle-fill me-2"),
                     "访问码无效或已过期，请检查后重试。"],
                    color="danger"
                )
                return session, err, result_info, new_code_val, lv_style, mv_style, nav_children, main_children

            session["share_code"] = code
            session["share_view"] = None
            allowed = "、".join(info.get("allowed_roles", []))
            result_info = dbc.Alert([
                html.I(className="bi bi-check-circle-fill me-2"),
                html.B(f"✅ 访问码已确认：「{info['name']}」"),
                html.Br(),
                html.Small(f"此视图允许角色：{allowed}", className="me-3"),
                html.Br(),
                html.Small("👉 请切换到「账号登录」标签页，使用对应角色登录后自动打开报表视图。", className="fw-bold"),
            ], color="success")

        return (session, err, result_info, new_code_val,
                lv_style, mv_style, nav_children, main_children)

    @app.callback(
        Output("login-error", "children", allow_duplicate=True),
        Output("session-store", "data", allow_duplicate=True),
        Output("login-view", "style", allow_duplicate=True),
        Output("main-app-view", "style", allow_duplicate=True),
        Output("nav-placeholder", "children", allow_duplicate=True),
        Output("main-app-view", "children", allow_duplicate=True),
        Output("share-open-result", "children", allow_duplicate=True),
        Input("btn-login", "n_clicks"),
        State("login-username", "value"),
        State("login-password", "value"),
        State("session-store", "data"),
        prevent_initial_call='initial_duplicate'
    )
    def do_login(n_clicks, username, password, session):
        triggered = ctx.triggered_id
        session = session or {}

        _no = no_update
        share_result = _no

        if triggered != "btn-login":
            if session and session.get("role"):
                role = RoleEnum(session["role"])
                user_full = session.get("full_name", session["username"])
                CURRENT_USER["username"] = session["username"]
                CURRENT_USER["role"] = role
                CURRENT_USER["full_name"] = user_full
                nav = build_navbar(role, user_full, get_last_refresh_time(), False)
                main = build_main_app_view(session.get("share_view"))
                return "", session, {"display": "none"}, {"display": "block"}, nav, main, _no
            return _no, _no, _no, _no, _no, _no, _no

        if not n_clicks:
            return _no, _no, _no, _no, _no, _no, _no

        if not username or not password:
            return "请输入用户名和密码", _no, _no, _no, _no, _no, _no

        user = authenticate(username.strip(), password)
        if not user:
            return "❌ 用户名或密码错误", _no, _no, _no, _no, _no, _no

        CURRENT_USER["username"] = user.username
        CURRENT_USER["role"] = user.role
        CURRENT_USER["full_name"] = user.full_name

        pending_share_code = session.get("share_code")

        session = {
            "username": user.username,
            "role": user.role.value,
            "full_name": user.full_name,
            "task_id": None,
            "share_code": pending_share_code,
            "share_view": None,
        }

        if pending_share_code:
            info = validate_shared_view(pending_share_code, user.role)
            if info:
                session["share_view"] = info
                CURRENT_SHARE["active"] = True
                CURRENT_SHARE["view"] = info
                nav = build_navbar(user.role, user.full_name, get_last_refresh_time(), False)
                main = build_main_app_view(info)
                return ("", session, {"display": "none"}, {"display": "block"},
                        nav, main, _no)
            else:
                code_info = check_share_code_valid(pending_share_code)
                allowed = "、".join(code_info.get("allowed_roles", [])) if code_info else "未知"
                err_msg = f"❌ 登录成功，但当前角色（{user.role.value}）无权查看此分享视图"
                share_result = dbc.Alert([
                    html.I(className="bi bi-shield-lock-fill me-2"),
                    html.B(err_msg),
                    html.Br(),
                    html.Small(f"此视图仅允许角色：{allowed}。请退出后使用对应角色账号登录。"),
                ], color="warning")
                return (err_msg, session, _no, _no, _no, _no, share_result)

        nav = build_navbar(user.role, user.full_name, get_last_refresh_time(), False)
        main = build_main_app_view(None)
        return ("", session, {"display": "none"}, {"display": "block"},
                nav, main, _no)

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

        try:
            task = full_refresh_task.delay()
            RUNNING_TASK_ID = task.id
            session["task_id"] = task.id
            toast = dbc.Toast(
                f"已发起全量刷新任务（任务ID: {task.id[:8]}...），请稍候...",
                header="刷新任务已启动", icon="info", duration=5000, dismissable=True
            )
            return toast, session, 30
        except Exception as e:
            return dbc.Toast(f"刷新任务启动失败（Celery未运行？）：{e}",
                             header="错误", icon="danger", duration=8000), no_update, 0

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
                    if result.state == "SUCCESS":
                        res = result.result
                        cnt = res.get('records_processed', '?') if isinstance(res, dict) else '?'
                        msg = f"刷新完成！共处理 {cnt} 条记录"
                        icon = "success"
                    else:
                        msg = f"刷新失败：{result.result}"
                        icon = "danger"
                    toast = dbc.Toast(msg, header="刷新完成", icon=icon,
                                      duration=5000, dismissable=True)
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
        try:
            fig, df = create_reconciliation_trend_chart(months or 6, user_role)
        except Exception:
            fig = go.Figure().update_layout(title="暂无数据", height=420)
            df = pd.DataFrame()
        try:
            cat_fig = create_category_diff_bar(months or 6)
        except Exception:
            cat_fig = go.Figure().update_layout(title="暂无数据", height=360)
        try:
            table = create_reconciliation_datatable(df, user_role)
        except Exception:
            table = dash_table.DataTable(columns=[], data=[])
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
        try:
            df, cards, table = create_document_detail_view(doc_type or "quotation", None, user_role)
        except Exception:
            cards, table = [], dash_table.DataTable(columns=[], data=[])
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
                    f"完整报表已导出（含回款周期口径说明）：{Path(filepath).name}",
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
                            dbc.Input(id="share-name", placeholder="例如：本周漏斗周报",
                                      value="量房报价漏斗分享"),
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
                        "🛡️ 安全机制：分享视图严格受角色权限约束，未授权角色即使获取访问码也无法查看金额等敏感字段。",
                        color="warning"
                    ),
                ]),
                dbc.ModalFooter([
                    dbc.Button("取消", id="share-cancel", color="secondary"),
                    dbc.Button("生成分享链接", id="share-create", color="primary", n_clicks=0),
                ])
            ], id="share-modal", is_open=True, size="lg")

        elif triggered == "btn-import-design":
            if not has_view_permission(user_role, "import_data"):
                return dbc.Toast("无导入权限", header="权限不足", icon="danger", duration=4000)
            return _build_import_modal("design",
                "设计软件导出导入",
                "支持 JSON / Excel / CSV 格式。上传后将入库保存，并由 Celery 异步解析，自动生成对应报价单分项明细。",
                [".json", ".csv", ".xlsx", ".xls"]
            )
        elif triggered == "btn-import-purchase":
            if not has_view_permission(user_role, "import_data"):
                return dbc.Toast("无导入权限", header="权限不足", icon="danger", duration=4000)
            return _build_import_modal("purchase",
                "采购单导入",
                "支持 Excel / CSV 格式。上传后将保存文件、入库采购单主档/明细，并可作为对账差异追溯来源。",
                [".xlsx", ".xls", ".csv"]
            )
        elif triggered == "btn-import-photo":
            if not has_view_permission(user_role, "import_data"):
                return dbc.Toast("无导入权限", header="权限不足", icon="danger", duration=4000)
            return _build_import_modal("photo",
                "监理照片上传",
                "支持 JPG / PNG 格式。上传后将保存文件、写入 SitePhoto 表，并由 Celery 异步提取 EXIF 拍摄时间、生成缩略图、智能分类识别。",
                [".jpg", ".jpeg", ".png"],
                multiple=True
            )

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

        try:
            user_id = 1
            shared = create_shared_view(
                view_name=name or "未命名视图",
                view_config={"type": "dashboard", "created_at": datetime.now().isoformat()},
                allowed_roles=roles or [RoleEnum.VIEWER.value],
                created_by=user_id,
                expires_days=expiry or 7
            )
            share_url = f"?share={shared.view_code}"
            return (False,
                    dbc.Toast([
                        html.Div(f"✅ 已创建分享视图：{shared.view_name}"),
                        html.Div([
                            html.Span("访问码：", className="fw-bold"),
                            html.Code(shared.view_code, className="bg-light px-2 py-1 rounded me-3"),
                        ], className="mt-2 small"),
                        html.Div([
                            html.Span("URL 后缀：", className="fw-bold"),
                            html.Code(share_url, className="bg-light px-2 py-1 rounded"),
                        ], className="mt-1 small text-muted"),
                        html.Div(f"有效期至：{shared.expires_at.strftime('%Y-%m-%d %H:%M')}",
                                 className="mt-1 text-muted small"),
                        html.Div("提示：在登录页「分享访问码」粘贴访问码，或在 URL 后加上 ?share=访问码 即可打开。",
                                 className="mt-2 text-muted small"),
                    ], header="分享访问码已生成", icon="success", duration=15000))
        except Exception as e:
            return no_update, dbc.Toast(f"创建失败：{e}", header="错误", icon="danger", duration=6000)

    @app.callback(
        Output("extra-modals", "children"),
        Output("toast-container", "children", allow_duplicate=True),
        Output("import-design-project", "value", allow_duplicate=True),
        Output("import-purchase-project", "value", allow_duplicate=True),
        Output("import-photo-project", "value", allow_duplicate=True),
        Input("import-design-close", "n_clicks"),
        Input("import-purchase-close", "n_clicks"),
        Input("import-photo-close", "n_clicks"),
        Input("upload-design", "contents"),
        Input("upload-purchase", "contents"),
        Input("upload-photo", "contents"),
        State("upload-design", "filename"),
        State("upload-purchase", "filename"),
        State("upload-photo", "filename"),
        State("import-design-project", "value"),
        State("import-purchase-project", "value"),
        State("import-photo-project", "value"),
        State("session-store", "data"),
        prevent_initial_call=True
    )
    def handle_imports(
        c1, c2, c3,
        u_design_contents, u_purchase_contents, u_photo_contents,
        f_design, f_purchase, f_photo,
        pid_design, pid_purchase, pid_photo,
        session
    ):
        triggered = ctx.triggered_id
        user_role = RoleEnum(session["role"]) if session and session.get("role") else None
        user_id = 1
        if session and session.get("username"):
            try:
                from app.auth import get_user
                u = get_user(session["username"])
                if u:
                    user_id = u.id
            except Exception:
                pass

        toast = no_update
        extra = no_update
        reset_pid = [no_update, no_update, no_update]

        if triggered and triggered.startswith("import-") and triggered.endswith("-close"):
            return None, no_update, pid_design, pid_purchase, pid_photo

        try:
            if triggered == "upload-design" and u_design_contents and f_design:
                db = SessionLocal()
                try:
                    data, safe_name, size = _decode_upload_contents(u_design_contents, f_design)
                    saved_path = _save_bytes_to_dir(data, "design", safe_name)
                    proj = _find_or_create_project(db, pid_design, user_id)

                    export_rec = DesignExport(
                        project_id=proj.id,
                        file_name=f_design,
                        file_path=saved_path,
                        software_name="设计软件导入",
                        export_date=datetime.now().date(),
                        imported_by=user_id,
                    )
                    db.add(export_rec)
                    db.commit()
                    db.refresh(export_rec)

                    try:
                        task = import_design_export_task.delay(
                            saved_path, proj.id, "用户上传", user_id
                        )
                        celery_msg = f"，Celery 已启动解析（任务ID: {task.id[:8]}...）"
                    except Exception as ce:
                        celery_msg = f"（Celery 未启动，仅入库保存：{ce}）"

                    reset_pid[0] = ""
                    toast = dbc.Toast([
                        html.Div(f"✅ 设计文件已入库保存：{f_design} ({size/1024:.1f} KB)"),
                        html.Div(f"关联项目ID: {proj.id}  |  记录ID: {export_rec.id}"),
                        html.Div(celery_msg, className="text-muted small mt-1"),
                    ], header="设计文件上传成功", icon="success", duration=7000, dismissable=True)
                except Exception as e:
                    db.rollback()
                    toast = dbc.Toast(f"设计文件上传失败：{e}", header="错误", icon="danger", duration=8000)
                finally:
                    db.close()

            elif triggered == "upload-purchase" and u_purchase_contents and f_purchase:
                db = SessionLocal()
                try:
                    import pandas as pd
                    from decimal import Decimal
                    data, safe_name, size = _decode_upload_contents(u_purchase_contents, f_purchase)
                    saved_path = _save_bytes_to_dir(data, "purchase", safe_name)
                    proj = _find_or_create_project(db, pid_purchase, user_id)

                    suffix = Path(f_purchase).suffix.lower()
                    items_df = None
                    try:
                        tmp_path = Path(saved_path)
                        if suffix == ".csv":
                            items_df = pd.read_csv(tmp_path)
                        elif suffix in (".xlsx", ".xls"):
                            items_df = pd.read_excel(tmp_path)
                    except Exception:
                        items_df = None

                    po = PurchaseOrder(
                        project_id=proj.id,
                        po_no=f"PO-UP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        supplier="采购单导入-待补全",
                        category="导入",
                        order_date=datetime.now().date(),
                        status="已入库",
                        created_by=user_id,
                    )
                    db.add(po)
                    db.flush()

                    total = Decimal("0")
                    if items_df is not None and len(items_df) > 0:
                        qty_col = next((c for c in items_df.columns if "数量" in str(c) or "qty" in str(c).lower()), None)
                        price_col = next((c for c in items_df.columns if "单价" in str(c) or "price" in str(c).lower()), None)
                        name_col = next((c for c in items_df.columns if "名称" in str(c) or "name" in str(c).lower()), None)
                        for _, row in items_df.iterrows():
                            try:
                                q = float(row.get(qty_col, 0)) if qty_col else 0.0
                                p = float(row.get(price_col, 0)) if price_col else 0.0
                                subtotal = Decimal(str(round(q * p, 2)))
                                total += subtotal
                                db.add(PurchaseItem(
                                    purchase_order_id=po.id,
                                    item_name=str(row.get(name_col, "导入项")) if name_col else "导入项",
                                    unit="项",
                                    quantity=Decimal(str(q)),
                                    unit_price=Decimal(str(p)),
                                    subtotal=subtotal,
                                ))
                            except Exception:
                                continue
                    po.total_amount = total
                    po.actual_amount = total
                    db.commit()
                    db.refresh(po)

                    reset_pid[1] = ""
                    toast = dbc.Toast([
                        html.Div(f"✅ 采购单已入库保存：{f_purchase} ({size/1024:.1f} KB)"),
                        html.Div(f"采购单号: {po.po_no}  |  材料条目数: {0 if items_df is None else len(items_df)}  |  合计: ￥{total:,.2f}"),
                        html.Div("此采购单已自动计入对账差异追溯来源。", className="text-info small mt-1"),
                    ], header="采购单上传成功", icon="success", duration=7000, dismissable=True)
                except Exception as e:
                    db.rollback()
                    toast = dbc.Toast(f"采购单上传失败：{e}", header="错误", icon="danger", duration=8000)
                finally:
                    db.close()

            elif triggered == "upload-photo" and u_photo_contents and f_photo:
                contents_list = u_photo_contents if isinstance(u_photo_contents, list) else [u_photo_contents]
                filenames = f_photo if isinstance(f_photo, list) else [f_photo]

                ok_count = 0
                photo_ids = []
                errors = []
                db = SessionLocal()
                try:
                    proj = _find_or_create_project(db, pid_photo, user_id)

                    for contents, fn in zip(contents_list, filenames):
                        try:
                            data, safe_name, size = _decode_upload_contents(contents, fn)
                            saved_path = _save_bytes_to_dir(data, "photos", safe_name)
                            sp = SitePhoto(
                                project_id=proj.id,
                                photo_type="progress",
                                file_name=fn,
                                file_path=saved_path,
                                file_size=size,
                                uploader_id=user_id,
                                description=f"用户上传 - {fn}",
                            )
                            db.add(sp)
                            db.flush()
                            photo_ids.append(sp.id)
                            ok_count += 1
                        except Exception as e:
                            errors.append(f"{fn}: {e}")
                    db.commit()

                    launched = 0
                    for pid in photo_ids:
                        try:
                            process_photo_task.delay(pid)
                            launched += 1
                        except Exception:
                            pass

                    reset_pid[2] = ""
                    msg_parts = [html.Div(f"✅ 监理照片已入库：{ok_count} 张，关联项目ID: {proj.id}")]
                    if launched:
                        msg_parts.append(
                            html.Div(f"其中 {launched} 张已提交 Celery 异步处理（提取 EXIF / 缩略图 / 分类识别）。",
                                     className="text-info small mt-1")
                        )
                    if errors:
                        msg_parts.append(html.Div("失败：" + "; ".join(errors[:3]),
                                                  className="text-danger small mt-1"))
                    toast = dbc.Toast(msg_parts, header="监理照片上传成功",
                                      icon="success", duration=7000, dismissable=True)
                except Exception as e:
                    db.rollback()
                    toast = dbc.Toast(f"监理照片上传失败：{e}", header="错误", icon="danger", duration=8000)
                finally:
                    db.close()

        except Exception as e:
            toast = dbc.Toast(f"上传处理异常：{e}\n{traceback.format_exc(limit=2)}",
                              header="内部错误", icon="danger", duration=10000)

        return (extra, toast) + tuple(reset_pid)


def _build_import_modal(import_type: str, title: str, desc: str, accept, multiple=False):
    """生成 3 类上传共享 Modal，ID 统一按 import_type 命名"""
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle(f"📥 {title}")),
        dbc.ModalBody([
            html.P(desc, className="text-muted mb-3"),
            dbc.Row([
                dbc.Label("关联项目ID（可选，留空自动创建）", width=5),
                dbc.Col(
                    dbc.Input(id=f"import-{import_type}-project", type="number",
                              placeholder="不填则自动创建临时项目"),
                    width=7, className="mb-3"
                ),
            ]),
            dcc.Upload(
                id=f"upload-{import_type}",
                children=html.Div([
                    "📂 拖拽文件到此处 或 ",
                    html.A("点击选择文件", className="text-primary fw-bold")
                ]),
                style={
                    'width': '100%', 'height': '140px', 'lineHeight': '140px',
                    'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '10px',
                    'textAlign': 'center', 'margin': '10px 0', 'backgroundColor': '#F5F9FF'
                },
                multiple=multiple,
                accept=",".join(accept),
            ),
            html.Div(id=f"upload-info-{import_type}", className="mt-2 small text-muted"),
        ]),
        dbc.ModalFooter([
            dbc.Button("完成", id=f"import-{import_type}-close", color="primary", n_clicks=0),
        ])
    ], id=f"import-modal-{import_type}", is_open=True, size="lg")
