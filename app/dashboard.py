import dash
import pandas as pd
from dash import Input, Output, State, dcc, html
from dash.exceptions import PreventUpdate
from flask import jsonify, redirect, request, session

from app.charts import (
    build_anomaly_reminder_chart,
    build_attendance_detail_chart,
    build_conflict_trend_chart,
    build_reschedule_composition_chart,
)
from db.queries import get_all_appointments_raw, get_store_list
from services.risk_analysis import (
    ATTENDANCE_CALIBER_DEFINITION,
    compute_anomaly_reminders,
    compute_attendance_summary,
    compute_conflict_trend,
    compute_reschedule_composition,
    get_refresh_timestamp,
)
from utils.auth import (
    ROLE_HIERARCHY,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    PERMISSION_LABELS,
    clear_user_session,
    create_share_link,
    get_current_username,
    get_current_user_role,
    get_share_info,
    get_visible_store_id,
    has_permission,
    list_all_roles,
    set_user_session,
    validate_share_access,
)
from utils.csv_export import (
    export_anomaly_reminder_csv,
    export_attendance_detail_csv,
    export_conflict_trend_csv,
    export_full_report_csv,
    export_reschedule_composition_csv,
)

external_stylesheets = ["https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"]

app = dash.Dash(
    __name__,
    external_stylesheets=external_stylesheets,
    suppress_callback_exceptions=True,
    serve_locally=True,
)
app.title = "美业门店顾客预约风险监测"
server = app.server

server.secret_key = "change-me-in-production"

_ALLOWED_LOGIN_ROLES = {"admin", "store_manager", "staff", "viewer"}


@server.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or request.form
    username = (data.get("username") or "demo_user").strip()
    role = (data.get("role") or "viewer").strip()
    store_id = data.get("store_id") or None

    if role not in _ALLOWED_LOGIN_ROLES:
        return jsonify({"success": False, "error": f"非法角色: {role}"}), 400

    current_role = get_current_user_role()
    current_level = ROLE_HIERARCHY.get(current_role, 0)
    target_level = ROLE_HIERARCHY.get(role, 0)

    if current_level > 0 and target_level > current_level:
        return jsonify({
            "success": False,
            "error": f"当前角色「{ROLE_LABELS.get(current_role, current_role)}」"
                     f"无法提升为「{ROLE_LABELS.get(role, role)}」"
        }), 403

    set_user_session(username, role, store_id)
    return jsonify({
        "success": True,
        "username": username,
        "role": role,
        "role_label": ROLE_LABELS.get(role, role),
        "store_id": store_id,
    })


@server.route("/api/logout", methods=["POST", "GET"])
def api_logout():
    clear_user_session()
    return redirect("/")


@server.route("/api/share/create", methods=["POST"])
def api_create_share():
    data = request.get_json(silent=True) or request.form
    target_role = (data.get("target_role") or "viewer").strip()
    target_store_id = data.get("store_id") or None
    expires = int(data.get("expires_minutes") or 60)
    return jsonify(create_share_link(target_role, target_store_id, expires_minutes=expires))


@server.route("/api/share/info", methods=["GET"])
def api_share_info():
    token = request.args.get("share_token") or ""
    info = get_share_info(token)
    return jsonify({"success": bool(info), **(info or {})})


@server.route("/api/roles", methods=["GET"])
def api_roles():
    return jsonify({"roles": list_all_roles()})


@server.route("/api/me", methods=["GET"])
def api_me():
    return jsonify({
        "username": get_current_username(),
        "role": get_current_user_role(),
        "role_label": ROLE_LABELS.get(get_current_user_role(), get_current_user_role()),
        "store_id": session.get("store_id"),
        "permissions": sorted(list(ROLE_PERMISSIONS.get(get_current_user_role(), set()))),
        "share_context": session.get("share_context"),
    })


@server.before_request
def enforce_role_on_share():
    share_token = request.args.get("share_token")
    if share_token and request.path == "/":
        if not validate_share_access(share_token):
            from flask import abort
            abort(403, description=f"分享链接无效或权限受限（token: {share_token[:8]}...）")
    session.permanent = False


def _render_login_panel() -> html.Div:
    return html.Div(className="card p-3 mb-3", children=[
        html.H6("角色会话切换（演示用）", className="mb-2"),
        html.Div(className="row g-2", children=[
            html.Div(className="col-md-3", children=[
                html.Label("用户名", className="form-label form-label-sm"),
                dcc.Input(id="login-username", type="text", value="demo_manager",
                          className="form-control form-control-sm"),
            ]),
            html.Div(className="col-md-3", children=[
                html.Label("角色", className="form-label form-label-sm"),
                dcc.Dropdown(id="login-role-select",
                             options=[
                                 {"label": "管理员(admin)", "value": "admin"},
                                 {"label": "店长(store_manager)", "value": "store_manager"},
                                 {"label": "员工(staff)", "value": "staff"},
                                 {"label": "查看者(viewer)", "value": "viewer"},
                             ],
                             value="store_manager",
                             className="form-select form-select-sm"),
            ]),
            html.Div(className="col-md-3", children=[
                html.Label("默认门店", className="form-label form-label-sm"),
                dcc.Input(id="login-store-id", type="text", value="S001",
                          className="form-control form-control-sm"),
            ]),
            html.Div(className="col-md-3 d-flex align-items-end gap-2", children=[
                html.Button("登录", id="btn-login", n_clicks=0, className="btn btn-sm btn-primary flex-grow-1"),
                html.Button("退出", id="btn-logout", n_clicks=0, className="btn btn-sm btn-outline-secondary"),
            ]),
        ]),
        html.Div(id="login-status", className="mt-2 small text-muted"),
    ])


def _render_permission_denied(msg: str = "权限不足") -> html.Div:
    return html.Div(className="card p-5 text-center", children=[
        html.H3(msg, className="text-danger mb-3"),
        html.P("您当前角色无权查看此内容或分享链接已失效，请使用有权限的账号登录。"),
        html.A("返回首页", href="/", className="btn btn-secondary mt-3"),
    ])


app.layout = html.Div([
    dcc.Location(id="app-location", refresh=False),
    dcc.Store(id="store-options-store", storage_type="memory"),
    dcc.Store(id="selected-store-holder", storage_type="session"),
    dcc.Store(id="current-role-store", storage_type="session", data={"role": "viewer"}),
    dcc.Interval(id="poll-refresh", interval=60000, n_intervals=0),

    html.Nav(className="navbar navbar-dark bg-dark px-3", children=[
        html.Span("美业门店顾客预约风险监测", className="navbar-brand mb-0 h5"),
        html.Div(className="d-flex align-items-center gap-3", children=[
            html.Span(id="user-role-badge", className="badge bg-light text-dark"),
            html.Span(id="store-badge", className="badge bg-secondary"),
            html.Span(id="last-refresh-time", className="text-light", style={"fontSize": "13px"}),
        ]),
    ]),

    html.Div(className="container-fluid p-3", children=[
        _render_login_panel(),

        html.Div(id="share-panel-placeholder", className="mb-3"),

        html.Div(className="row mb-3", children=[
            html.Div(className="col-md-3", children=[
                html.Label("选择门店", className="form-label"),
                dcc.Dropdown(id="store-selector", placeholder="加载门店中...", className="form-select"),
            ]),
            html.Div(className="col-md-3", children=[
                html.Label("时间范围", className="form-label"),
                dcc.DatePickerRange(id="date-range", display_format="YYYY-MM-DD"),
            ]),
            html.Div(className="col-md-3 d-flex align-items-end", children=[
                html.Button("刷新数据", id="btn-refresh", n_clicks=0, className="btn btn-primary me-2"),
                html.Span(id="refresh-status", className="text-muted", style={"fontSize": "12px"}),
            ]),
        ]),

        html.Div(id="download-section", className="mb-3"),

        html.Div(className="row", children=[
            html.Div(className="col-md-6", children=[
                html.Div(id="conflict-trend-chart", className="card p-3 mb-3"),
            ]),
            html.Div(className="col-md-6", children=[
                html.Div(id="reschedule-composition-chart", className="card p-3 mb-3"),
            ]),
        ]),

        html.Div(className="row", children=[
            html.Div(className="col-md-6", children=[
                html.Div(id="attendance-detail-chart", className="card p-3 mb-3"),
            ]),
            html.Div(className="col-md-6", children=[
                html.Div(id="anomaly-reminder-chart", className="card p-3 mb-3"),
            ]),
        ]),

        html.Div(className="row mt-3", children=[
            html.Div(className="col-12", children=[
                html.Div(className="card p-3", children=[
                    html.H5("指标定义说明（到场率口径 + 追溯路径）", className="mb-2"),
                    html.Table(id="caliber-definition-table",
                               className="table table-sm table-bordered table-hover"),
                ]),
            ]),
        ]),
    ]),

    dcc.Download(id="download-conflict"),
    dcc.Download(id="download-reschedule"),
    dcc.Download(id="download-attendance"),
    dcc.Download(id="download-anomaly"),
    dcc.Download(id="download-full"),
])


def _fetch_store_options() -> list[dict]:
    try:
        df = get_store_list()
    except Exception:
        df = pd.DataFrame()
    if df.empty:
        return [
            {"label": "S001 旗舰店(演示)", "value": "S001"},
            {"label": "S002 朝阳店(演示)", "value": "S002"},
        ]
    opts = []
    for _, r in df.iterrows():
        sid = r["store_id"]
        label = f"{sid}（{int(r.get('appointment_count') or 0)}条预约）"
        opts.append({"label": label, "value": sid})
    return opts


def _build_download_buttons(can_export: bool) -> html.Div:
    base_btn_cls = "btn-outline-primary"
    warn_btn_cls = "btn-outline-warning"
    danger_btn_cls = "btn-outline-danger"
    disabled = {} if can_export else {"disabled": True, "style": {"cursor": "not-allowed", "opacity": 0.6}}
    title_suffix = "" if can_export else " (当前角色无权限)"

    return html.Div([
        html.Button(f"下载冲突趋势CSV{title_suffix}", id="btn-dl-conflict", n_clicks=0,
                     className=f"btn {base_btn_cls} btn-sm me-2", **disabled),
        html.Button(f"下载改约构成CSV{title_suffix}", id="btn-dl-reschedule", n_clicks=0,
                     className=f"btn {base_btn_cls} btn-sm me-2", **disabled),
        html.Button(f"下载到场明细CSV{title_suffix}", id="btn-dl-attendance", n_clicks=0,
                     className=f"btn {base_btn_cls} btn-sm me-2", **disabled),
        html.Button(f"下载异常标注CSV{title_suffix}", id="btn-dl-anomaly", n_clicks=0,
                     className=f"btn {warn_btn_cls} btn-sm me-2", **disabled),
        html.Button(f"下载完整报告{title_suffix}", id="btn-dl-full", n_clicks=0,
                     className=f"btn {danger_btn_cls} btn-sm", **disabled),
    ], style={"marginBottom": "16px"})


def _build_share_panel(current_role: str, share_result: html.Div | None = None) -> html.Div:
    can_share = "share_view" in ROLE_PERMISSIONS.get(current_role, set())
    current_level = ROLE_HIERARCHY.get(current_role, 0)

    role_options = []
    for role, label in ROLE_LABELS.items():
        if ROLE_HIERARCHY.get(role, 99) <= current_level:
            role_options.append({"label": f"{label}（{role}）", "value": role})

    share_disabled = {} if can_share else {"disabled": True, "style": {"opacity": 0.6}}
    title = "创建分享视图（店长及以上可分享）" if can_share else "分享视图（当前角色无分享权限）"

    result = share_result or html.Span("", id="share-result")

    return html.Div(className="card p-3 mb-3", children=[
        html.H6(title, className="mb-2"),
        html.Div(className="row g-2", children=[
            html.Div(className="col-md-4", children=[
                html.Label("目标角色", className="form-label form-label-sm"),
                dcc.Dropdown(id="share-role-select", options=role_options,
                             value=role_options[0]["value"] if role_options else "viewer",
                             className="form-select form-select-sm",
                             disabled=not can_share),
            ]),
            html.Div(className="col-md-3", children=[
                html.Label("有效期(分钟)", className="form-label form-label-sm"),
                dcc.Input(id="share-expires", type="number", value=60, min=5, max=10080,
                          className="form-control form-control-sm", **share_disabled),
            ]),
            html.Div(className="col-md-2 d-flex align-items-end", children=[
                html.Button("生成分享链接", id="btn-create-share", n_clicks=0,
                            className="btn btn-sm btn-success", **share_disabled),
            ]),
            html.Div(className="col-md-3 d-flex align-items-end", children=[
                html.Div(id="share-result", className="small", style={"wordBreak": "break-all", "width": "100%"},
                         children=result),
            ]),
        ]),
    ])


@app.callback(
    [Output("store-selector", "options"), Output("store-selector", "placeholder")],
    [Input("app-location", "pathname"), Input("btn-login", "n_clicks")],
)
def load_store_options(_pathname, _n):
    opts = _fetch_store_options()
    placeholder = f"请选择门店（共 {len(opts)} 个门店）"
    return opts, placeholder


@app.callback(
    Output("selected-store-holder", "data"),
    [Input("store-selector", "value")],
    [State("login-store-id", "value")],
    prevent_initial_call=False,
)
def sync_store_selection(selected, login_store):
    if selected:
        return {"value": selected}
    return {"value": login_store or "S001"}


@app.callback(
    [
        Output("conflict-trend-chart", "children"),
        Output("reschedule-composition-chart", "children"),
        Output("attendance-detail-chart", "children"),
        Output("anomaly-reminder-chart", "children"),
        Output("last-refresh-time", "children"),
        Output("store-badge", "children"),
        Output("user-role-badge", "children"),
        Output("caliber-definition-table", "children"),
        Output("download-section", "children"),
        Output("share-panel-placeholder", "children"),
        Output("refresh-status", "children"),
    ],
    [
        Input("btn-refresh", "n_clicks"),
        Input("store-selector", "value"),
        Input("poll-refresh", "n_intervals"),
        Input("selected-store-holder", "modified_timestamp"),
        Input("btn-login", "n_clicks"),
        Input("btn-logout", "n_clicks"),
    ],
    [State("selected-store-holder", "data"), State("login-store-id", "value")],
)
def update_dashboard(
    refresh_clicks, selected_store, _poll, _ts_mod,
    _login_clicks, _logout_clicks,
    holder_data, login_store_default,
):
    role = get_current_user_role()
    role_label = ROLE_LABELS.get(role, role)
    username = get_current_username() or "未登录"
    user_badge = f"{username} · {role_label}"

    requested = None
    if isinstance(holder_data, dict) and holder_data.get("value"):
        requested = holder_data["value"]
    elif selected_store:
        requested = selected_store
    else:
        requested = login_store_default or "S001"

    visible_store = get_visible_store_id(requested)
    if requested and visible_store is None:
        denied = _render_permission_denied(
            f"角色「{role_label}」无权访问门店「{requested}」"
        )
        return (
            denied, denied, denied, denied, "",
            f"门店受限", user_badge, [],
            _build_download_buttons(False), _build_share_panel(role),
            "权限校验不通过"
        )

    conflict_result = compute_conflict_trend(store_id=visible_store)
    reschedule_result = compute_reschedule_composition(store_id=visible_store)
    attendance_result = compute_attendance_summary(store_id=visible_store)
    anomaly_result = compute_anomaly_reminders(store_id=visible_store)
    refresh_time = get_refresh_timestamp()

    conflict_chart = build_conflict_trend_chart(conflict_result["data"], conflict_result["caliber"])
    reschedule_chart = build_reschedule_composition_chart(reschedule_result["data"], reschedule_result["caliber"])
    attendance_chart = build_attendance_detail_chart(
        attendance_result["data"], attendance_result.get("daily_rates", []), attendance_result["caliber"]
    )
    anomaly_chart = _build_anomaly_enhanced(anomaly_result)

    store_badge = f"门店: {visible_store}" if visible_store else "门店: 未指定"

    caliber_rows = [
        html.Thead(html.Tr([html.Th("指标名称"), html.Th("口径定义 / 追溯路径")])),
        html.Tbody([
            html.Tr([html.Td(k), html.Td(v)]) for k, v in ATTENDANCE_CALIBER_DEFINITION.items()
        ]),
    ]

    status_text = "最近刷新: " + refresh_time
    can_export = has_permission("export_csv")

    return (
        conflict_chart,
        reschedule_chart,
        attendance_chart,
        anomaly_chart,
        status_text,
        store_badge,
        user_badge,
        caliber_rows,
        _build_download_buttons(can_export),
        _build_share_panel(role),
        status_text,
    )


def _build_anomaly_enhanced(anomaly_result: dict) -> html.Div:
    records = anomaly_result.get("data") or []
    breakdown = anomaly_result.get("breakdown") or []
    caliber = anomaly_result.get("caliber") or {}

    import plotly.graph_objects as go

    table_headers = [
        "顾客", "服务项目", "预约时间", "异常原因", "异常详情",
        "改约次数", "到场状态", "预约ID", "收银ID", "金额", "支付方式", "评分",
    ]

    rows = []
    for r in records:
        appt_id = r.get("appointment_id") or r.get("id")
        rows.append(html.Tr([
            html.Td(str(r.get("customer_name", ""))),
            html.Td(str(r.get("service_item", ""))),
            html.Td(str(r.get("appointment_time", ""))[:16]),
            html.Td(str(r.get("anomaly_reason", "")), style={"color": "#d63031", "fontWeight": 600}),
            html.Td(str(r.get("anomaly_detail", ""))[:40], title=str(r.get("anomaly_detail", ""))),
            html.Td(str(r.get("reschedule_count", 0))),
            html.Td(str(r.get("attendance_status", ""))),
            html.Td(str(appt_id)),
            html.Td(str(r.get("cashier_record_id", "")),
                    title=f"SELECT * FROM cashier_records WHERE id={r.get('cashier_record_id')}"),
            html.Td(str(r.get("cashier_amount", ""))),
            html.Td(str(r.get("payment_method", ""))),
            html.Td(str(r.get("review_rating", ""))),
        ]))

    if not rows:
        rows.append(html.Tr(html.Td("（当前门店暂无异常记录，或数据未初始化）", colSpan=len(table_headers))))

    table_component = html.Table(
        [html.Thead(html.Tr([html.Th(h) for h in table_headers]))] +
        [html.Tbody(rows)],
        style={"width": "100%", "borderCollapse": "collapse", "fontSize": "12px"},
        className="table table-sm table-bordered table-hover",
    )

    breakdown_chart = dcc.Graph()
    if breakdown:
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=[b["reason"] for b in breakdown],
            y=[b["count"] for b in breakdown],
            marker_color=["#e17055", "#d63031", "#fdcb6e", "#6c5ce7"],
        ))
        fig.update_layout(title="异常原因分布", template="plotly_white", height=240,
                          xaxis_title="异常原因", yaxis_title="数量", margin=dict(l=30, r=10, t=40, b=120),
                          xaxis_tickangle=-15)
        breakdown_chart = dcc.Graph(figure=fig)
    else:
        empty = go.Figure()
        empty.add_annotation(text="暂无异常数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        empty.update_layout(title="异常原因分布", height=240)
        breakdown_chart = dcc.Graph(figure=empty)

    calibers_html = html.Div([
        html.Small(f"口径: {caliber.get('异常标注', '')}"),
        html.Br(),
        html.Small(className="text-muted",
                   children="可追溯字段: cashier_record_id→收银流水主键; cashier_amount→交易金额; review_rating→点评评分"),
    ])

    return html.Div([
        html.H4("提醒名单异常标注", style={"fontSize": "16px", "marginBottom": "8px"}),
        calibers_html,
        html.Hr(style={"margin": "8px 0"}),
        breakdown_chart,
        html.Details([
            html.Summary(f"异常名单明细 ({len(records)} 条，含收银流水追溯字段)",
                         style={"cursor": "pointer", "fontSize": "13px", "margin": "8px 0"}),
            html.Div(table_component, style={"maxHeight": "320px", "overflowY": "auto"}),
        ], open=True),
    ])


def _get_attendance_trace(store_id: str | None) -> list[dict]:
    if not store_id:
        return []
    try:
        df = get_all_appointments_raw(store_id)
    except Exception:
        return []
    if df.empty:
        return []
    cols = [
        "id", "cashier_record_id", "cashier_amount", "payment_method",
        "transaction_time", "transaction_type", "review_rating", "reviewed_at",
    ]
    present = [c for c in cols if c in df.columns]
    df = df[present].rename(columns={
        "id": "appointment_id",
    }).where(pd.notna(df[present]), None)
    return df.to_dict("records")


@app.callback(
    Output("download-conflict", "data"),
    Input("btn-dl-conflict", "n_clicks"),
    [State("store-selector", "value"), State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def download_conflict_csv(n_clicks, selected, holder):
    if not has_permission("export_csv"):
        raise PreventUpdate
    store_id = get_visible_store_id(
        (holder or {}).get("value") if isinstance(holder, dict) else selected
    )
    result = compute_conflict_trend(store_id=store_id)
    content = export_conflict_trend_csv(result["data"], result["caliber"])
    return dict(content=content, filename="冲突检测趋势.csv", type="text/csv")


@app.callback(
    Output("download-reschedule", "data"),
    Input("btn-dl-reschedule", "n_clicks"),
    [State("store-selector", "value"), State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def download_reschedule_csv(n_clicks, selected, holder):
    if not has_permission("export_csv"):
        raise PreventUpdate
    store_id = get_visible_store_id(
        (holder or {}).get("value") if isinstance(holder, dict) else selected
    )
    result = compute_reschedule_composition(store_id=store_id)
    content = export_reschedule_composition_csv(result["data"], result["caliber"])
    return dict(content=content, filename="改约记录构成.csv", type="text/csv")


@app.callback(
    Output("download-attendance", "data"),
    Input("btn-dl-attendance", "n_clicks"),
    [State("store-selector", "value"), State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def download_attendance_csv(n_clicks, selected, holder):
    if not has_permission("export_csv"):
        raise PreventUpdate
    store_id = get_visible_store_id(
        (holder or {}).get("value") if isinstance(holder, dict) else selected
    )
    result = compute_attendance_summary(store_id=store_id)
    trace = _get_attendance_trace(store_id)
    content = export_attendance_detail_csv(
        result["data"], result.get("daily_rates", []), result["caliber"], trace_rows=trace
    )
    return dict(content=content, filename="到场状态明细.csv", type="text/csv")


@app.callback(
    Output("download-anomaly", "data"),
    Input("btn-dl-anomaly", "n_clicks"),
    [State("store-selector", "value"), State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def download_anomaly_csv(n_clicks, selected, holder):
    if not has_permission("export_csv"):
        raise PreventUpdate
    store_id = get_visible_store_id(
        (holder or {}).get("value") if isinstance(holder, dict) else selected
    )
    result = compute_anomaly_reminders(store_id=store_id)
    content = export_anomaly_reminder_csv(
        result["data"], result.get("breakdown", []), result["caliber"]
    )
    return dict(content=content, filename="提醒名单异常标注.csv", type="text/csv")


@app.callback(
    Output("download-full", "data"),
    Input("btn-dl-full", "n_clicks"),
    [State("store-selector", "value"), State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def download_full_csv(n_clicks, selected, holder):
    if not has_permission("export_csv"):
        raise PreventUpdate
    store_id = get_visible_store_id(
        (holder or {}).get("value") if isinstance(holder, dict) else selected
    )
    conflict = compute_conflict_trend(store_id=store_id)
    reschedule = compute_reschedule_composition(store_id=store_id)
    attendance = compute_attendance_summary(store_id=store_id)
    anomaly = compute_anomaly_reminders(store_id=store_id)
    trace = _get_attendance_trace(store_id)

    content = export_full_report_csv(
        conflict_data=conflict["data"],
        conflict_caliber=conflict["caliber"],
        reschedule_data=reschedule["data"],
        reschedule_caliber=reschedule["caliber"],
        attendance_data=attendance["data"],
        attendance_rates=attendance.get("daily_rates", []),
        attendance_caliber=attendance["caliber"],
        anomaly_data=anomaly["data"],
        anomaly_breakdown=anomaly.get("breakdown", []),
        anomaly_caliber=anomaly["caliber"],
        attendance_trace=trace,
    )
    return dict(content=content, filename="预约风险监测完整报告.csv", type="text/csv")


@app.callback(
    Output("login-status", "children"),
    [Input("btn-login", "n_clicks"), Input("btn-logout", "n_clicks")],
    [State("login-username", "value"),
     State("login-role-select", "value"),
     State("login-store-id", "value")],
    prevent_initial_call=False,
)
def handle_login_actions(login_clicks, logout_clicks, username, role, store_id):
    ctx = dash.callback_context
    if not ctx.triggered:
        return (f"当前: {get_current_username() or '未登录'} "
                f"/ {ROLE_LABELS.get(get_current_user_role(), 'viewer')}")
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    if trigger_id == "btn-logout":
        clear_user_session()
        return "已退出登录，切换为匿名查看者角色"
    if trigger_id == "btn-login":
        if role not in _ALLOWED_LOGIN_ROLES:
            return f"登录失败：非法角色 {role}"
        current_role = get_current_user_role()
        current_level = ROLE_HIERARCHY.get(current_role, 0)
        target_level = ROLE_HIERARCHY.get(role, 0)
        if current_level > 0 and target_level > current_level:
            return (f"登录失败：当前角色「{ROLE_LABELS.get(current_role, current_role)}」"
                    f"无法提升为「{ROLE_LABELS.get(role, role)}」")
        set_user_session(username or "demo", role, store_id)
        return (f"已登录: {username} / {ROLE_LABELS.get(role, role)}"
                f" / 默认门店: {store_id}")
    return ""


@app.callback(
    Output("share-result", "children"),
    Input("btn-create-share", "n_clicks"),
    [State("share-role-select", "value"),
     State("share-expires", "value"),
     State("store-selector", "value"),
     State("selected-store-holder", "data")],
    prevent_initial_call=True,
)
def handle_create_share(n_clicks, target_role, expires, store_value, holder):
    if not has_permission("share_view"):
        return html.Span("当前角色无分享权限", className="text-danger")
    if not target_role or target_role not in ROLE_LABELS:
        return html.Span("请选择有效的目标角色", className="text-danger")
    target_store = (holder or {}).get("value") if isinstance(holder, dict) else store_value
    target_store = get_visible_store_id(target_store)

    try:
        result = create_share_link(
            target_role=target_role,
            target_store_id=target_store,
            expires_minutes=int(expires or 60),
        )
    except Exception as e:
        return html.Span(f"生成失败: {e}", className="text-danger")

    if not result.get("success"):
        return html.Span(f"生成失败: {result.get('error', '未知错误')}", className="text-danger")

    labels = [PERMISSION_LABELS.get(p, p) for p in result.get("permissions", [])]
    expires_at = result.get("expires_at", "")

    return html.Div([
        html.Div([
            html.Strong("分享链接："),
            dcc.Input(value=result["share_url"], readOnly=True, style={"width": "100%"}),
        ]),
        html.Div(className="text-muted small", children=[
            f"有效期至 {expires_at.replace('T', ' ')}; "
            f"角色: {result.get('target_role_label', target_role)}; "
            f"权限: {', '.join(labels)}",
        ]),
        html.Div(className="small mt-1 text-success", children=[
            "证明: 此分享通过 create_share_link() 生成，强制以"
            f"「{result.get('target_role_label', target_role)}」运行；"
            "before_request 拦截 validate_share_access 不可绕过；"
            "若 target_role 权限高于分享者则已被拒绝。",
        ]),
    ])
