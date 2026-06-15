import pandas as pd
from datetime import datetime, timedelta, date
from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px

from app.models import Course

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


def get_course_options():
    courses = Course.query.filter_by(is_active=True).order_by(Course.course_code).all()
    return [{"label": f"{c.course_code} - {c.course_name}", "value": c.id} for c in courses]


def create_metric_card(title, value, subtitle="", icon="fa-chart-line", color=COLORS["primary"], **kwargs):
    return dbc.Card(
        [
            dbc.CardBody(
                [
                    html.Div(
                        [
                            html.Div(
                                html.I(className=f"fas {icon} fa-2x", style={"color": color}),
                                className="me-3",
                            ),
                            html.Div(
                                [
                                    html.H6(
                                        title,
                                        className="text-muted mb-1",
                                        style={"fontSize": "0.875rem"},
                                    ),
                                    html.H4(
                                        value,
                                        className="mb-0",
                                        style={"fontWeight": "700", "color": COLORS["text"]},
                                    ),
                                    html.Small(
                                        subtitle,
                                        className="text-muted",
                                        style={"fontSize": "0.75rem"},
                                    ),
                                ]
                            ),
                        ],
                        className="d-flex align-items-center",
                    )
                ]
            )
        ],
        className="h-100 shadow-sm border-0",
        **kwargs
    )


def create_funnel_chart(funnel_data):
    if not funnel_data:
        return go.Figure()

    fig = go.Figure(
        go.Funnel(
            name="漏斗分析",
            y=[stage["name"] for stage in funnel_data],
            x=[stage["count"] for stage in funnel_data],
            text=[
                f"{stage['count']}人<br>转化率: {stage['conversion_from_prev']:.1f}%"
                for stage in funnel_data
            ],
            textinfo="text",
            textposition="inside",
            marker={
                "color": [
                    COLORS["primary"],
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    COLORS["success"],
                    "#22c55e",
                    "#86efac",
                ]
            },
            connector={"line": {"color": COLORS["border"], "width": 2}},
        )
    )

    fig.update_layout(
        title={
            "text": "课程转化漏斗分析",
            "font": {"size": 18, "color": COLORS["text"]},
            "y": 0.95,
        },
        margin=dict(l=20, r=20, t=60, b=20),
        paper_bgcolor="white",
        plot_bgcolor="white",
        height=450,
    )

    return fig


def create_completion_rate_chart(df):
    if df.empty:
        return go.Figure()

    df_plot = df.copy()
    df_plot["status_color"] = df_plot["progress_warning"].apply(
        lambda x: COLORS["danger"] if x else COLORS["success"]
    )

    fig = px.scatter(
        df_plot,
        x="completion_rate",
        y="total_score",
        color="status_color",
        color_discrete_map="identity",
        hover_data={
            "name": True,
            "course_name": True,
            "completion_rate": ":,.1f",
            "total_score": ":,.1f",
            "progress_warning": True,
            "status_color": False,
        },
        labels={
            "completion_rate": "完成率 (%)",
            "total_score": "总成绩",
            "name": "学生姓名",
            "course_name": "课程名称",
            "progress_warning": "进度落后",
        },
    )

    fig.update_traces(marker=dict(size=10, line=dict(width=1, color=COLORS["border"])))

    fig.update_layout(
        title={
            "text": "完成率 vs 总成绩分布",
            "font": {"size": 16, "color": COLORS["text"]},
        },
        xaxis_title="完成率 (%)",
        yaxis_title="总成绩",
        margin=dict(l=60, r=20, t=60, b=60),
        paper_bgcolor="white",
        plot_bgcolor="white",
        height=400,
        showlegend=False,
    )

    fig.add_shape(
        type="line",
        x0=80,
        y0=0,
        x1=80,
        y1=100,
        line=dict(color=COLORS["warning"], width=2, dash="dash"),
    )

    fig.add_shape(
        type="line",
        x0=0,
        y0=60,
        x1=100,
        y1=60,
        line=dict(color=COLORS["warning"], width=2, dash="dash"),
    )

    return fig


def create_progress_trend_chart():
    return go.Figure()


def create_students_table(df):
    if df.empty:
        return dash_table.DataTable(
            columns=[{"name": "提示", "id": "message"}],
            data=[{"message": "暂无数据，请调整筛选条件"}],
            style_cell={"textAlign": "center", "padding": "12px"},
            style_header={"backgroundColor": COLORS["primary"], "color": "white", "fontWeight": "bold"},
        )

    df_display = df.copy()
    df_display["enroll_date"] = pd.to_datetime(df_display["enroll_date"]).dt.strftime("%Y-%m-%d")
    df_display["progress_warning"] = df_display["progress_warning"].map(
        {True: "⚠️ 落后", False: "正常"}
    )
    df_display["is_pass"] = df_display["is_pass"].map({True: "✅ 合格", False: "未合格"})
    df_display["status"] = df_display["status"].map(
        {
            "in_progress": "学习中",
            "completed": "已完成",
            "not_started": "未开始",
            "dropped": "已退学",
        }
    )

    style_data_conditional = [
        {
            "if": {"filter_query": "{progress_warning} = '⚠️ 落后'"},
            "backgroundColor": "#fef2f2",
            "color": COLORS["danger"],
            "fontWeight": "bold",
        },
        {
            "if": {"filter_query": "{completion_rate} < 30"},
            "backgroundColor": "#fef3c7",
        },
    ]

    return dash_table.DataTable(
        id="students-table",
        columns=[
            {"name": "学号", "id": "student_code"},
            {"name": "姓名", "id": "name"},
            {"name": "专业", "id": "major"},
            {"name": "课程", "id": "course_name"},
            {"name": "报名日期", "id": "enroll_date"},
            {"name": "状态", "id": "status"},
            {"name": "完成率(%)", "id": "completion_rate", "type": "numeric", "format": {"specifier": ".1f"}},
            {"name": "总成绩", "id": "total_score", "type": "numeric", "format": {"specifier": ".1f"}},
            {"name": "是否合格", "id": "is_pass"},
            {"name": "进度状态", "id": "progress_warning"},
            {"name": "grade_id", "id": "id", "hideable": True},
        ],
        data=df_display.to_dict("records"),
        row_selectable="single",
        selected_rows=[],
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
        style_data_conditional=style_data_conditional,
        style_table={"overflowX": "auto", "maxHeight": "500px"},
        style_as_list_view=False,
        page_size=20,
        sort_action="native",
        filter_action="native",
    )


def create_layout():
    course_options = get_course_options()
    return html.Div(
        [
            dcc.Store(id="filter-store", data={}),
            dcc.Interval(id="refresh-interval", interval=5 * 60 * 1000, n_intervals=0),
            html.Div(
                [
                    html.Div(
                        [
                            html.H2(
                                [
                                html.I(className="fas fa-graduation-cap me-2"),
                                "职业教育在线课程漏斗报表",
                            ],
                            className="mb-0 text-white",
                        ),
                        html.P(
                            "早会复盘 · 数据驱动决策",
                            className="text-white-50 mb-0 mt-1",
                        ),
                    ],
                    className="flex-grow-1",
                ),
                html.Div(
                    [
                        dbc.Button(
                            [
                                html.I(className="fas fa-sync-alt me-2"),
                                "刷新数据",
                            ],
                            id="refresh-btn",
                            color="light",
                            className="me-2",
                            outline=False,
                        ),
                        dbc.Button(
                            [
                                html.I(className="fas fa-download me-2"),
                                "导出报表",
                            ],
                            id="export-btn",
                            color="success",
                            className="me-2",
                        ),
                        dbc.Button(
                            [
                                html.I(className="fas fa-play-circle me-2"),
                                "早会模式",
                            ],
                            id="morning-mode-btn",
                            color="warning",
                            className="text-dark",
                        ),
                    ],
                    className="d-flex align-items-center",
                ),
            ],
            className="d-flex align-items-center justify-content-between p-4 mb-4 rounded-3",
            style={
                "background": f"linear-gradient(135deg, {COLORS['primary']} 0%, #1e40af 100%)",
                "boxShadow": "0 4px 20px rgba(37, 99, 235, 0.3)",
            },
        ),
        dbc.Card(
            [
                dbc.CardHeader(
                    [
                        html.I(className="fas fa-filter me-2"),
                        "筛选条件",
                    ],
                    className="bg-white border-bottom",
                    style={"fontWeight": "600"},
                ),
                dbc.CardBody(
                    [
                        dbc.Row(
                            [
                                dbc.Col(
                                    [
                                        html.Label("选择课程", className="form-label fw-medium"),
                                        dcc.Dropdown(
                                            id="course-filter",
                                            options=course_options,
                                            multi=True,
                                            placeholder="全部课程",
                                            className="mb-2",
                                        ),
                                    ],
                                    md=4,
                                ),
                                dbc.Col(
                                    [
                                        html.Label("专业", className="form-label fw-medium"),
                                        dcc.Dropdown(
                                            id="major-filter",
                                            options=[],
                                            placeholder="全部专业",
                                            className="mb-2",
                                        ),
                                    ],
                                    md=2,
                                ),
                                dbc.Col(
                                    [
                                        html.Label("报名日期", className="form-label fw-medium"),
                                        dcc.DatePickerRange(
                                            id="date-filter",
                                            start_date=(datetime.now() - timedelta(days=90)).date(),
                                            end_date=datetime.now().date(),
                                            display_format="YYYY-MM-DD",
                                            className="w-100",
                                        ),
                                    ],
                                    md=3,
                                ),
                                dbc.Col(
                                    [
                                        html.Label("学习状态", className="form-label fw-medium"),
                                        dbc.Checklist(
                                            id="status-filter",
                                            options=[
                                                {"label": "学习中", "value": "in_progress"},
                                                {"label": "已完成", "value": "completed"},
                                                {"label": "未开始", "value": "not_started"},
                                            ],
                                            value=["in_progress", "completed"],
                                            inline=True,
                                            className="mt-2",
                                        ),
                                    ],
                                    md=2,
                                ),
                                dbc.Col(
                                    [
                                        html.Label("快速筛选", className="form-label fw-medium"),
                                        dbc.Switch(
                                            id="warning-only-switch",
                                            label="仅显示进度落后",
                                            value=False,
                                            className="mt-2",
                                        ),
                                    ],
                                    md=1,
                                ),
                            ],
                            className="align-items-end",
                        ),
                    ]
                ),
            ],
            className="mb-4 shadow-sm border-0",
        ),
        dbc.Row(
            [
                dbc.Col(
                    create_metric_card(
                        "报名总人数",
                        id="metric-enrolled",
                        value="--",
                        subtitle="筛选范围内",
                        icon="fa-users",
                        color=COLORS["primary"],
                    ),
                    md=2,
                ),
                dbc.Col(
                    create_metric_card(
                        "课程完成率",
                        id="metric-completion",
                        value="--%",
                        subtitle="已完成/总报名",
                        icon="fa-check-circle",
                        color=COLORS["success"],
                    ),
                    md=2,
                ),
                dbc.Col(
                    create_metric_card(
                        "成绩合格率",
                        id="metric-pass-rate",
                        value="--%",
                        subtitle="合格/已完成",
                        icon="fa-award",
                        color=COLORS["info"],
                    ),
                    md=2,
                ),
                dbc.Col(
                    create_metric_card(
                        "就业率",
                        id="metric-employment",
                        value="--%",
                        subtitle="就业/已完成",
                        icon="fa-briefcase",
                        color="#8b5cf6",
                    ),
                    md=2,
                ),
                dbc.Col(
                    create_metric_card(
                        "平均学习时长",
                        id="metric-duration",
                        value="--分钟",
                        subtitle="人均学习时长",
                        icon="fa-clock",
                        color=COLORS["warning"],
                    ),
                    md=2,
                ),
                dbc.Col(
                    create_metric_card(
                        "进度落后预警",
                        id="metric-warning",
                        value="--人",
                        subtitle="需要关注",
                        icon="fa-exclamation-triangle",
                        color=COLORS["danger"],
                    ),
                    md=2,
                ),
            ],
            className="mb-4 g-3",
        ),
        dbc.Row(
            [
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardBody(
                                    [
                                        dcc.Graph(
                                            id="funnel-chart",
                                            figure=create_funnel_chart([]),
                                            config={"displayModeBar": False},
                                        )
                                    ]
                                )
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
                                dbc.CardBody(
                                    [
                                        dcc.Graph(
                                            id="scatter-chart",
                                            figure=create_completion_rate_chart(pd.DataFrame()),
                                            config={"displayModeBar": False},
                                        )
                                    ]
                                )
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
                        html.Div(
                            [
                                html.I(className="fas fa-list me-2"),
                                "学生成绩明细",
                                html.Span(
                                    "（点击行可查看详情并添加备注）",
                                    className="text-muted ms-2",
                                    style={"fontSize": "0.875rem", "fontWeight": "normal"},
                                ),
                            ],
                            className="d-flex align-items-center",
                        )
                    ],
                    className="bg-white border-bottom",
                    style={"fontWeight": "600"},
                ),
                dbc.CardBody(
                    [
                        html.Div(id="students-table-container"),
                        html.Div(
                            [
                                dbc.Button(
                                    [
                                        html.I(className="fas fa-search-plus me-2"),
                                        "查看详情",
                                    ],
                                    id="drilldown-btn",
                                    color="primary",
                                    disabled=True,
                                ),
                            ],
                            className="mt-3 d-flex justify-content-end",
                        ),
                    ]
                ),
            ],
            className="mb-4 shadow-sm border-0",
        ),
        dbc.Modal(
            [
                dbc.ModalHeader(dbc.ModalTitle("快速添加备注")),
                dbc.ModalBody(
                    [
                        html.Div(id="note-student-info", className="mb-3"),
                        dbc.Textarea(
                            id="note-content",
                            placeholder="请输入备注内容...",
                            rows=4,
                            className="mb-3",
                        ),
                        dbc.Select(
                            id="note-type",
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
                        dbc.Button("取消", id="note-cancel", color="secondary"),
                        dbc.Button("保存", id="note-save", color="primary"),
                    ]
                ),
            ],
            id="note-modal",
            is_open=False,
        ),
        dbc.Toast(
            id="toast",
            header="提示",
            is_open=False,
            duration=4000,
            style={"position": "fixed", "top": 66, "right": 10, "zIndex": 9999},
        ),
        dcc.Download(id="download-report"),
        html.Div(id="nav-placeholder", style={"display": "none"}),
    ],
    style={"backgroundColor": COLORS["background"], "minHeight": "100vh", "padding": "20px"},
    )

