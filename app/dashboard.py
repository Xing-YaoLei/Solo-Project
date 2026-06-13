import dash
from dash import Input, Output, State, dcc, html
from flask import session

from app.charts import (
    build_anomaly_reminder_chart,
    build_attendance_detail_chart,
    build_conflict_trend_chart,
    build_reschedule_composition_chart,
)
from services.risk_analysis import (
    compute_anomaly_reminders,
    compute_attendance_summary,
    compute_conflict_trend,
    compute_reschedule_composition,
    get_refresh_timestamp,
)
from utils.auth import (
    get_visible_store_id,
    has_permission,
    require_permission,
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
)
app.title = "美业门店顾客预约风险监测"
server = app.server

server.secret_key = "change-me-in-production"


def _render_download_buttons() -> html.Div:
    return html.Div([
        html.Button("下载冲突趋势CSV", id="btn-dl-conflict", n_clicks=0,
                     className="btn btn-outline-primary btn-sm me-2"),
        html.Button("下载改约构成CSV", id="btn-dl-reschedule", n_clicks=0,
                     className="btn btn-outline-primary btn-sm me-2"),
        html.Button("下载到场明细CSV", id="btn-dl-attendance", n_clicks=0,
                     className="btn btn-outline-primary btn-sm me-2"),
        html.Button("下载异常标注CSV", id="btn-dl-anomaly", n_clicks=0,
                     className="btn btn-outline-warning btn-sm me-2"),
        html.Button("下载完整报告", id="btn-dl-full", n_clicks=0,
                     className="btn btn-outline-danger btn-sm"),
    ], style={"marginBottom": "16px"})


def _render_permission_denied(msg: str = "权限不足") -> html.Div:
    return html.Div([
        html.H3(msg, className="text-danger"),
        html.P("您当前角色无权查看此内容，请联系管理员。"),
    ])


app.layout = html.Div([
    dcc.Store(id="store-id-store", storage_type="session"),
    dcc.Store(id="share-token-store", storage_type="session"),

    html.Nav(className="navbar navbar-dark bg-dark px-3", children=[
        html.Span("美业门店顾客预约风险监测", className="navbar-brand mb-0 h5"),
        html.Div([
            html.Span(id="user-role-badge", className="badge bg-light text-dark me-2"),
            html.Span(id="last-refresh-time", className="text-light", style={"fontSize": "13px"}),
        ], className="d-flex align-items-center"),
    ]),

    html.Div(className="container-fluid p-3", children=[
        html.Div(className="row mb-3", children=[
            html.Div(className="col-md-3", children=[
                html.Label("选择门店", className="form-label"),
                dcc.Dropdown(id="store-selector", placeholder="选择门店", className="form-select"),
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

        html.Div(id="download-section", children=_render_download_buttons()),

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
                    html.H5("指标定义说明（到场率口径）", className="mb-2"),
                    html.Table(id="caliber-definition-table", className="table table-sm table-bordered"),
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


@app.callback(
    [
        Output("conflict-trend-chart", "children"),
        Output("reschedule-composition-chart", "children"),
        Output("attendance-detail-chart", "children"),
        Output("anomaly-reminder-chart", "children"),
        Output("last-refresh-time", "children"),
        Output("user-role-badge", "children"),
        Output("caliber-definition-table", "children"),
    ],
    [
        Input("btn-refresh", "n_clicks"),
        Input("store-selector", "value"),
    ],
    [State("date-range", "start_date"), State("date-range", "end_date")],
)
def update_dashboard(n_clicks, store_id, start_date, end_date):
    from datetime import datetime as dt

    visible_store = get_visible_store_id(store_id)
    if store_id and visible_store is None:
        denied = _render_permission_denied()
        return denied, denied, denied, denied, "", "无权限", []

    conflict_result = compute_conflict_trend(store_id=visible_store)
    reschedule_result = compute_reschedule_composition(store_id=visible_store)
    attendance_result = compute_attendance_summary(store_id=visible_store)
    anomaly_result = compute_anomaly_reminders(store_id=visible_store)
    refresh_time = get_refresh_timestamp()

    role = session.get("user_role", "viewer")
    role_labels = {"admin": "管理员", "store_manager": "店长", "staff": "员工", "viewer": "查看者"}

    conflict_chart = build_conflict_trend_chart(conflict_result["data"], conflict_result["caliber"])
    reschedule_chart = build_reschedule_composition_chart(reschedule_result["data"], reschedule_result["caliber"])
    attendance_chart = build_attendance_detail_chart(
        attendance_result["data"], attendance_result.get("daily_rates", []), attendance_result["caliber"]
    )
    anomaly_chart = build_anomaly_reminder_chart(
        anomaly_result["data"], anomaly_result.get("breakdown", []), anomaly_result["caliber"]
    )

    from services.risk_analysis import ATTENDANCE_CALIBER_DEFINITION
    caliber_rows = [
        html.Thead(html.Tr([html.Th("指标名称"), html.Th("口径定义")])),
        html.Tbody([
            html.Tr([html.Td(k), html.Td(v)]) for k, v in ATTENDANCE_CALIBER_DEFINITION.items()
        ]),
    ]

    return (
        conflict_chart,
        reschedule_chart,
        attendance_chart,
        anomaly_chart,
        f"最近刷新: {refresh_time}",
        role_labels.get(role, role),
        caliber_rows,
    )


@app.callback(
    Output("download-conflict", "data"),
    Input("btn-dl-conflict", "n_clicks"),
    State("store-selector", "value"),
    prevent_initial_call=True,
)
def download_conflict_csv(n_clicks, store_id):
    if not has_permission("export_csv"):
        return dash.no_update
    visible_store = get_visible_store_id(store_id)
    result = compute_conflict_trend(store_id=visible_store)
    content = export_conflict_trend_csv(result["data"], result["caliber"])
    return dict(content=content, filename="冲突检测趋势.csv", type="text/csv")


@app.callback(
    Output("download-reschedule", "data"),
    Input("btn-dl-reschedule", "n_clicks"),
    State("store-selector", "value"),
    prevent_initial_call=True,
)
def download_reschedule_csv(n_clicks, store_id):
    if not has_permission("export_csv"):
        return dash.no_update
    visible_store = get_visible_store_id(store_id)
    result = compute_reschedule_composition(store_id=visible_store)
    content = export_reschedule_composition_csv(result["data"], result["caliber"])
    return dict(content=content, filename="改约记录构成.csv", type="text/csv")


@app.callback(
    Output("download-attendance", "data"),
    Input("btn-dl-attendance", "n_clicks"),
    State("store-selector", "value"),
    prevent_initial_call=True,
)
def download_attendance_csv(n_clicks, store_id):
    if not has_permission("export_csv"):
        return dash.no_update
    visible_store = get_visible_store_id(store_id)
    result = compute_attendance_summary(store_id=visible_store)
    content = export_attendance_detail_csv(result["data"], result.get("daily_rates", []), result["caliber"])
    return dict(content=content, filename="到场状态明细.csv", type="text/csv")


@app.callback(
    Output("download-anomaly", "data"),
    Input("btn-dl-anomaly", "n_clicks"),
    State("store-selector", "value"),
    prevent_initial_call=True,
)
def download_anomaly_csv(n_clicks, store_id):
    if not has_permission("export_csv"):
        return dash.no_update
    visible_store = get_visible_store_id(store_id)
    result = compute_anomaly_reminders(store_id=visible_store)
    content = export_anomaly_reminder_csv(result["data"], result.get("breakdown", []), result["caliber"])
    return dict(content=content, filename="提醒名单异常标注.csv", type="text/csv")


@app.callback(
    Output("download-full", "data"),
    Input("btn-dl-full", "n_clicks"),
    State("store-selector", "value"),
    prevent_initial_call=True,
)
def download_full_csv(n_clicks, store_id):
    if not has_permission("export_csv"):
        return dash.no_update
    visible_store = get_visible_store_id(store_id)

    conflict = compute_conflict_trend(store_id=visible_store)
    reschedule = compute_reschedule_composition(store_id=visible_store)
    attendance = compute_attendance_summary(store_id=visible_store)
    anomaly = compute_anomaly_reminders(store_id=visible_store)

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
    )
    return dict(content=content, filename="预约风险监测完整报告.csv", type="text/csv")


@server.before_request
def enforce_role_on_share():
    from flask import request

    share_token = request.args.get("share_token")
    if share_token:
        if not validate_share_access(share_token):
            from flask import abort
            abort(403)
