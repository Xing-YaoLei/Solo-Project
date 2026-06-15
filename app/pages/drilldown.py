import pandas as pd
from datetime import datetime
from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px

COLORS = {
    "primary": "#2563eb",
    "success": "#16a34a",
    "warning": "#f59e0b",
    "danger": "#dc2626",
    "info": "#0891b2",
    "background": "#f8fafc",
    "card": "#ffffff",
    "text": "#1e293b",
    "text_light": "#64748b",
    "border": "#e2e8f0",
}


def create_info_card(title, value, icon="fa-info-circle", color=COLORS["primary"]):
    return dbc.Card(
        [
            dbc.CardBody(
                [
                    html.Div(
                        [
                            html.I(className=f"fas {icon} fa-lg me-2", style={"color": color}),
                            html.Span(title, className="text-muted me-2"),
                        ],
                        className="mb-1",
                        style={"fontSize": "0.875rem"},
                    ),
                    html.H5(value, className="mb-0", style={"fontWeight": "600"}),
                ],
                className="p-3",
            )
        ],
        className="h-100 shadow-sm border-0",
    )


def create_chapter_progress_chart(df):
    if df.empty:
        return go.Figure()

    colors = df["progress_percent"].apply(
        lambda x: COLORS["danger"] if x < 50 else COLORS["warning"] if x < 80 else COLORS["success"]
    )

    fig = go.Figure(
        go.Bar(
            x=df["chapter_number"].astype(str) + " " + df["chapter_name"],
            y=df["progress_percent"],
            marker_color=colors,
            text=df["progress_percent"].round(1).astype(str) + "%",
            textposition="auto",
        )
    )

    fig.update_layout(
        title={
            "text": "各章节学习进度",
            "font": {"size": 16, "color": COLORS["text"]},
        },
        xaxis_title="章节",
        yaxis_title="完成率 (%)",
        yaxis_range=[0, 100],
        margin=dict(l=60, r=20, t=60, b=120),
        paper_bgcolor="white",
        plot_bgcolor="white",
        height=400,
    )

    fig.update_xaxes(tickangle=45)

    return fig


def create_study_duration_chart(df):
    if df.empty:
        return go.Figure()

    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            name="计划时长",
            x=df["chapter_number"].astype(str) + " " + df["chapter_name"],
            y=df["duration_minutes"],
            marker_color=COLORS["info"],
            opacity=0.6,
        )
    )

    fig.add_trace(
        go.Bar(
            name="实际学习时长",
            x=df["chapter_number"].astype(str) + " " + df["chapter_name"],
            y=df["actual_duration"],
            marker_color=COLORS["primary"],
        )
    )

    fig.update_layout(
        title={
            "text": "学习时长对比（分钟）",
            "font": {"size": 16, "color": COLORS["text"]},
        },
        xaxis_title="章节",
        yaxis_title="时长（分钟）",
        barmode="group",
        margin=dict(l=60, r=20, t=60, b=120),
        paper_bgcolor="white",
        plot_bgcolor="white",
        height=400,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )

    fig.update_xaxes(tickangle=45)

    return fig


def create_rules_table(rules):
    if not rules:
        return html.Div("暂无提醒规则", className="text-center p-4 text-muted")

    df = pd.DataFrame(rules)

    return dash_table.DataTable(
        columns=[
            {"name": "规则名称", "id": "rule_name"},
            {"name": "规则类型", "id": "rule_type"},
            {"name": "指标类型", "id": "threshold_type"},
            {"name": "条件", "id": "comparison_text"},
            {"name": "阈值", "id": "threshold_value"},
            {"name": "时间窗口", "id": "time_window_days"},
            {"name": "提醒内容", "id": "reminder_message"},
        ],
        data=df.to_dict("records"),
        style_cell={
            "textAlign": "left",
            "padding": "10px 12px",
            "fontSize": "13px",
            "border": f"1px solid {COLORS['border']}",
        },
        style_header={
            "backgroundColor": COLORS["primary"],
            "color": "white",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": "12px",
        },
        style_table={"overflowX": "auto"},
        style_data_conditional=[
            {
                "if": {"column_id": "threshold_value"},
                "fontWeight": "bold",
                "color": COLORS["danger"],
            }
        ],
    )


def create_chapter_table(df):
    if df.empty:
        return html.Div("暂无章节数据", className="text-center p-4 text-muted")

    df_display = df.copy()
    df_display["is_required"] = df_display["is_required"].map({True: "是", False: "否"})
    df_display["completion_status"] = df_display["completion_status"].map(
        {
            "completed": "已完成",
            "in_progress": "学习中",
            "not_started": "未开始",
            "failed": "未通过",
        }
    )

    def get_progress_color(progress):
        if progress < 50:
            return {"backgroundColor": "#fef2f2", "color": COLORS["danger"]}
        elif progress < 80:
            return {"backgroundColor": "#fef3c7", "color": COLORS["warning"]}
        else:
            return {"backgroundColor": "#f0fdf4", "color": COLORS["success"]}

    style_data_conditional = []
    for i, progress in enumerate(df_display["progress_percent"]):
        color = get_progress_color(progress)
        style_data_conditional.append(
            {
                "if": {"row_index": i, "column_id": "progress_percent"},
                **color,
                "fontWeight": "bold",
            }
        )

    return dash_table.DataTable(
        columns=[
            {"name": "章号", "id": "chapter_number"},
            {"name": "章节名称", "id": "chapter_name"},
            {"name": "必修", "id": "is_required"},
            {"name": "及格分数", "id": "pass_score"},
            {"name": "完成状态", "id": "completion_status"},
            {"name": "完成率(%)", "id": "progress_percent", "type": "numeric", "format": {"specifier": ".1f"}},
            {"name": "测验分数", "id": "quiz_score", "type": "numeric", "format": {"specifier": ".1f"}},
            {"name": "计划时长", "id": "duration_minutes"},
            {"name": "实际时长", "id": "actual_duration"},
            {"name": "首次访问", "id": "first_access_time"},
            {"name": "最后访问", "id": "last_access_time"},
        ],
        data=df_display.to_dict("records"),
        style_cell={
            "textAlign": "center",
            "padding": "10px 12px",
            "fontSize": "13px",
            "border": f"1px solid {COLORS['border']}",
        },
        style_header={
            "backgroundColor": COLORS["primary"],
            "color": "white",
            "fontWeight": "bold",
            "padding": "12px",
        },
        style_data_conditional=style_data_conditional,
        style_table={"overflowX": "auto"},
        sort_action="native",
    )


def create_notes_list(notes):
    if not notes:
        return html.Div("暂无备注", className="text-center p-4 text-muted")

    note_type_map = {
        "general": "通用备注",
        "study_followup": "学习跟进",
        "career_guidance": "就业指导",
        "counseling": "心理辅导",
    }

    note_type_color = {
        "general": COLORS["info"],
        "study_followup": COLORS["primary"],
        "career_guidance": COLORS["success"],
        "counseling": COLORS["warning"],
    }

    return html.Div(
        [
            dbc.Card(
                [
                    dbc.CardHeader(
                        [
                            html.Span(
                                note_type_map.get(note["note_type"], note["note_type"]),
                                className="badge me-2",
                                style={
                                    "backgroundColor": note_type_color.get(
                                        note["note_type"], COLORS["info"]
                                    )
                                },
                            ),
                            html.Small(
                                f"{note['created_by']} · {note['created_at']}",
                                className="text-muted",
                            ),
                        ],
                        className="bg-white py-2",
                    ),
                    dbc.CardBody(
                        html.P(note["content"], className="mb-0", style={"whiteSpace": "pre-wrap"})
                    ),
                ],
                className="mb-3 shadow-sm",
            )
            for note in notes
        ]
    )


def create_samples_tables(samples):
    if not samples:
        return html.Div("暂无原始样本数据", className="text-center p-4 text-muted")

    tabs = []

    if "lms_records" in samples and not samples["lms_records"].empty:
        df = samples["lms_records"]
        tabs.append(
            dcc.Tab(
                label="LMS学习记录",
                children=[
                    html.Div(
                        [
                            dash_table.DataTable(
                                columns=[{"name": col, "id": col} for col in df.columns],
                                data=df.to_dict("records"),
                                style_cell={
                                    "textAlign": "left",
                                    "padding": "8px 12px",
                                    "fontSize": "12px",
                                    "border": f"1px solid {COLORS['border']}",
                                },
                                style_header={
                                    "backgroundColor": COLORS["primary"],
                                    "color": "white",
                                    "fontWeight": "bold",
                                },
                                style_table={"overflowX": "auto", "maxHeight": "400px"},
                                page_size=10,
                                sort_action="native",
                            )
                        ],
                        className="p-3",
                    )
                ],
            )
        )

    if "live_sessions" in samples and not samples["live_sessions"].empty:
        df = samples["live_sessions"]
        tabs.append(
            dcc.Tab(
                label="直播观看记录",
                children=[
                    html.Div(
                        [
                            dash_table.DataTable(
                                columns=[{"name": col, "id": col} for col in df.columns],
                                data=df.to_dict("records"),
                                style_cell={
                                    "textAlign": "left",
                                    "padding": "8px 12px",
                                    "fontSize": "12px",
                                    "border": f"1px solid {COLORS['border']}",
                                },
                                style_header={
                                    "backgroundColor": COLORS["primary"],
                                    "color": "white",
                                    "fontWeight": "bold",
                                },
                                style_table={"overflowX": "auto", "maxHeight": "400px"},
                                page_size=10,
                                sort_action="native",
                            )
                        ],
                        className="p-3",
                    )
                ],
            )
        )

    if "employment" in samples and not samples["employment"].empty:
        df = samples["employment"]
        tabs.append(
            dcc.Tab(
                label="就业记录",
                children=[
                    html.Div(
                        [
                            dash_table.DataTable(
                                columns=[{"name": col, "id": col} for col in df.columns],
                                data=df.to_dict("records"),
                                style_cell={
                                    "textAlign": "left",
                                    "padding": "8px 12px",
                                    "fontSize": "12px",
                                    "border": f"1px solid {COLORS['border']}",
                                },
                                style_header={
                                    "backgroundColor": COLORS["primary"],
                                    "color": "white",
                                    "fontWeight": "bold",
                                },
                                style_table={"overflowX": "auto", "maxHeight": "400px"},
                                page_size=10,
                                sort_action="native",
                            )
                        ],
                        className="p-3",
                    )
                ],
            )
        )

    if not tabs:
        return html.Div("暂无原始样本数据", className="text-center p-4 text-muted")

    return dcc.Tabs(tabs)


def create_layout():
    return html.Div(
        [
            html.Div(
                [
                html.Div(
                    [
                        dcc.Link(
                            [
                                html.I(className="fas fa-arrow-left me-2"),
                                "返回概览",
                            ],
                            href="/",
                            className="btn btn-light me-3",
                        ),
                        html.H4(
                            [
                                html.I(className="fas fa-user-graduate me-2"),
                                "学生学习详情",
                            ],
                            className="mb-0",
                            id="drilldown-title",
                        ),
                    ],
                    className="d-flex align-items-center",
                ),
                html.Div(
                    [
                        dbc.Button(
                            [
                                html.I(className="fas fa-plus me-2"),
                                "添加备注",
                            ],
                            id="add-note-btn",
                            color="primary",
                            className="me-2",
                        ),
                        dbc.Button(
                            [
                                html.I(className="fas fa-sync me-2"),
                                "刷新",
                            ],
                            id="drilldown-refresh-btn",
                            color="secondary",
                        ),
                    ]
                ),
            ],
            className="d-flex align-items-center justify-content-between mb-4 p-3 bg-white rounded-3 shadow-sm",
        ),
        html.Div(id="student-info-alert"),
        dbc.Row(
            [
                dbc.Col(create_info_card("学号", "--", "fa-id-card", COLORS["primary"]), md=2, id="info-student-code"),
                dbc.Col(create_info_card("姓名", "--", "fa-user", COLORS["success"]), md=2, id="info-student-name"),
                dbc.Col(create_info_card("专业", "--", "fa-book", COLORS["info"]), md=2, id="info-major"),
                dbc.Col(create_info_card("班级", "--", "fa-users", COLORS["warning"]), md=2, id="info-class"),
                dbc.Col(create_info_card("完成率", "--%", "fa-chart-line", COLORS["danger"]), md=2, id="info-completion"),
                dbc.Col(create_info_card("总成绩", "--", "fa-award", "#8b5cf6"), md=2, id="info-score"),
            ],
            className="mb-4 g-3",
        ),
        dbc.Row(
            [
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardHeader(
                                    [
                                        html.I(className="fas fa-bell me-2"),
                                        "匹配的提醒规则",
                                    ],
                                    className="bg-white border-bottom",
                                    style={"fontWeight": "600"},
                                ),
                                dbc.CardBody(id="rules-container"),
                            ],
                            className="shadow-sm border-0 h-100",
                        )
                    ],
                    lg=6,
                    className="mb-4",
                ),
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardHeader(
                                    [
                                        html.I(className="fas fa-tasks me-2"),
                                        "课程章节进度",
                                    ],
                                    className="bg-white border-bottom",
                                    style={"fontWeight": "600"},
                                ),
                                dbc.CardBody(dcc.Graph(id="chapter-chart", figure=go.Figure(), config={"displayModeBar": False})),
                            ],
                            className="shadow-sm border-0 h-100",
                        )
                    ],
                    lg=6,
                    className="mb-4",
                ),
            ]
        ),
        dbc.Row(
            [
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardHeader(
                                    [
                                        html.I(className="fas fa-clock me-2"),
                                        "学习时长对比",
                                    ],
                                    className="bg-white border-bottom",
                                    style={"fontWeight": "600"},
                                ),
                                dbc.CardBody(
                                    dcc.Graph(
                                        id="duration-chart",
                                        figure=go.Figure(),
                                        config={"displayModeBar": False},
                                    )
                                ),
                            ],
                            className="shadow-sm border-0 h-100",
                        )
                    ],
                    lg=6,
                    className="mb-4",
                ),
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardHeader(
                                    [
                                        html.I(className="fas fa-sticky-note me-2"),
                                        "历史备注",
                                        html.Span(
                                            id="notes-count-badge",
                                            className="badge bg-primary ms-2",
                                            children="0",
                                        ),
                                    ],
                                    className="bg-white border-bottom d-flex align-items-center",
                                    style={"fontWeight": "600"},
                                ),
                                dbc.CardBody(
                                    id="notes-container",
                                    style={"maxHeight": "350px", "overflowY": "auto"},
                                ),
                            ],
                            className="shadow-sm border-0 h-100",
                        )
                    ],
                    lg=6,
                    className="mb-4",
                ),
            ]
        ),
        dbc.Card(
            [
                dbc.CardHeader(
                    [
                        html.I(className="fas fa-list-ol me-2"),
                        "章节学习明细",
                    ],
                    className="bg-white border-bottom",
                    style={"fontWeight": "600"},
                ),
                dbc.CardBody(id="chapter-table-container"),
            ],
            className="mb-4 shadow-sm border-0",
        ),
        dbc.Card(
            [
                dbc.CardHeader(
                    [
                        html.I(className="fas fa-database me-2"),
                        "原始样本数据",
                        html.Span(
                            "（LMS记录、直播记录、就业记录）",
                            className="text-muted ms-2",
                            style={"fontSize": "0.875rem", "fontWeight": "normal"},
                        ),
                    ],
                    className="bg-white border-bottom",
                    style={"fontWeight": "600"},
                ),
                dbc.CardBody(id="samples-container"),
            ],
            className="mb-4 shadow-sm border-0",
        ),
        dbc.Modal(
            [
                dbc.ModalHeader(dbc.ModalTitle("添加备注")),
                dbc.ModalBody(
                    [
                        dbc.Textarea(
                            id="drilldown-note-content",
                            placeholder="请输入备注内容...",
                            rows=5,
                            className="mb-3",
                        ),
                        dbc.Select(
                            id="drilldown-note-type",
                            options=[
                                {"label": "通用备注", "value": "general"},
                                {"label": "学习跟进", "value": "study_followup"},
                                {"label": "就业指导", "value": "career_guidance"},
                                {"label": "心理辅导", "value": "counseling"},
                            ],
                            value="general",
                        ),
                    ]
                ),
                dbc.ModalFooter(
                    [
                        dbc.Button("取消", id="drilldown-note-cancel", color="secondary"),
                        dbc.Button("保存", id="drilldown-note-save", color="primary"),
                    ]
                ),
            ],
            id="drilldown-note-modal",
            is_open=False,
        ),
        dbc.Toast(
            id="drilldown-toast",
            header="提示",
            is_open=False,
            duration=4000,
            style={"position": "fixed", "top": 66, "right": 10, "zIndex": 9999},
        ),
    ],
    style={"backgroundColor": COLORS["background"], "minHeight": "100vh", "padding": "20px"},
    )

