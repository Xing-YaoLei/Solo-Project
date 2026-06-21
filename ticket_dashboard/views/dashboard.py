import json
from datetime import date, datetime, timedelta

import dash
from dash import html, dcc, Input, Output, State, ALL, callback_context, no_update
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

from ticket_dashboard.db.session import SessionLocal
from ticket_dashboard.db.models import SavedView, ReviewNote, DataQualityFlag, SlotConflict
from ticket_dashboard.data.loader import (
    load_reservation_data, load_capacity_data, load_conflict_data,
    load_quality_flags, load_review_notes, load_attendance_rules,
    compute_attendance_rate,
)
from ticket_dashboard.data.quality import run_all_quality_checks
from ticket_dashboard.data.conflict import detect_capacity_conflicts, detect_timeslot_overlaps, get_conflict_affected_time_range
from ticket_dashboard.components.quality_banner import create_quality_banner, create_quality_flag_badges
from ticket_dashboard.components.charts import (
    build_calendar_timeslot_chart, build_capacity_rule_chart,
    build_conflict_timeline, build_timeslot_heatmap,
)
from ticket_dashboard.components.filters import (
    create_filter_bar, create_saved_view_modal,
    create_review_note_modal, create_conflict_time_range_alert,
)
from ticket_dashboard.utils.download import generate_download_csv, generate_download_excel, format_attendance_rules_description

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title="景区运营门票预约趋势看板",
    update_title="数据刷新中...",
)

server = app.server

app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H2("景区运营门票预约趋势看板", className="mt-2 mb-0"),
        ], width=8),
        dbc.Col([
            html.Div(id="quality-badge-container", className="d-flex justify-content-end mt-3"),
        ], width=4),
    ]),

    create_quality_banner(),

    create_filter_bar(),

    dbc.Card([
        dbc.CardBody([
            dbc.Tabs([
                dbc.Tab(label="日历时段", tab_id="tab-calendar", label_style={"fontWeight": "bold"}),
                dbc.Tab(label="容量规则", tab_id="tab-capacity", label_style={"fontWeight": "bold"}),
                dbc.Tab(label="冲突检测", tab_id="tab-conflict", label_style={"fontWeight": "bold"}),
            ], id="main-tabs", active_tab="tab-calendar"),
            html.Hr(),
            html.Div(id="tab-content"),
        ]),
    ], className="mb-3"),

    create_conflict_time_range_alert(),

    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.Strong("复盘说明（与异常点合一展示）")),
                dbc.CardBody(id="review-notes-container"),
            ]),
        ], width=12),
    ], className="mb-3"),

    dbc.Row([
        dbc.Col([
            html.Div(id="saved-views-container"),
        ], width=12),
    ], className="mb-3"),

    create_saved_view_modal(),
    create_review_note_modal(),

    dcc.Store(id="store-reservation-data"),
    dcc.Store(id="store-capacity-data"),
    dcc.Store(id="store-conflict-data"),
    dcc.Store(id="store-quality-flags"),
    dcc.Store(id="store-review-notes"),
    dcc.Store(id="store-attendance-rules"),
    dcc.Store(id="store-current-filters"),
    dcc.Store(id="store-selected-anomaly"),

    dcc.Download(id="download-report"),

    dcc.Interval(id="auto-refresh-interval", interval=300 * 1000, n_intervals=0),

], fluid=True)


@app.callback(
    [
        Output("store-reservation-data", "data"),
        Output("store-capacity-data", "data"),
        Output("store-conflict-data", "data"),
        Output("store-quality-flags", "data"),
        Output("store-review-notes", "data"),
        Output("store-attendance-rules", "data"),
        Output("quality-badge-container", "children"),
        Output("quality-banner", "is_open"),
        Output("quality-banner-content", "children"),
        Output("last-refresh-time", "children"),
    ],
    [
        Input("btn-refresh", "n_clicks"),
        Input("auto-refresh-interval", "n_intervals"),
    ],
    [
        State("filter-scenic-area", "value"),
        State("filter-date-range", "start_date"),
        State("filter-date-range", "end_date"),
    ],
)
def refresh_data(n_clicks, n_intervals, scenic_areas, start_date, end_date):
    scenic_area_id = None
    if scenic_areas and len(scenic_areas) == 1:
        scenic_area_id = scenic_areas[0]

    start = date.fromisoformat(start_date) if start_date else date.today() - timedelta(days=30)
    end = date.fromisoformat(end_date) if end_date else date.today()

    reservation_df = load_reservation_data(scenic_area_id, start, end)
    capacity_df = load_capacity_data(scenic_area_id, start, end)
    conflict_df = load_conflict_data(scenic_area_id, start, end)
    quality_df = load_quality_flags(flag_date=end)
    review_df = load_review_notes(scenic_area_id, end)
    rules_df = load_attendance_rules(scenic_area_id)

    reservation_df = compute_attendance_rate(reservation_df, rules_df)

    quality_flags = quality_df.to_dict("records") if not quality_df.empty else []
    badge_element = create_quality_flag_badges(quality_flags)

    banner_open = False
    banner_content = ""
    if quality_flags:
        banner_open = True
        messages = [f.get("flag_detail", {}).get("message", f.get("flag_type", "")) for f in quality_flags]
        banner_content = html.Ul([html.Li(m) for m in messages])

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return (
        reservation_df.to_dict("records") if not reservation_df.empty else [],
        capacity_df.to_dict("records") if not capacity_df.empty else [],
        conflict_df.to_dict("records") if not conflict_df.empty else [],
        quality_flags,
        review_df.to_dict("records") if not review_df.empty else [],
        rules_df.to_dict("records") if not rules_df.empty else [],
        badge_element,
        banner_open,
        banner_content,
        f"最后刷新: {now_str}",
    )


@app.callback(
    Output("filter-scenic-area", "options"),
    Output("filter-ticket-type", "options"),
    Output("filter-channel", "options"),
    Input("store-reservation-data", "data"),
)
def update_filter_options(reservation_data):
    if not reservation_data:
        return [], [], []

    df = __import__("pandas").DataFrame(reservation_data)
    area_opts = [{"label": n, "value": i} for i, n in df[["scenic_area_id", "scenic_area_name"]].drop_duplicates().values]
    type_opts = [{"label": t, "value": t} for t in df["ticket_type"].unique()]
    channel_opts = [{"label": c, "value": c} for c in df["channel"].unique()]
    return area_opts, type_opts, channel_opts


@app.callback(
    Output("tab-content", "children"),
    [
        Input("main-tabs", "active_tab"),
        Input("store-reservation-data", "data"),
        Input("store-capacity-data", "data"),
        Input("store-conflict-data", "data"),
        Input("store-quality-flags", "data"),
    ],
    [
        State("filter-scenic-area", "value"),
        State("filter-ticket-type", "value"),
        State("filter-channel", "value"),
    ],
)
def render_tab_content(active_tab, reservation_data, capacity_data, conflict_data, quality_flags, scenic_areas, ticket_types, channels):
    import pandas as pd

    res_df = pd.DataFrame(reservation_data) if reservation_data else pd.DataFrame()
    cap_df = pd.DataFrame(capacity_data) if capacity_data else pd.DataFrame()
    con_df = pd.DataFrame(conflict_data) if conflict_data else pd.DataFrame()

    if scenic_areas:
        if not res_df.empty:
            res_df = res_df[res_df["scenic_area_id"].isin(scenic_areas)]
        if not cap_df.empty:
            cap_df = cap_df[cap_df["scenic_area_id"].isin(scenic_areas)]
        if not con_df.empty:
            con_df = con_df[con_df["scenic_area_id"].isin(scenic_areas)]

    if ticket_types and not res_df.empty:
        res_df = res_df[res_df["ticket_type"].isin(ticket_types)]

    if channels and not res_df.empty:
        res_df = res_df[res_df["channel"].isin(channels)]

    if active_tab == "tab-calendar":
        fig_trend = build_calendar_timeslot_chart(res_df, cap_df)
        fig_heatmap = build_timeslot_heatmap(res_df)
        return html.Div([
            dcc.Graph(figure=fig_trend),
            dcc.Graph(figure=fig_heatmap),
        ])

    elif active_tab == "tab-capacity":
        fig_capacity = build_capacity_rule_chart(cap_df)
        return html.Div([
            dcc.Graph(figure=fig_capacity),
        ])

    elif active_tab == "tab-conflict":
        fig_conflict = build_conflict_timeline(con_df)
        return html.Div([
            dcc.Graph(figure=fig_conflict),
        ])

    return html.Div("选择视图查看数据")


@app.callback(
    Output("conflict-time-range-alert", "is_open"),
    Output("conflict-time-range-alert", "children"),
    Input("store-conflict-data", "data"),
)
def show_conflict_time_range(conflict_data):
    if not conflict_data:
        return False, ""

    time_range = get_conflict_affected_time_range(conflict_data)
    if time_range:
        return True, f"时段冲突影响走势，受影响时间范围: {time_range}"
    return False, ""


@app.callback(
    Output("review-notes-container", "children"),
    [
        Input("store-review-notes", "data"),
        Input("store-quality-flags", "data"),
    ],
)
def render_review_notes(review_data, quality_flags):
    items = []

    if quality_flags:
        for flag in quality_flags:
            detail = flag.get("flag_detail", {})
            message = detail.get("message", flag.get("flag_type", "未知异常"))
            matched_review = None

            if review_data:
                for review in review_data:
                    if review.get("anomaly_flag_id") == flag.get("id"):
                        matched_review = review
                        break

            card_body = [
                html.Strong(f"[{flag.get('flag_type', '异常')}] {message}"),
                html.Br(),
                html.Small(f"检测时间: {flag.get('detected_at', '')}", className="text-muted"),
            ]

            if matched_review:
                card_body.extend([
                    html.Hr(className="my-1"),
                    html.Em("复盘说明: "),
                    html.Span(matched_review.get("note_content", "")),
                    html.Br(),
                    html.Small(f"— {matched_review.get('author', '')} {matched_review.get('created_at', '')}", className="text-muted"),
                ])
            else:
                card_body.extend([
                    html.Hr(className="my-1"),
                    html.Span("暂无复盘说明", className="text-muted"),
                    dbc.Button(
                        "添加复盘", size="sm", color="link",
                        id={"type": "btn-add-review", "index": flag.get("id", 0)},
                    ),
                ])

            items.append(dbc.Card(dbc.CardBody(card_body), className="mb-2"))

    if review_data:
        reviewed_ids = set()
        for flag in (quality_flags or []):
            for review in review_data:
                if review.get("anomaly_flag_id") == flag.get("id"):
                    reviewed_ids.add(review.get("id"))

        for review in review_data:
            if review.get("id") not in reviewed_ids:
                items.append(dbc.Card(dbc.CardBody([
                    html.Strong("独立复盘"),
                    html.P(review.get("note_content", "")),
                    html.Small(f"— {review.get('author', '')} {review.get('created_at', '')}", className="text-muted"),
                ]), className="mb-2"))

    if not items:
        items = [html.P("暂无复盘说明", className="text-muted")]

    return items


@app.callback(
    Output("save-view-modal", "is_open"),
    [
        Input("btn-save-view", "n_clicks"),
        Input("btn-cancel-save-view", "n_clicks"),
        Input("btn-confirm-save-view", "n_clicks"),
    ],
    [State("save-view-modal", "is_open")],
    prevent_initial_call=True,
)
def toggle_save_view_modal(n_save, n_cancel, n_confirm, is_open):
    ctx = callback_context
    if not ctx.triggered:
        return no_update
    trigger_id = ctx.triggered[0]["prop_id"]
    if "btn-confirm-save-view" in trigger_id:
        return False
    if "btn-cancel-save-view" in trigger_id:
        return False
    return not is_open


@app.callback(
    Output("saved-views-container", "children"),
    Input("btn-confirm-save-view", "n_clicks"),
    State("save-view-name", "value"),
    State("save-view-type", "value"),
    State("save-view-shared", "checked"),
    State("filter-scenic-area", "value"),
    State("filter-date-range", "start_date"),
    State("filter-date-range", "end_date"),
    State("filter-ticket-type", "value"),
    State("filter-channel", "value"),
    prevent_initial_call=True,
)
def save_view(n_clicks, view_name, view_type, is_shared, scenic_areas, start_date, end_date, ticket_types, channels):
    if not n_clicks or not view_name:
        return no_update

    filter_config = {
        "scenic_areas": scenic_areas,
        "start_date": start_date,
        "end_date": end_date,
        "ticket_types": ticket_types,
        "channels": channels,
    }

    with SessionLocal() as session:
        existing = session.query(SavedView).filter_by(view_name=view_name, owner="operator").first()
        if existing:
            existing.filter_config = filter_config
            existing.view_type = view_type
            existing.is_shared = is_shared
        else:
            sv = SavedView(
                view_name=view_name,
                owner="operator",
                view_type=view_type,
                filter_config=filter_config,
                is_shared=is_shared,
            )
            session.add(sv)
        session.commit()

    return _render_saved_views()


def _render_saved_views():
    with SessionLocal() as session:
        views = session.query(SavedView).order_by(SavedView.updated_at.desc()).all()

    if not views:
        return html.Div()

    buttons = []
    for v in views:
        badge = dbc.Badge("共享", color="info", className="ms-1") if v.is_shared else None
        buttons.append(
            html.Span([
                dbc.Button(
                    v.view_name,
                    id={"type": "btn-load-view", "index": v.id},
                    size="sm",
                    color="outline-primary",
                    className="me-1 mb-1",
                ),
                badge,
            ])
        )

    return dbc.Card([
        dbc.CardHeader(html.Strong("已保存视图（早会口径）")),
        dbc.CardBody(buttons),
    ])


@app.callback(
    [
        Output("filter-scenic-area", "value"),
        Output("filter-date-range", "start_date"),
        Output("filter-date-range", "end_date"),
        Output("filter-ticket-type", "value"),
        Output("filter-channel", "value"),
        Output("view-type-selector", "value"),
    ],
    Input({"type": "btn-load-view", "index": ALL}, "n_clicks"),
    prevent_initial_call=True,
)
def load_saved_view(n_clicks_list):
    ctx = callback_context
    if not ctx.triggered:
        return no_update

    triggered_id = ctx.triggered[0]["prop_id"]
    import re
    match = re.search(r'"index":\s*(\d+)', triggered_id)
    if not match:
        return no_update

    view_id = int(match.group(1))

    with SessionLocal() as session:
        sv = session.query(SavedView).filter_by(id=view_id).first()
        if not sv:
            return no_update

        fc = sv.filter_config if isinstance(sv.filter_config, dict) else json.loads(sv.filter_config)

    tab_map = {
        "calendar_timeslot": "tab-calendar",
        "capacity_rule": "tab-capacity",
        "conflict_detection": "tab-conflict",
    }

    return (
        fc.get("scenic_areas"),
        fc.get("start_date"),
        fc.get("end_date"),
        fc.get("ticket_types"),
        fc.get("channels"),
        sv.view_type,
    )


@app.callback(
    Output("review-note-modal", "is_open"),
    [
        Input({"type": "btn-add-review", "index": ALL}, "n_clicks"),
        Input("btn-cancel-review-note", "n_clicks"),
        Input("btn-confirm-review-note", "n_clicks"),
    ],
    [
        State("review-note-modal", "is_open"),
        State({"type": "btn-add-review", "index": ALL}, "id"),
    ],
    prevent_initial_call=True,
)
def toggle_review_note_modal(n_add_list, n_cancel, n_confirm, is_open, btn_ids):
    ctx = callback_context
    if not ctx.triggered:
        return no_update

    trigger_id = ctx.triggered[0]["prop_id"]
    if "btn-confirm-review-note" in trigger_id or "btn-cancel-review-note" in trigger_id:
        return False
    return True


@app.callback(
    Output("store-selected-anomaly", "data"),
    Input({"type": "btn-add-review", "index": ALL}, "n_clicks"),
    State({"type": "btn-add-review", "index": ALL}, "id"),
    prevent_initial_call=True,
)
def capture_anomaly_id(n_clicks_list, btn_ids):
    ctx = callback_context
    if not ctx.triggered:
        return no_update

    triggered = ctx.triggered[0]["prop_id"]
    import re
    match = re.search(r'"index":\s*(\d+)', triggered)
    if match:
        return {"anomaly_flag_id": int(match.group(1))}
    return no_update


@app.callback(
    Output("store-review-notes", "data", allow_duplicate=True),
    Input("btn-confirm-review-note", "n_clicks"),
    [
        State("review-note-content", "value"),
        State("store-selected-anomaly", "data"),
        State("filter-scenic-area", "value"),
        State("filter-date-range", "end_date"),
    ],
    prevent_initial_call=True,
)
def save_review_note(n_clicks, content, anomaly_data, scenic_areas, end_date):
    if not n_clicks or not content:
        return no_update

    scenic_area_id = scenic_areas[0] if scenic_areas else None
    note_date = date.fromisoformat(end_date) if end_date else date.today()

    with SessionLocal() as session:
        note = ReviewNote(
            scenic_area_id=scenic_area_id or "",
            note_date=note_date,
            anomaly_flag_id=anomaly_data.get("anomaly_flag_id") if anomaly_data else None,
            note_content=content,
            author="operator",
        )
        session.add(note)
        session.commit()

    review_df = load_review_notes(scenic_area_id, note_date)
    return review_df.to_dict("records") if not review_df.empty else []


@app.callback(
    Output("download-report", "data"),
    Input("btn-download", "n_clicks"),
    [
        State("store-reservation-data", "data"),
        State("store-attendance-rules", "data"),
    ],
    prevent_initial_call=True,
)
def download_report(n_clicks, reservation_data, rules_data):
    if not n_clicks:
        return no_update

    import pandas as pd

    res_df = pd.DataFrame(reservation_data) if reservation_data else pd.DataFrame()
    rules_df = pd.DataFrame(rules_data) if rules_data else pd.DataFrame()

    rules_text = format_attendance_rules_description(rules_df)
    csv_content = generate_download_csv(res_df, rules_text)

    return dict(content=csv_content, filename="ticket_reservation_report.csv")


@app.callback(
    Output("saved-views-container", "children", allow_duplicate=True),
    Input("main-tabs", "active_tab"),
)
def render_views_on_load(active_tab):
    return _render_saved_views()
