from datetime import date
from dash import dcc, html, dash_table, Input, Output, State, no_update, callback_context
from dash.exceptions import PreventUpdate
import plotly.graph_objects as go
import pandas as pd
import numpy as np

from dash_app.components import (
    create_layout, default_date_range, create_filter_bar,
    create_stat_card, render_empty, status_badge
)
from data_processing import (
    get_conflicts_df, detect_conflicts, get_appointments_df,
    get_schedules_df, get_regions_df
)


PRIMARY = "#1e88e5"
PRIMARY_DARK = "#1565c0"
PRIMARY_LIGHT = "#e3f2fd"
SUCCESS = "#43a047"
WARNING = "#fb8c00"
DANGER = "#e53935"
INFO = "#00acc1"
TEXT_SECONDARY = "#757575"

CONFLICT_TYPE_MAP = {
    "coach_double_book": ("教练双约", DANGER),
    "member_double_book": ("会员双约", WARNING),
    "capacity_overload": ("超容", INFO),
}

SEVERITY_MAP = {
    "error": ("严重", DANGER),
    "warning": ("警告", WARNING),
    "info": ("提示", INFO),
}


def _severity_label(severity):
    return SEVERITY_MAP.get(severity, (severity, TEXT_SECONDARY))[0]


def _severity_color(severity):
    return SEVERITY_MAP.get(severity, (severity, TEXT_SECONDARY))[1]


def _conflict_type_label(ctype):
    return CONFLICT_TYPE_MAP.get(ctype, (ctype, TEXT_SECONDARY))[0]


def _conflict_type_color(ctype):
    return CONFLICT_TYPE_MAP.get(ctype, (ctype, TEXT_SECONDARY))[1]


def _build_conflict_type_options():
    return [
        {"label": "教练双约", "value": "coach_double_book"},
        {"label": "会员双约", "value": "member_double_book"},
        {"label": "超容", "value": "capacity_overload"},
    ]


def _build_severity_options():
    return [
        {"label": "严重", "value": "error"},
        {"label": "警告", "value": "warning"},
        {"label": "提示", "value": "info"},
    ]


def _build_region_options():
    try:
        regions_df = get_regions_df()
        if regions_df.empty:
            return []
        return [
            {"label": row["region_name"], "value": int(row["id"])}
            for _, row in regions_df.iterrows()
        ]
    except Exception:
        return []


def _build_extra_filters():
    return [
        html.Div([
            html.Label("冲突类型"),
            dcc.Dropdown(
                id="conflicts-filter-type",
                options=_build_conflict_type_options(),
                value=[],
                multi=True,
                placeholder="全部类型",
                clearable=True
            )
        ], className="filter-item"),
        html.Div([
            html.Label("严重程度"),
            dcc.Dropdown(
                id="conflicts-filter-severity",
                options=_build_severity_options(),
                value=[],
                multi=True,
                placeholder="全部程度",
                clearable=True
            )
        ], className="filter-item"),
        html.Div([
            html.Label("操作"),
            html.Button(
                "🔍 检测冲突",
                id="conflicts-detect-btn",
                className="btn btn-primary",
                style={"width": "100%"}
            ),
        ], className="filter-item"),
    ]


def _create_kpi_cards(conflicts_df: pd.DataFrame):
    total = len(conflicts_df)
    severe = int((conflicts_df["severity"] == "error").sum()) if not conflicts_df.empty else 0
    resolved = int(conflicts_df["is_resolved"].sum()) if (not conflicts_df.empty and "is_resolved" in conflicts_df.columns) else 0
    unresolved = total - resolved

    return html.Div([
        create_stat_card("冲突总数", total),
        create_stat_card("严重冲突", severe, value_suffix=" 起"),
        create_stat_card("已解决", resolved, value_suffix=" 起"),
        create_stat_card("未解决", unresolved, value_suffix=" 起"),
    ], className="stats-grid")


def _create_type_pie(conflicts_df: pd.DataFrame):
    if conflicts_df.empty or "conflict_type" not in conflicts_df.columns:
        return go.Figure()

    type_counts = conflicts_df.groupby("conflict_type").size().reset_index(name="count")
    type_counts["label"] = type_counts["conflict_type"].apply(_conflict_type_label)
    type_counts["color"] = type_counts["conflict_type"].apply(_conflict_type_color)

    fig = go.Figure(data=[go.Pie(
        labels=type_counts["label"],
        values=type_counts["count"],
        marker=dict(colors=type_counts["color"]),
        textinfo="label+percent",
        hole=0.55,
        sort=False,
    )])
    fig.update_layout(
        margin=dict(l=10, r=10, t=10, b=10),
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.05, xanchor="center", x=0.5),
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _create_trend_line(conflicts_df: pd.DataFrame):
    if conflicts_df.empty or "conflict_date" not in conflicts_df.columns:
        return go.Figure()

    trend_df = conflicts_df.copy()
    trend_df["conflict_date"] = pd.to_datetime(trend_df["conflict_date"])
    daily = trend_df.groupby(
        [pd.Grouper(key="conflict_date", freq="D"), "conflict_type"]
    ).size().reset_index(name="count")
    daily["label"] = daily["conflict_type"].apply(_conflict_type_label)

    fig = go.Figure()
    for ctype in daily["conflict_type"].unique():
        subset = daily[daily["conflict_type"] == ctype]
        fig.add_trace(go.Scatter(
            x=subset["conflict_date"],
            y=subset["count"],
            mode="lines+markers",
            name=_conflict_type_label(ctype),
            line=dict(color=_conflict_type_color(ctype), width=2),
            marker=dict(size=6),
            fill="tozeroy",
            fillcolor=f"rgba(30,136,229,0.08)",
        ))

    fig.update_layout(
        margin=dict(l=40, r=20, t=20, b=40),
        xaxis=dict(title="日期", showgrid=False, zeroline=False),
        yaxis=dict(title="冲突数", showgrid=True, gridcolor="#f0f0f0", zeroline=False),
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=-0.25, xanchor="center", x=0.5),
        plot_bgcolor="#fff",
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _create_severity_bar(conflicts_df: pd.DataFrame):
    if conflicts_df.empty or "severity" not in conflicts_df.columns:
        return go.Figure()

    sev_counts = conflicts_df.groupby("severity").size().reset_index(name="count")
    sev_counts["label"] = sev_counts["severity"].apply(_severity_label)
    sev_counts["color"] = sev_counts["severity"].apply(_severity_color)
    sev_order = ["error", "warning", "info"]
    sev_counts["sort_key"] = sev_counts["severity"].apply(lambda x: sev_order.index(x) if x in sev_order else 99)
    sev_counts = sev_counts.sort_values("sort_key")

    fig = go.Figure(data=[go.Bar(
        x=sev_counts["label"],
        y=sev_counts["count"],
        marker=dict(color=sev_counts["color"]),
        text=sev_counts["count"],
        textposition="outside",
        hovertemplate="<b>%{x}</b><br>数量: %{y}<extra></extra>",
    )])
    fig.update_layout(
        margin=dict(l=40, r=20, t=20, b=40),
        xaxis=dict(title="严重程度", showgrid=False),
        yaxis=dict(title="数量", showgrid=True, gridcolor="#f0f0f0", zeroline=False),
        plot_bgcolor="#fff",
        bargap=0.35,
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _prepare_table_df(conflicts_df: pd.DataFrame) -> pd.DataFrame:
    if conflicts_df.empty:
        cols = [
            "conflict_no", "conflict_date", "conflict_type", "severity",
            "region_name", "description", "is_resolved",
        ]
        return pd.DataFrame(columns=cols)

    df = conflicts_df.copy()
    df["conflict_type_label"] = df["conflict_type"].apply(_conflict_type_label)
    df["severity_label"] = df["severity"].apply(_severity_label)
    if "is_resolved" not in df.columns:
        df["is_resolved"] = False
    df["status"] = df["is_resolved"].apply(lambda x: "已解决" if x else "未解决")

    display_cols = [
        "conflict_no", "conflict_date", "conflict_type_label", "severity_label",
        "region_name", "description", "status",
        "conflict_type", "severity", "is_resolved",
        "appointment_no_1", "appointment_no_2",
    ]
    for c in display_cols:
        if c not in df.columns:
            df[c] = np.nan

    return df[display_cols]


def _create_conflicts_table(conflicts_df: pd.DataFrame):
    table_df = _prepare_table_df(conflicts_df)

    style_data_conditional = [
        {
            "if": {"filter_query": "{severity} = 'error'"},
            "backgroundColor": "rgba(229, 57, 53, 0.06)",
        },
        {
            "if": {"filter_query": "{severity} = 'warning'"},
            "backgroundColor": "rgba(251, 140, 0, 0.06)",
        },
        {
            "if": {"filter_query": "{conflict_type} = 'coach_double_book'"},
            "fontWeight": "600",
        },
        {
            "if": {
                "filter_query": "{is_resolved} = true",
                "column_id": "status",
            },
            "color": SUCCESS,
            "fontWeight": "600",
        },
        {
            "if": {
                "filter_query": "{is_resolved} = false",
                "column_id": "status",
            },
            "color": DANGER,
            "fontWeight": "600",
        },
    ]

    columns = [
        {"name": "冲突编号", "id": "conflict_no", "hideable": True},
        {"name": "冲突日期", "id": "conflict_date", "hideable": True},
        {"name": "冲突类型", "id": "conflict_type_label", "hideable": True},
        {"name": "严重程度", "id": "severity_label", "hideable": True},
        {"name": "门店区域", "id": "region_name", "hideable": True},
        {"name": "描述", "id": "description", "hideable": True},
        {"name": "状态", "id": "status", "hideable": True},
    ]

    return dash_table.DataTable(
        id="conflicts-detail-table",
        columns=columns,
        data=table_df.to_dict("records"),
        page_size=15,
        sort_action="native",
        filter_action="native",
        active_cell=None,
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#fafafa",
            "fontWeight": "600",
            "textTransform": "uppercase",
            "fontSize": "11px",
            "letterSpacing": "0.3px",
            "color": "#757575",
            "borderBottom": "2px solid #e0e0e0"
        },
        style_cell={
            "textAlign": "left",
            "padding": "10px",
            "fontSize": "13px",
            "fontFamily": "-apple-system, 'PingFang SC', sans-serif",
        },
        style_data={
            "cursor": "pointer",
            "selector": "td",
        },
        style_data_conditional=style_data_conditional,
        style_cell_conditional=[
            {"if": {"column_id": "conflict_no"}, "width": "140px"},
            {"if": {"column_id": "conflict_date"}, "width": "110px"},
            {"if": {"column_id": "conflict_type_label"}, "width": "100px"},
            {"if": {"column_id": "severity_label"}, "width": "90px"},
            {"if": {"column_id": "region_name"}, "width": "110px"},
            {"if": {"column_id": "status"}, "width": "80px"},
        ],
    )


def _build_appointment_card(appt_row: dict, card_title: str, highlight: bool = False):
    border_color = PRIMARY if not highlight else DANGER
    bg_color = PRIMARY_LIGHT if highlight else "#fff"

    return html.Div([
        html.Div([
            html.Strong(card_title, style={"fontSize": "15px", "color": PRIMARY_DARK}),
            html.Div([
                html.Span(
                    "⚠️ 异常样本",
                    className="badge badge-danger",
                    style={"marginLeft": "8px"}
                ),
            ]) if highlight else None,
        ], className="modal-header", style={"marginBottom": "12px"}),
        html.Div([
            html.Div([
                html.Label("预约编号", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(str(appt_row.get("appointment_no", "-")),
                         style={"fontWeight": "600", "fontSize": "14px"}),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("预约日期", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(str(appt_row.get("appointment_date", "-")),
                         style={"fontWeight": "600", "fontSize": "14px"}),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("时段", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(
                    f"{appt_row.get('start_time', '-')} - {appt_row.get('end_time', '-')}",
                    style={"fontWeight": "600", "fontSize": "14px"}
                ),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("教练", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(str(appt_row.get("coach_name", "-")),
                         style={"fontWeight": "600", "fontSize": "14px"}),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("会员", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(
                    f"{appt_row.get('member_name', '-')} ({appt_row.get('member_code', '-')})",
                    style={"fontWeight": "600", "fontSize": "14px"}
                ),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("门店区域", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(str(appt_row.get("region_name", "-")),
                         style={"fontWeight": "600", "fontSize": "14px"}),
            ], style={"marginBottom": "10px"}),
            html.Div([
                html.Label("预约状态", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(status_badge(str(appt_row.get("status", "-")))),
            ]),
        ]),
    ], style={
        "border": f"2px solid {border_color}",
        "borderRadius": "8px",
        "padding": "16px",
        "background": bg_color,
    })


def _create_modal_body(conflict_row: dict, appointments_df: pd.DataFrame):
    appt_no_1 = conflict_row.get("appointment_no_1")
    appt_no_2 = conflict_row.get("appointment_no_2")

    appt1_row = {}
    appt2_row = {}
    highlight1 = False
    highlight2 = False

    if not appointments_df.empty:
        if appt_no_1 and "appointment_no" in appointments_df.columns:
            match = appointments_df[appointments_df["appointment_no"] == appt_no_1]
            if not match.empty:
                appt1_row = match.iloc[0].to_dict()
                highlight1 = True
        if appt_no_2 and "appointment_no" in appointments_df.columns:
            match = appointments_df[appointments_df["appointment_no"] == appt_no_2]
            if not match.empty:
                appt2_row = match.iloc[0].to_dict()
                highlight2 = True

    if not appt1_row:
        appt1_row = {
            "appointment_no": appt_no_1 or "-",
            "appointment_date": conflict_row.get("conflict_date", "-"),
            "start_time": conflict_row.get("conflict_start_time", "-"),
            "end_time": conflict_row.get("conflict_end_time", "-"),
            "coach_name": conflict_row.get("coach_name", "-"),
            "member_name": conflict_row.get("member_name", "-"),
            "member_code": "-",
            "region_name": conflict_row.get("region_name", "-"),
            "status": "unknown",
        }
    if not appt2_row:
        appt2_row = {
            "appointment_no": appt_no_2 or "-",
            "appointment_date": conflict_row.get("conflict_date", "-"),
            "start_time": conflict_row.get("conflict_end_time", "-"),
            "end_time": "-",
            "coach_name": conflict_row.get("coach_name", "-"),
            "member_name": "-",
            "member_code": "-",
            "region_name": conflict_row.get("region_name", "-"),
            "status": "unknown",
        }

    ctype_label = _conflict_type_label(conflict_row.get("conflict_type", "-"))
    sev_label = _severity_label(conflict_row.get("severity", "-"))
    sev_color = _severity_color(conflict_row.get("severity", "-"))

    return [
        html.Div([
            html.H3(f"冲突详情 - {conflict_row.get('conflict_no', '')}"),
            html.Button("✕", id="conflict-modal-close-btn",
                        className="btn btn-outline btn-sm",
                        style={"border": "none", "fontSize": "18px"}),
        ], className="modal-header"),

        html.Div([
            html.Div([
                html.Label("冲突类型", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Span(
                    ctype_label,
                    className="badge badge-primary",
                    style={"marginLeft": "8px", "fontSize": "13px"}
                ),
            ], style={"marginBottom": "8px"}),
            html.Div([
                html.Label("严重程度", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Span(
                    f"● {sev_label}",
                    style={"marginLeft": "8px", "color": sev_color, "fontWeight": "600"}
                ),
            ], style={"marginBottom": "8px"}),
            html.Div([
                html.Label("描述", style={"fontSize": "12px", "color": TEXT_SECONDARY}),
                html.Div(
                    str(conflict_row.get("description", "-")),
                    style={"marginTop": "4px", "padding": "10px",
                           "background": "#fafafa", "borderRadius": "6px",
                           "fontSize": "13px"}
                ),
            ]),
        ], style={"marginBottom": "20px"}),

        html.H4("冲突双方预约明细", style={
            "fontSize": "16px", "fontWeight": "600",
            "marginBottom": "16px", "paddingBottom": "8px",
            "borderBottom": "1px solid #e0e0e0"
        }),

        html.Div([
            _build_appointment_card(appt1_row, "预约 1", highlight=highlight1),
            html.Div(
                "⇄",
                style={
                    "textAlign": "center",
                    "fontSize": "28px",
                    "color": PRIMARY,
                    "margin": "12px 0",
                    "fontWeight": "bold",
                }
            ),
            _build_appointment_card(appt2_row, "预约 2", highlight=highlight2),
        ]),
    ]


def _empty_modal_body():
    return [
        html.Div([
            html.H3("冲突详情"),
            html.Button("✕", id="conflict-modal-close-btn",
                        className="btn btn-outline btn-sm",
                        style={"border": "none", "fontSize": "18px"}),
        ], className="modal-header"),
        render_empty("请在表格中选择一条冲突记录"),
    ]


def _filter_conflicts(conflicts_df: pd.DataFrame, filter_types, filter_severities,
                      filter_regions):
    if conflicts_df.empty:
        return conflicts_df
    df = conflicts_df.copy()
    if filter_types:
        df = df[df["conflict_type"].isin(filter_types)]
    if filter_severities:
        df = df[df["severity"].isin(filter_severities)]
    if filter_regions and "region_id" in df.columns:
        df = df[df["region_id"].isin(filter_regions)]
    return df


def _get_trigger_id():
    ctx = callback_context
    if not ctx.triggered:
        return ""
    return ctx.triggered[0]["prop_id"].split(".")[0]


def layout():
    start_date_default, end_date_default = default_date_range(30)
    region_options = _build_region_options()

    sidebar = create_layout("conflicts")

    extra_filters = _build_extra_filters()
    filter_bar = create_filter_bar(
        start_date_default=start_date_default,
        end_date_default=end_date_default,
        region_options=region_options,
        extra_filters=extra_filters,
        show_compare=False,
    )

    return html.Div([
        sidebar,
        html.Div([
            html.Div([
                html.H1("⚠️ 冲突检测"),
                html.P("检测并分析教练双约、会员双约及超容等预约冲突"),
            ], className="page-header"),

            filter_bar,

            dcc.Loading(
                id="conflicts-loading",
                type="circle",
                color=PRIMARY,
                children=[
                    html.Div(id="conflicts-kpi-container"),
                    html.Div([
                        html.Div([
                            html.Div([
                                html.Div([
                                    html.Div("冲突类型分布", className="card-title"),
                                ], className="card-header"),
                                dcc.Graph(id="conflicts-type-pie", config={"displayModeBar": False},
                                          style={"height": "300px"}),
                            ], className="card"),
                        ]),
                        html.Div([
                            html.Div([
                                html.Div([
                                    html.Div("冲突趋势", className="card-title"),
                                ], className="card-header"),
                                dcc.Graph(id="conflicts-trend-line", config={"displayModeBar": False},
                                          style={"height": "300px"}),
                            ], className="card"),
                        ]),
                        html.Div([
                            html.Div([
                                html.Div([
                                    html.Div("严重程度分布", className="card-title"),
                                ], className="card-header"),
                                dcc.Graph(id="conflicts-severity-bar", config={"displayModeBar": False},
                                          style={"height": "300px"}),
                            ], className="card"),
                        ]),
                    ], className="grid-3"),

                    html.Div([
                        html.Div([
                            html.Div([
                                html.Div([
                                    html.Div("冲突明细", className="card-title"),
                                    html.Div("点击行查看详情", className="card-subtitle"),
                                ], className="card-header"),
                                html.Div(id="conflicts-table-container"),
                            ], className="card"),
                        ]),
                    ]),
                ],
            ),

            html.Div(
                id="conflict-detail-modal",
                style={"display": "none"},
                children=[
                    html.Div(
                        className="modal-overlay",
                        id="conflict-modal-overlay",
                        children=[
                            html.Div(
                                className="modal-content",
                                id="conflict-modal-body-container",
                                children=_empty_modal_body(),
                            ),
                        ],
                    ),
                ],
            ),

            dcc.Store(id="conflicts-data-store"),
            dcc.Store(id="conflicts-appointments-store"),
            html.Div(id="conflicts-detect-toast", style={"display": "none"}),
        ], className="main-content"),
    ], className="app-container")


def register_callbacks(app):
    @app.callback(
        Output("conflicts-data-store", "data"),
        Output("conflicts-appointments-store", "data"),
        Output("conflicts-detect-toast", "children"),
        Input("filter-start-date", "date"),
        Input("filter-end-date", "date"),
        Input("conflicts-detect-btn", "n_clicks"),
        prevent_initial_call=False,
    )
    def load_conflicts_data(start_date_str, end_date_str, detect_clicks):
        if not start_date_str or not end_date_str:
            raise PreventUpdate

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
        toast_msg = None

        conflicts_df = get_conflicts_df(start_date, end_date)
        appointments_df = get_appointments_df(start_date, end_date)

        trigger_id = _get_trigger_id()
        if detect_clicks and trigger_id == "conflicts-detect-btn":
            try:
                schedules_df = get_schedules_df(start_date, end_date)
                detected = detect_conflicts(appointments_df, schedules_df, persist=True)
                if not detected.empty:
                    conflicts_df = get_conflicts_df(start_date, end_date)
                    toast_msg = html.Div(
                        f"✅ 检测完成，发现 {len(detected)} 个冲突",
                        style={
                            "position": "fixed", "top": "20px", "right": "20px",
                            "background": SUCCESS, "color": "#fff",
                            "padding": "12px 20px", "borderRadius": "6px",
                            "zIndex": "9999", "boxShadow": "0 4px 12px rgba(0,0,0,0.15)",
                            "fontWeight": "500",
                        }
                    )
                else:
                    toast_msg = html.Div(
                        "✅ 检测完成，未发现新冲突",
                        style={
                            "position": "fixed", "top": "20px", "right": "20px",
                            "background": INFO, "color": "#fff",
                            "padding": "12px 20px", "borderRadius": "6px",
                            "zIndex": "9999", "boxShadow": "0 4px 12px rgba(0,0,0,0.15)",
                            "fontWeight": "500",
                        }
                    )
            except Exception as e:
                toast_msg = html.Div(
                    f"❌ 检测失败: {str(e)}",
                    style={
                        "position": "fixed", "top": "20px", "right": "20px",
                        "background": DANGER, "color": "#fff",
                        "padding": "12px 20px", "borderRadius": "6px",
                        "zIndex": "9999", "boxShadow": "0 4px 12px rgba(0,0,0,0.15)",
                        "fontWeight": "500",
                    }
                )

        conflicts_records = conflicts_df.to_dict("records") if not conflicts_df.empty else []
        appt_records = appointments_df.to_dict("records") if not appointments_df.empty else []

        return conflicts_records, appt_records, toast_msg

    @app.callback(
        Output("conflicts-kpi-container", "children"),
        Output("conflicts-type-pie", "figure"),
        Output("conflicts-trend-line", "figure"),
        Output("conflicts-severity-bar", "figure"),
        Output("conflicts-table-container", "children"),
        Input("conflicts-data-store", "data"),
        Input("conflicts-filter-type", "value"),
        Input("conflicts-filter-severity", "value"),
        Input("filter-region", "value"),
    )
    def update_visualizations(conflicts_data, filter_types, filter_severities, filter_regions):
        if conflicts_data is None:
            conflicts_df = pd.DataFrame()
        else:
            conflicts_df = pd.DataFrame(conflicts_data)

        filtered_df = _filter_conflicts(conflicts_df, filter_types, filter_severities, filter_regions)

        kpi = _create_kpi_cards(filtered_df)
        pie_fig = _create_type_pie(filtered_df)
        line_fig = _create_trend_line(filtered_df)
        bar_fig = _create_severity_bar(filtered_df)
        table = _create_conflicts_table(filtered_df)

        return kpi, pie_fig, line_fig, bar_fig, table

    @app.callback(
        Output("conflict-detail-modal", "style"),
        Output("conflict-modal-body-container", "children"),
        Input("conflicts-detail-table", "active_cell"),
        Input("conflict-modal-close-btn", "n_clicks"),
        Input("conflict-modal-overlay", "n_clicks"),
        State("conflicts-detail-table", "derived_virtual_data"),
        State("conflicts-appointments-store", "data"),
        prevent_initial_call=True,
    )
    def toggle_modal(active_cell, close_clicks, overlay_clicks,
                     rows_data, appt_data):
        trigger_id = _get_trigger_id()

        if trigger_id == "":
            raise PreventUpdate

        is_closing = (
            trigger_id == "conflict-modal-close-btn" or
            trigger_id == "conflict-modal-overlay"
        )

        if is_closing:
            return {"display": "none"}, no_update

        if trigger_id == "conflicts-detail-table":
            if active_cell is None:
                raise PreventUpdate
            if not rows_data:
                return {"display": "flex"}, _empty_modal_body()

            row_idx = active_cell.get("row", 0)
            if row_idx < 0 or row_idx >= len(rows_data):
                return {"display": "flex"}, _empty_modal_body()

            conflict_row = rows_data[row_idx]
            appointments_df = pd.DataFrame(appt_data) if appt_data else pd.DataFrame()

            full_conflict = {}
            if "appointment_no_1" not in conflict_row and conflict_row.get("conflict_no"):
                try:
                    conflicts_df = get_conflicts_df(
                        date.fromisoformat("2000-01-01"),
                        date.fromisoformat("2099-12-31")
                    )
                    if not conflicts_df.empty:
                        match = conflicts_df[conflicts_df["conflict_no"] == conflict_row["conflict_no"]]
                        if not match.empty:
                            full_conflict = match.iloc[0].to_dict()
                except Exception:
                    pass

            display_row = {**conflict_row, **full_conflict}
            body = _create_modal_body(display_row, appointments_df)
            return {"display": "flex"}, body

        raise PreventUpdate


def register_page():
    return {
        "layout": layout,
        "register_callbacks": register_callbacks,
    }
