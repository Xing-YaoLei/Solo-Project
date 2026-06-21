from dash import html, dcc
import dash_bootstrap_components as dbc


def create_filter_bar():
    return dbc.Card([
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("景区", className="fw-bold"),
                    dcc.Dropdown(
                        id="filter-scenic-area",
                        placeholder="选择景区",
                        multi=True,
                        style={"width": "100%"},
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("日期范围", className="fw-bold"),
                    dcc.DatePickerRange(
                        id="filter-date-range",
                        start_date=None,
                        end_date=None,
                        display_format="YYYY-MM-DD",
                        style={"width": "100%"},
                    ),
                ], width=3),
                dbc.Col([
                    html.Label("票种", className="fw-bold"),
                    dcc.Dropdown(
                        id="filter-ticket-type",
                        placeholder="选择票种",
                        multi=True,
                        style={"width": "100%"},
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("渠道", className="fw-bold"),
                    dcc.Dropdown(
                        id="filter-channel",
                        placeholder="选择渠道",
                        multi=True,
                        style={"width": "100%"},
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("视图切换", className="fw-bold"),
                    dcc.Dropdown(
                        id="view-type-selector",
                        options=[
                            {"label": "日历时段", "value": "calendar_timeslot"},
                            {"label": "容量规则", "value": "capacity_rule"},
                            {"label": "冲突检测", "value": "conflict_detection"},
                        ],
                        value="calendar_timeslot",
                        clearable=False,
                        style={"width": "100%"},
                    ),
                ], width=3),
            ], className="g-2"),
            dbc.Row([
                dbc.Col([
                    dbc.ButtonGroup([
                        dbc.Button("刷新数据", id="btn-refresh", color="primary", size="sm"),
                        dbc.Button("保存视图", id="btn-save-view", color="secondary", size="sm"),
                        dbc.Button("下载报告", id="btn-download", color="success", size="sm"),
                    ], size="sm"),
                ], width="auto"),
                dbc.Col([
                    html.Span(id="last-refresh-time", className="text-muted ms-3", style={"fontSize": "0.85em"}),
                ], width="auto"),
            ], className="mt-2 g-2"),
        ]),
    ], className="mb-3")


def create_saved_view_modal():
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("保存当前视图")),
        dbc.ModalBody([
            dbc.Label("视图名称"),
            dbc.Input(id="save-view-name", placeholder="输入视图名称", className="mb-2"),
            dbc.Label("视图类型"),
            dbc.Select(
                id="save-view-type",
                options=[
                    {"label": "日历时段视图", "value": "calendar_timeslot"},
                    {"label": "容量规则视图", "value": "capacity_rule"},
                    {"label": "冲突检测视图", "value": "conflict_detection"},
                ],
                value="calendar_timeslot",
            ),
            dbc.Checkbox(id="save-view-shared", label="共享给团队", className="mt-2"),
        ]),
        dbc.ModalFooter([
            dbc.Button("取消", id="btn-cancel-save-view", className="ms-auto", color="secondary"),
            dbc.Button("保存", id="btn-confirm-save-view", className="ms-2", color="primary"),
        ]),
    ], id="save-view-modal", is_open=False)


def create_review_note_modal():
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("复盘说明")),
        dbc.ModalBody([
            dbc.Label("复盘内容"),
            dbc.Textarea(id="review-note-content", placeholder="输入复盘说明...", rows=4, className="mb-2"),
            html.Div(id="review-note-anomaly-info", className="text-muted mb-2"),
        ]),
        dbc.ModalFooter([
            dbc.Button("取消", id="btn-cancel-review-note", className="ms-auto", color="secondary"),
            dbc.Button("保存", id="btn-confirm-review-note", className="ms-2", color="primary"),
        ]),
    ], id="review-note-modal", is_open=False)


def create_conflict_time_range_alert():
    return dbc.Alert(
        id="conflict-time-range-alert",
        children="",
        color="warning",
        is_open=False,
        dismissable=True,
    )
