import os
import sys
import io
import base64
import logging
from datetime import datetime, date

import dash
from dash import dcc, html, Input, Output, State, callback_context, no_update, dash_table
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np

from config import Config
from utils import MockDataService, ReportExporter
from app.charts import (
    create_funnel_chart,
    create_duration_histogram,
    create_college_barchart,
    create_conflict_heatmap,
    create_stage_duration_chart,
    create_status_piechart,
    create_anomaly_trend,
    create_gauge_chart,
    create_duration_heatmap,
    PALETTE,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    ds = MockDataService()
    exporter = ReportExporter(ds)
    logger.info("MockDataService 初始化成功")
except Exception as e:
    logger.error(f"数据服务初始化失败: {e}")
    raise


app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap"
    ],
    suppress_callback_exceptions=True,
    title="高校教务选课排课漏斗分析",
    meta_tags=[
        {"name": "viewport", "content": "width=device-width, initial-scale=1"},
    ],
)

server = app.server

# ============== 数据初始化 ==============
_TERMS = Config.ACADEMIC_TERMS
_COLLEGES = ["计算机学院", "数学学院", "物理学院", "外语学院", "经济学院", "管理学院"]
_COURSE_TYPES = ["必修", "选修", "公选"]
_STATUSES = [
    "已浏览", "已提交", "初审中", "初审通过", "初审驳回",
    "排课中", "已排课", "终审中", "终审通过", "终审驳回", "选课成功", "已取消"
]

# ============== 辅助函数 ==============

def _kpi_card(title, value, subtitle=None, icon="📊", color=PALETTE["primary"]):
    return dbc.Card([
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Div(icon, className="h1 mb-2", style={"color": color, "fontSize": "2rem"}),
                    html.Div(title, className="text-muted mb-1", style={"fontSize": "12px"}),
                    html.Div(value, className="mb-1", style={
                        "fontSize": "26px",
                        "fontWeight": "700",
                        "color": PALETTE["text"],
                        "fontFamily": "Noto Sans SC",
                        "letterSpacing": "-0.5px",
                    }),
                    html.Div(subtitle, className="text-muted", style={"fontSize": "11px"}) if subtitle else None,
                ])
            ])
        ], className="px-3 py-2", style={"border": "none"})
    ], style={
        "border": f"1px solid {color}22",
        "borderLeft": f"4px solid {color}",
        "borderRadius": "10px",
        "boxShadow": "0 2px 8px rgba(0,0,0,0.04)",
        "background": "white",
    }, className="mb-0")


def _tag(text, color="primary"):
    color_map = {
        "primary": PALETTE["primary"],
        "success": PALETTE["success"],
        "warning": PALETTE["warning"],
        "danger": PALETTE["error"],
        "info": PALETTE["cyan"],
        "purple": PALETTE["purple"],
    }
    c = color_map.get(color, color)
    return html.Span(text, className="badge rounded-pill px-2 py-1", style={
        "backgroundColor": f"{c}20",
        "color": c,
        "fontWeight": "500",
        "fontSize": "11px",
        "border": f"1px solid {c}44",
    })


def _severity_badge(sev):
    if sev == "高":
        return _tag(f"🔴 {sev}", "danger")
    elif sev == "中":
        return _tag(f"🟠 {sev}", "warning")
    else:
        return _tag(f"🟢 {sev}", "success")


def _conflict_status_badge(s):
    if s == "未处理":
        return _tag(s, "danger")
    elif s == "处理中":
        return _tag(s, "warning")
    else:
        return _tag(s, "success")


def _style_table(columns, data, title, id_prefix, height=380, row_selectable="single",
                 highlight_col=None, highlight_val=None):
    style_data_conditional = []

    if highlight_col and highlight_val is not None:
        style_data_conditional.append({
            "if": {
                "filter_query": f"{{{highlight_col}}} = {highlight_val}"
                               if isinstance(highlight_val, (int, float))
                               else f'{{{highlight_col}}} contains "{highlight_val}"',
            },
            "backgroundColor": f"{PALETTE['error']}12",
            "borderLeft": f"4px solid {PALETTE['error']}",
            "fontWeight": "500",
        })

    if "is_conflict" in [c["id"] for c in columns]:
        style_data_conditional.append({
            "if": {"filter_query": "{is_conflict} = 1"},
            "backgroundColor": f"{PALETTE['error']}10",
            "borderLeft": f"4px solid {PALETTE['error']}",
        })

    if "has_conflict" in [c["id"] for c in columns]:
        style_data_conditional.append({
            "if": {"filter_query": "{has_conflict} = 1"},
            "backgroundColor": f"{PALETTE['error']}10",
            "borderLeft": f"4px solid {PALETTE['error']}",
        })

    style_header = {
        "backgroundColor": "#FAFBFC",
        "fontWeight": "600",
        "fontSize": "12px",
        "color": PALETTE["text"],
        "border": "none",
        "borderBottom": f"2px solid {PALETTE['primary']}44",
        "fontFamily": "Noto Sans SC",
    }

    style_cell = {
        "textAlign": "left",
        "fontSize": "12px",
        "fontFamily": "Noto Sans SC",
        "padding": "8px 12px",
        "minWidth": "80px",
        "maxWidth": "280px",
        "overflow": "hidden",
        "textOverflow": "ellipsis",
    }

    return html.Div([
        html.Div([
            html.Strong(title, style={"fontSize": "13px", "color": PALETTE["text"]}),
            html.Span(f"（共 {len(data)} 条记录）",
                       className="text-muted ms-2", style={"fontSize": "11px"}),
        ], className="d-flex align-items-center mb-2"),
        dash_table.DataTable(
            id=f"{id_prefix}-table",
            columns=columns,
            data=data,
            page_size=10,
            page_action="native",
            sort_action="native",
            filter_action="native",
            row_selectable=row_selectable,
            selected_rows=[],
            style_table={"overflowX": "auto", "overflowY": "auto", "height": f"{height}px",
                         "border": "1px solid #EEF0F4", "borderRadius": "8px"},
            style_header=style_header,
            style_cell=style_cell,
            style_data_conditional=style_data_conditional,
            style_as_list_view=True,
            css=[{"selector": ".dash-spreadsheet.dash-freeze-top, .dash-spreadsheet .dash-virtualized",
                  "rule": "max-height: none !important"}],
        )
    ], style={
        "background": "white",
        "padding": "16px",
        "border": "1px solid #EEF0F4",
        "borderRadius": "12px",
    })





# ============== 渲染 Tab 内容 ==============

def _render_funnel_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="funnel-chart", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4",
                    "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)",
                    "background": "white",
                })
            ], md=7),
            dbc.Col([
                dbc.Row([
                    dbc.Col([
                        dcc.Graph(id="gauge-success", figure={}, config={"displayModeBar": False}),
                    ], md=6),
                    dbc.Col([
                        dcc.Graph(id="gauge-duration", figure={}, config={"displayModeBar": False}),
                    ], md=6),
                    dbc.Col([
                        dcc.Graph(id="gauge-conflict", figure={}, config={"displayModeBar": False}),
                    ], md=6),
                    dbc.Col([
                        dcc.Graph(id="status-pie", figure={}, config={"displayModeBar": False}),
                    ], md=6),
                ], className="g-3"),
            ], md=5),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="stage-duration-chart", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="college-bar", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=6),
        ], className="g-3 mb-4"),
    ])


def _render_drilldown_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="courses",
                    title="📑 课程目录（点击行可下钻查看教室资源、学生名单、原始样本）",
                    columns=[
                        {"name": "课程编号", "id": "course_code"},
                        {"name": "课程名称", "id": "course_name"},
                        {"name": "学院", "id": "college"},
                        {"name": "任课教师", "id": "teacher"},
                        {"name": "学分", "id": "credit"},
                        {"name": "学时", "id": "hours"},
                        {"name": "容量", "id": "capacity"},
                        {"name": "已选", "id": "enrolled_count"},
                        {"name": "选课率(%)", "id": "enroll_rate"},
                        {"name": "类型", "id": "course_type"},
                        {"name": "浏览次数", "id": "browse_count"},
                        {"name": "有冲突", "id": "has_conflict"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=[],
                    height=340,
                ),
            ], md=12),
        ], className="mb-4"),

        html.Div(id="drilldown-detail"),
    ])


def _render_schedule_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="schedule-heatmap", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=8),
            dbc.Col([
                _style_table(
                    id_prefix="classrooms",
                    title="🏫 教室资源（点击行查看占用）",
                    columns=[
                        {"name": "教室编号", "id": "room_code"},
                        {"name": "教学楼", "id": "building"},
                        {"name": "类型", "id": "room_type"},
                        {"name": "容量", "id": "capacity"},
                        {"name": "周利用率(%)", "id": "weekly_utilization"},
                        {"name": "周排课时数", "id": "scheduled_hours"},
                        {"name": "有冲突", "id": "has_conflict"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=[],
                    height=380,
                ),
            ], md=4),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="conflicts",
                    title="⚠️ 教室冲突清单（红色边框的为冲突）",
                    columns=[
                        {"name": "冲突编号", "id": "conflict_id"},
                        {"name": "严重程度", "id": "severity"},
                        {"name": "处理状态", "id": "status"},
                        {"name": "教室", "id": "room_code"},
                        {"name": "教学楼", "id": "building"},
                        {"name": "星期", "id": "weekday"},
                        {"name": "时段", "id": "time_slot"},
                        {"name": "冲突课程A", "id": "course_name_1"},
                        {"name": "冲突课程B", "id": "course_name_2"},
                        {"name": "处理人", "id": "handler"},
                        {"name": "检测时间", "id": "detected_at"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=[],
                    height=320,
                    row_selectable="multi",
                ),
            ], md=12),
        ], className="mb-4"),

        html.Div(id="room-heatmap-detail"),
    ])


def _render_duration_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="duration-hist", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=7),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="duration-heat", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=5),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="applications",
                    title="📝 申请清单（含各阶段时长）- 备注在最右侧直接可见",
                    columns=[
                        {"name": "申请编号", "id": "application_no"},
                        {"name": "学号", "id": "student_id"},
                        {"name": "学生", "id": "student_name"},
                        {"name": "课程编号", "id": "course_code"},
                        {"name": "课程名", "id": "course_name"},
                        {"name": "学院", "id": "college"},
                        {"name": "状态", "id": "status"},
                        {"name": "初审时长(h)", "id": "first_review_duration"},
                        {"name": "排课时长(h)", "id": "schedule_duration"},
                        {"name": "终审时长(h)", "id": "final_review_duration"},
                        {"name": "总时长(h)", "id": "total_duration"},
                        {"name": "有冲突", "id": "has_conflict"},
                        {"name": "提交时间", "id": "submitted_at"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=[],
                    height=380,
                ),
            ], md=12),
        ]),
    ])


def _render_anomaly_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dcc.Graph(id="anomaly-trend", figure={}, config={"displayModeBar": False}),
                    ], className="p-0")
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=7),
            dbc.Col([
                dbc.Row([
                    dbc.Col([_kpi_card("待处理异常", "18", "高风险 5", "🔴", PALETTE["error"])], md=6),
                    dbc.Col([_kpi_card("近7日新增", "27", "中风险 14", "🟠", PALETTE["warning"])], md=6),
                    dbc.Col([_kpi_card("已处理", "83", "处理率 82%", "🟢", PALETTE["success"])], md=6),
                    dbc.Col([_kpi_card("最常见类型", "初审超时", "16 笔", "⏱", PALETTE["purple"])], md=6),
                ], className="g-3"),
            ], md=5),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="anomalies",
                    title="🚨 异常清单（所有数据源同步问题与业务异常）",
                    columns=[
                        {"name": "异常编号", "id": "anomaly_id"},
                        {"name": "来源系统", "id": "source_system"},
                        {"name": "异常类型", "id": "anomaly_type"},
                        {"name": "严重程度", "id": "severity"},
                        {"name": "相关表", "id": "table_name"},
                        {"name": "描述", "id": "description"},
                        {"name": "处理状态", "id": "status"},
                        {"name": "处理人", "id": "assignee"},
                        {"name": "检测时间", "id": "detected_at"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=[],
                    height=440,
                ),
            ], md=12),
        ]),
    ])


def _render_sync_tab():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.Strong("📡 数据同步任务", style={"fontSize": "14px"}),
                        dbc.Badge("Celery Beat 定时调度", color="info", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                dbc.Card([
                                    dbc.CardBody([
                                        html.Div([
                                            _tag("30分钟/次", "success"),
                                            html.Span(" 学生申请表", className="fw-bold ms-2"),
                                        ]),
                                        html.P("增量同步学生选课申请，校验学号、课程关联",
                                               className="text-muted mt-2 mb-0", style={"fontSize": "11px"}),
                                        html.Div([
                                            _tag("学生申请表", "primary"),
                                            html.Span(" → "),
                                            _tag("raw_student_applications", "info"),
                                            html.Span(" → "),
                                            _tag("enrollment_applications", "success"),
                                        ], className="mt-2"),
                                    ])
                                ], className="mb-3", style={"borderRadius": "10px",
                                                             "borderLeft": f"4px solid {PALETTE['primary']}"})
                            ], md=4),
                            dbc.Col([
                                dbc.Card([
                                    dbc.CardBody([
                                        html.Div([
                                            _tag("60分钟/次", "success"),
                                            html.Span(" 教学平台", className="fw-bold ms-2"),
                                        ]),
                                        html.P("全量同步课程目录、排课信息、审核记录",
                                               className="text-muted mt-2 mb-0", style={"fontSize": "11px"}),
                                        html.Div([
                                            _tag("教学平台", "primary"),
                                            html.Span(" → "),
                                            _tag("raw_teaching_platform", "info"),
                                            html.Span(" → "),
                                            _tag("courses/schedules", "success"),
                                        ], className="mt-2"),
                                    ])
                                ], className="mb-3", style={"borderRadius": "10px",
                                                             "borderLeft": f"4px solid {PALETTE['purple']}"})
                            ], md=4),
                            dbc.Col([
                                dbc.Card([
                                    dbc.CardBody([
                                        html.Div([
                                            _tag("120分钟/次", "success"),
                                            html.Span(" 一卡通系统", className="fw-bold ms-2"),
                                        ]),
                                        html.P("增量同步身份核验，交叉校验学籍与卡号一致性",
                                               className="text-muted mt-2 mb-0", style={"fontSize": "11px"}),
                                        html.Div([
                                            _tag("一卡通", "primary"),
                                            html.Span(" → "),
                                            _tag("raw_smart_cards", "info"),
                                            html.Span(" → "),
                                            _tag("students.is_verified", "success"),
                                        ], className="mt-2"),
                                    ])
                                ], className="mb-3", style={"borderRadius": "10px",
                                                             "borderLeft": f"4px solid {PALETTE['cyan']}"})
                            ], md=4),
                        ]),
                        dbc.Row([
                            dbc.Col([
                                dbc.Card([
                                    dbc.CardBody([
                                        html.Div([
                                            _tag("15分钟/次", "warning"),
                                            html.Span(" 异常检测引擎", className="fw-bold ms-2"),
                                        ]),
                                        html.P("规则检测：教室冲突、超容量、审核超时、身份未核验...",
                                               className="text-muted mt-2 mb-0", style={"fontSize": "11px"}),
                                        html.Div([
                                            _tag("检测规则", "warning"),
                                            html.Span(" → "),
                                            _tag("anomaly_records", "danger"),
                                            html.Span(" | "),
                                            _tag("classroom_conflicts", "danger"),
                                        ], className="mt-2"),
                                    ])
                                ], style={"borderRadius": "10px",
                                           "borderLeft": f"4px solid {PALETTE['warning']}"})
                            ], md=12),
                        ]),
                    ])
                ], style={
                    "border": "1px solid #EEF0F4", "borderRadius": "14px",
                    "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
                })
            ], md=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="raw-samples",
                    title="📦 原始样本表（三系统同步原始数据）",
                    columns=[
                        {"name": "样本ID", "id": "raw_id"},
                        {"name": "来源系统", "id": "source_system"},
                        {"name": "批次号", "id": "batch_id"},
                        {"name": "源ID", "id": "source_id"},
                        {"name": "原始载荷", "id": "payload"},
                        {"name": "已处理", "id": "is_processed"},
                        {"name": "是否异常", "id": "is_anomaly"},
                        {"name": "异常说明", "id": "anomaly_note"},
                        {"name": "同步时间", "id": "synced_at"},
                    ],
                    data=[],
                    height=300,
                ),
            ], md=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="sync-logs",
                    title="📋 同步任务日志",
                    columns=[
                        {"name": "同步编号", "id": "sync_id"},
                        {"name": "来源系统", "id": "source_system"},
                        {"name": "类型", "id": "sync_type"},
                        {"name": "开始时间", "id": "start_time"},
                        {"name": "结束时间", "id": "end_time"},
                        {"name": "耗时(秒)", "id": "duration_seconds"},
                        {"name": "总记录", "id": "total_records"},
                        {"name": "成功", "id": "success_count"},
                        {"name": "失败", "id": "failed_count"},
                        {"name": "异常", "id": "anomaly_count"},
                        {"name": "状态", "id": "status"},
                    ],
                    data=[],
                    height=300,
                ),
            ], md=12),
        ]),
    ])



# ============== 页面主布局 ==============

app.layout = dbc.Container([
    dcc.Store(id="selected-course-store", data=None),
    dcc.Store(id="selected-room-store", data=None),
    dcc.Store(id="selected-student-store", data=None),
    dcc.Download(id="download-report"),

    # 顶部标题区
    dbc.Row([
        dbc.Col([
            html.Div([
                html.Span("📚", style={"fontSize": "32px", "marginRight": "14px"}),
                html.Div([
                    html.H1("高校教务选课排课漏斗分析报表", style={
                        "fontSize": "26px",
                        "fontWeight": "700",
                        "color": PALETTE["text"],
                        "margin": "0",
                        "fontFamily": "Noto Sans SC",
                    }),
                    html.Div([
                        _tag("复盘会议专用", "primary"),
                        html.Span(" "),
                        _tag(f"数据截至: {datetime.now().strftime('%Y-%m-%d %H:%M')}", "info"),
                    ], className="mt-2")
                ])
            ], className="d-flex align-items-center"),
        ], md=9),
        dbc.Col([
            html.Div([
                dbc.Button("📥 导出审核时长报表", id="export-btn", color="primary", size="md",
                           style={"fontWeight": "500", "borderRadius": "8px"}, className="ms-2"),
                dbc.Button("🔄 刷新数据", id="refresh-btn", color="secondary", outline=True, size="md",
                           style={"borderRadius": "8px"}, className="ms-2"),
            ], className="d-flex justify-content-end align-items-center h-100"),
        ], md=3),
    ], className="mb-4 pt-4"),

    # 筛选条件
    dbc.Card([
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("学期", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.Dropdown(id="filter-term", options=[{"label": t, "value": t} for t in _TERMS],
                                 value=_TERMS[0], clearable=False, style={"fontSize": "13px"}),
                ], md=2),
                dbc.Col([
                    html.Label("学院", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.Dropdown(id="filter-college",
                                 options=[{"label": c, "value": c} for c in _COLLEGES] +
                                         [{"label": "全部学院", "value": ""}],
                                 value="", clearable=False, style={"fontSize": "13px"}),
                ], md=2),
                dbc.Col([
                    html.Label("课程类型", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.Dropdown(id="filter-course-type",
                                 options=[{"label": t, "value": t} for t in _COURSE_TYPES] +
                                         [{"label": "全部类型", "value": ""}],
                                 value="", clearable=False, style={"fontSize": "13px"}),
                ], md=2),
                dbc.Col([
                    html.Label("申请状态", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.Dropdown(id="filter-status",
                                 options=[{"label": s, "value": s} for s in _STATUSES] +
                                         [{"label": "全部状态", "value": ""}],
                                 value="", clearable=False, style={"fontSize": "13px"}),
                ], md=2),
                dbc.Col([
                    html.Label("是否含冲突", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.Dropdown(id="filter-conflict",
                                 options=[
                                     {"label": "全部", "value": ""},
                                     {"label": "仅含冲突", "value": 1},
                                     {"label": "不含冲突", "value": 0},
                                 ], value="", clearable=False, style={"fontSize": "13px"}),
                ], md=2),
                dbc.Col([
                    html.Label("提交日期", className="text-muted mb-1", style={"fontSize": "12px"}),
                    dcc.DatePickerRange(id="filter-date", start_date_placeholder_text="开始日期",
                                        end_date_placeholder_text="结束日期", display_format="YYYY-MM-DD",
                                        style={"fontSize": "13px", "width": "100%"}),
                ], md=2),
            ], className="g-3"),
            html.Hr(style={"borderColor": "#EEF0F4", "margin": "16px 0"}),
            dbc.Row([
                dbc.Col([
                    html.Div([
                        html.I("💡 ", style={"color": PALETTE["warning"]}),
                        html.Span("复盘提示：", className="fw-bold me-1"),
                        html.Span("点击课程、教室、学生表格的任意行可下钻查看关联明细。", className="text-muted"),
                        html.Span("红色边框/背景", className="mx-1 px-1",
                                  style={"color": PALETTE["error"], "backgroundColor": f"{PALETTE['error']}12",
                                         "fontWeight": "600", "borderRadius": "4px"}),
                        html.Span("标记教室冲突。备注字段在最右侧直接可见。", className="text-muted"),
                    ], style={"fontSize": "12px"})
                ])
            ]),
        ])
    ], className="mb-4", style={
        "border": "1px solid #EEF0F4",
        "borderRadius": "14px",
        "boxShadow": "0 2px 10px rgba(0,0,0,0.03)",
        "background": "white",
    }),

    # KPI指标
    dbc.Row([
        dbc.Col([_kpi_card("发布课程数", "20", "目标 20 ✓", icon="📘", color=PALETTE["primary"])], md=2),
        dbc.Col([_kpi_card("总浏览量", "18,000", "环比 +12.3%", icon="👁", color=PALETTE["cyan"])], md=2),
        dbc.Col([_kpi_card("申请总数", "15,600", "含冲突 1,248 笔", icon="📝", color=PALETTE["purple"])], md=2),
        dbc.Col([_kpi_card("成功选课", "12,800", "转化率 82.1%", icon="✅", color=PALETTE["success"])], md=2),
        dbc.Col([_kpi_card("平均总时长", "42.6 h", "目标 ≤72h", icon="⏱", color=PALETTE["warning"])], md=2),
        dbc.Col([_kpi_card("教室冲突", "12", "待处理 6", icon="⚠️", color=PALETTE["error"])], md=2),
    ], className="g-3 mb-4"),

    # Tabs 切换
    dcc.Tabs(id="main-tabs", value="tab-funnel", style={"fontFamily": "Noto Sans SC"},
             parent_className="custom-tabs", className="mb-4",
             children=[
                 dcc.Tab(label="📊 漏斗总览", value="tab-funnel", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['primary']}",
                                          "color": PALETTE["primary"], "fontWeight": "600"}),
                 dcc.Tab(label="📑 课程目录 → 下钻", value="tab-drilldown", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['purple']}",
                                          "color": PALETTE["purple"], "fontWeight": "600"}),
                 dcc.Tab(label="🗓 排课与冲突", value="tab-schedule", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['error']}",
                                          "color": PALETTE["error"], "fontWeight": "600"}),
                 dcc.Tab(label="⏳ 审核时长分析", value="tab-duration", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['warning']}",
                                          "color": PALETTE["warning"], "fontWeight": "600"}),
                 dcc.Tab(label="🚨 异常清单", value="tab-anomaly", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['magenta']}",
                                          "color": PALETTE["magenta"], "fontWeight": "600"}),
                 dcc.Tab(label="🔄 同步与日志", value="tab-sync", style={"padding": "12px"},
                         selected_style={"padding": "12px", "borderTop": f"3px solid {PALETTE['cyan']}",
                                          "color": PALETTE["cyan"], "fontWeight": "600"}),
             ]),

    html.Div([
        html.Div(id="tab-funnel-container", children=_render_funnel_tab()),
        html.Div(id="tab-drilldown-container", children=_render_drilldown_tab(),
                 style={"display": "none"}),
        html.Div(id="tab-schedule-container", children=_render_schedule_tab(),
                 style={"display": "none"}),
        html.Div(id="tab-duration-container", children=_render_duration_tab(),
                 style={"display": "none"}),
        html.Div(id="tab-anomaly-container", children=_render_anomaly_tab(),
                 style={"display": "none"}),
        html.Div(id="tab-sync-container", children=_render_sync_tab(),
                 style={"display": "none"}),
    ], id="tabs-wrapper"),

    # 底部
    html.Hr(style={"borderColor": "#EEF0F4"}),
    html.Div([
        html.Span("技术栈: ", className="text-muted", style={"fontSize": "11px"}),
        _tag("Python Dash", "info"),
        html.Span(" "),
        _tag("Plotly", "info"),
        html.Span(" "),
        _tag("Pandas", "info"),
        html.Span(" "),
        _tag("PostgreSQL", "info"),
        html.Span(" "),
        _tag("Celery + Redis", "info"),
        html.Span("   |   ", className="mx-2 text-muted"),
        html.Span("数据源: ", className="text-muted", style={"fontSize": "11px"}),
        _tag("学生申请表", "primary"),
        html.Span(" "),
        _tag("教学平台", "primary"),
        html.Span(" "),
        _tag("一卡通系统", "primary"),
    ], className="text-center mb-4 pb-4"),

], fluid=True, style={
    "backgroundColor": "#F5F7FA",
    "minHeight": "100vh",
    "fontFamily": "Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif",
})


# ============== 核心回调 ==============

@app.callback(
    [
        Output("tab-funnel-container", "style"),
        Output("tab-drilldown-container", "style"),
        Output("tab-schedule-container", "style"),
        Output("tab-duration-container", "style"),
        Output("tab-anomaly-container", "style"),
        Output("tab-sync-container", "style"),
    ],
    Input("main-tabs", "value"),
)
def toggle_tab_visibility(tab_value):
    SHOW = {"display": "block"}
    HIDE = {"display": "none"}
    mapping = {
        "tab-funnel": (SHOW, HIDE, HIDE, HIDE, HIDE, HIDE),
        "tab-drilldown": (HIDE, SHOW, HIDE, HIDE, HIDE, HIDE),
        "tab-schedule": (HIDE, HIDE, SHOW, HIDE, HIDE, HIDE),
        "tab-duration": (HIDE, HIDE, HIDE, SHOW, HIDE, HIDE),
        "tab-anomaly": (HIDE, HIDE, HIDE, HIDE, SHOW, HIDE),
        "tab-sync": (HIDE, HIDE, HIDE, HIDE, HIDE, SHOW),
    }
    return mapping.get(tab_value, mapping["tab-funnel"])


def _query_all(term, college, course_type, status, conflict_filter):
    c = None if conflict_filter == "" else conflict_filter
    funnel = ds.get_funnel_data(term, college or None)
    courses = ds.get_courses(term, college or None, course_type or None, c)
    classrooms = ds.get_classrooms(None, None, c)
    applications = ds.get_applications(term, college or None, status or None, c)
    schedules = ds.get_schedules(term, None, None, None)
    conflicts = ds.get_conflicts(term, None, None)
    anomalies = ds.get_anomalies()
    sync_logs = ds.get_sync_logs()
    raw_samples = ds.get_raw_samples(limit=300)
    duration_stats = ds.get_duration_stats(term, college or None)
    college_stats = ds.get_college_stats(term)
    return dict(funnel=funnel, courses=courses, classrooms=classrooms,
                applications=applications, schedules=schedules, conflicts=conflicts,
                anomalies=anomalies, sync_logs=sync_logs, raw_samples=raw_samples,
                duration_stats=duration_stats, college_stats=college_stats)


def _course_columns():
    return [
        {"name": "课程编号", "id": "course_code"},
        {"name": "课程名称", "id": "course_name"},
        {"name": "学院", "id": "college"},
        {"name": "任课教师", "id": "teacher"},
        {"name": "学分", "id": "credit"},
        {"name": "学时", "id": "hours"},
        {"name": "容量", "id": "capacity"},
        {"name": "已选", "id": "enrolled_count"},
        {"name": "选课率(%)", "id": "enroll_rate"},
        {"name": "类型", "id": "course_type"},
        {"name": "浏览次数", "id": "browse_count"},
        {"name": "有冲突", "id": "has_conflict"},
        {"name": "备注", "id": "remark"},
    ]


_SHARED_INPUTS = [
    Input("filter-term", "value"),
    Input("filter-college", "value"),
    Input("filter-course-type", "value"),
    Input("filter-status", "value"),
    Input("filter-conflict", "value"),
    Input("refresh-btn", "n_clicks"),
]


@app.callback(
    [
        Output("funnel-chart", "figure"),
        Output("gauge-success", "figure"),
        Output("gauge-duration", "figure"),
        Output("gauge-conflict", "figure"),
        Output("status-pie", "figure"),
        Output("stage-duration-chart", "figure"),
        Output("college-bar", "figure"),
    ],
    _SHARED_INPUTS,
)
def update_funnel_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    funnel, applications = d["funnel"], d["applications"]
    funnel_fig = create_funnel_chart(funnel)

    succ_rate = 82.1
    if not funnel.empty:
        succ_count = funnel.iloc[-1]["count"] if len(funnel) > 0 else 0
        sub_count = funnel.iloc[2]["count"] if len(funnel) > 2 else 1
        succ_rate = round(succ_count / sub_count * 100, 1) if sub_count else 0

    avg_dur = 42.6
    if not applications.empty and "total_duration" in applications.columns:
        a = applications[applications["total_duration"] > 0]
        if len(a):
            avg_dur = round(a["total_duration"].mean(), 1)

    conflict_cnt = len(d["conflicts"])
    unresolved = (d["conflicts"]["status"] == "未处理").sum() if "status" in d["conflicts"].columns else 0
    conflict_pct = round(unresolved / conflict_cnt * 100, 1) if conflict_cnt else 0

    success_gauge = create_gauge_chart(succ_rate, "🎯 漏斗成功率", max_val=100, threshold=80, unit="%")
    duration_gauge = create_gauge_chart(avg_dur, "⏱ 平均总时长", max_val=120, threshold=72, unit="h")
    conflict_gauge = create_gauge_chart(conflict_pct, "⚠️ 未解决冲突率", max_val=100, threshold=20, unit="%")
    status_fig = create_status_piechart(applications)
    stage_fig = create_stage_duration_chart(funnel)
    college_fig = create_college_barchart(d["college_stats"])

    return (funnel_fig, success_gauge, duration_gauge, conflict_gauge,
            status_fig, stage_fig, college_fig)


@app.callback(
    [Output("courses-table", "data"), Output("courses-table", "columns")],
    _SHARED_INPUTS,
)
def update_courses_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    return d["courses"].to_dict("records"), _course_columns()


@app.callback(
    [
        Output("schedule-heatmap", "figure"),
        Output("classrooms-table", "data"),
        Output("conflicts-table", "data"),
    ],
    _SHARED_INPUTS,
)
def update_schedule_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    schedule_fig = create_conflict_heatmap(d["schedules"])
    return (schedule_fig, d["classrooms"].to_dict("records"),
            d["conflicts"].to_dict("records"))


@app.callback(
    [
        Output("duration-hist", "figure"),
        Output("duration-heat", "figure"),
        Output("applications-table", "data"),
    ],
    _SHARED_INPUTS,
)
def update_duration_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    dur_hist_fig = create_duration_histogram(d["duration_stats"])
    dur_heat_fig = create_duration_heatmap(d["duration_stats"])
    return dur_hist_fig, dur_heat_fig, d["applications"].to_dict("records")


@app.callback(
    [Output("anomaly-trend", "figure"), Output("anomalies-table", "data")],
    _SHARED_INPUTS,
)
def update_anomaly_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    anomaly_fig = create_anomaly_trend(d["anomalies"])
    return anomaly_fig, d["anomalies"].to_dict("records")


@app.callback(
    [Output("sync-logs-table", "data"), Output("raw-samples-table", "data")],
    _SHARED_INPUTS,
)
def update_sync_tab(term, college, course_type, status, conflict_filter, n_refresh):
    d = _query_all(term, college, course_type, status, conflict_filter)
    return d["sync_logs"].to_dict("records"), d["raw_samples"].to_dict("records")


@app.callback(
    Output("drilldown-detail", "children"),
    [Input("courses-table", "selected_rows")],
    [State("courses-table", "data")],
)
def drill_course(selected_rows, table_data):
    if not selected_rows or not table_data:
        return html.Div([
            dbc.Alert(
                "👆 请在上方课程目录表格中选择任意行，系统将展示关联的教室资源、学生名单和原始样本。",
                color="info", className="text-center",
            )
        ], style={"padding": "24px", "borderRadius": "12px",
                  "border": "2px dashed #91CAFF", "background": "#E6F4FF"})

    row = table_data[selected_rows[0]]
    code = row.get("course_code", "")

    details = ds.get_course_details(code)
    course = details.get("course", {})
    schedules = details.get("schedules", [])
    students = details.get("students", [])
    apps = details.get("applications", [])
    raw_samples = details.get("raw_samples", [])

    return html.Div([
        dbc.Row([
            dbc.Col([
                html.Div([
                    html.H5(f"🔍 {course.get('course_code')} - {course.get('course_name')}",
                            className="mb-2", style={"color": PALETTE["text"]}),
                    dbc.Row([
                        dbc.Col([_tag(f"学院: {course.get('college', '-')}", "info")], md="auto"),
                        dbc.Col([_tag(f"教师: {course.get('teacher', '-')}", "primary")], md="auto"),
                        dbc.Col([_tag(f"学分: {course.get('credit', '-')}", "success")], md="auto"),
                        dbc.Col([_tag(f"容量: {course.get('enrolled_count', 0)}/{course.get('capacity', '-')}",
                                       "warning" if course.get("enrolled_count", 0) > course.get("capacity", 99999)
                                       else "success")], md="auto"),
                        dbc.Col([_tag(f"冲突: {course.get('has_conflict', 0)}",
                                       "danger" if course.get("has_conflict") else "success")], md="auto"),
                    ], className="g-2 mb-2"),
                    html.Div([
                        html.Strong("📝 备注: ", style={"fontSize": "12px"}),
                        html.Span(course.get("remark", "（无）") or "（无）",
                                  className="text-muted", style={"fontSize": "12px"}),
                    ]),
                ], style={
                    "padding": "18px", "background": "white",
                    "border": f"1px solid {PALETTE['primary']}33",
                    "borderLeft": f"4px solid {PALETTE['primary']}",
                    "borderRadius": "12px", "marginBottom": "16px",
                })
            ], md=12),
        ]),
        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="drill-schedules",
                    title=f"🗓 教室资源（共 {len(schedules)} 条排课记录）",
                    columns=[
                        {"name": "排课编号", "id": "schedule_id"},
                        {"name": "教室", "id": "room_code"},
                        {"name": "星期", "id": "weekday"},
                        {"name": "时段", "id": "time_slot"},
                        {"name": "周次", "id": "start_week"},
                        {"name": "单双周", "id": "week_type"},
                        {"name": "学生数", "id": "student_count"},
                        {"name": "是否冲突", "id": "is_conflict"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=schedules,
                    height=240,
                    row_selectable=False,
                ),
            ], md=12),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="drill-students",
                    title=f"👥 学生名单（共 {len(students)} 人申请本课程）",
                    columns=[
                        {"name": "学号", "id": "student_id"},
                        {"name": "姓名", "id": "name"},
                        {"name": "学院", "id": "college"},
                        {"name": "专业", "id": "major"},
                        {"name": "年级", "id": "grade"},
                        {"name": "班级", "id": "class_name"},
                        {"name": "身份核验", "id": "is_verified"},
                        {"name": "已申请课程", "id": "applied_courses"},
                        {"name": "成功课程", "id": "success_courses"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=students,
                    height=260,
                    row_selectable=False,
                ),
            ], md=7),
            dbc.Col([
                _style_table(
                    id_prefix="drill-applications",
                    title=f"📝 关联申请（共 {len(apps)} 条）",
                    columns=[
                        {"name": "申请编号", "id": "application_no"},
                        {"name": "学号", "id": "student_id"},
                        {"name": "学生", "id": "student_name"},
                        {"name": "状态", "id": "status"},
                        {"name": "总时长(h)", "id": "total_duration"},
                        {"name": "有冲突", "id": "has_conflict"},
                        {"name": "备注", "id": "remark"},
                    ],
                    data=apps,
                    height=260,
                    row_selectable=False,
                ),
            ], md=5),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                _style_table(
                    id_prefix="drill-raw",
                    title=f"📦 原始样本（来自教学平台共 {len(raw_samples)} 条）",
                    columns=[
                        {"name": "样本ID", "id": "raw_id"},
                        {"name": "来源系统", "id": "source_system"},
                        {"name": "批次号", "id": "batch_id"},
                        {"name": "源ID", "id": "source_id"},
                        {"name": "原始载荷", "id": "payload"},
                        {"name": "已处理", "id": "is_processed"},
                        {"name": "是否异常", "id": "is_anomaly"},
                        {"name": "异常说明", "id": "anomaly_note"},
                    ],
                    data=raw_samples,
                    height=220,
                    row_selectable=False,
                ),
            ], md=12),
        ]),
    ])


@app.callback(
    Output("room-heatmap-detail", "children"),
    [Input("classrooms-table", "selected_rows")],
    [State("classrooms-table", "data")],
)
def drill_room(selected_rows, table_data):
    if not selected_rows or not table_data:
        return html.Div()
    row = table_data[selected_rows[0]]
    code = row.get("room_code", "")

    scheds = ds.get_schedules(None, None, code, None)

    fig = create_conflict_heatmap(scheds)
    fig.update_layout(title=f"🗓 教室 {code} - {row.get('building','-')} 排课占用热力图")

    return dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    dcc.Graph(figure=fig, config={"displayModeBar": False}),
                ], className="p-0")
            ], style={
                "border": "1px solid #EEF0F4", "borderRadius": "14px",
                "boxShadow": "0 2px 10px rgba(0,0,0,0.03)", "background": "white",
            })
        ], md=12),
    ], className="mt-3")


@app.callback(
    Output("download-report", "data"),
    [
        Input("export-btn", "n_clicks"),
        Input("filter-term", "value"),
        Input("filter-college", "value"),
        Input("filter-status", "value"),
        Input("filter-conflict", "value"),
    ],
    prevent_initial_call=True,
)
def export_report(n_clicks, term, college, status, conflict):
    ctx = callback_context
    if not ctx.triggered or ctx.triggered[0]["prop_id"] != "export-btn.n_clicks":
        return no_update

    output = exporter.export_duration_report(
        academic_term=term,
        college=college or None,
        status=status or None,
        has_conflict=None if conflict == "" else conflict,
        start_date=None,
        end_date=None,
    )

    filename = f"审核时长报表_{term}_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return dcc.send_bytes(output.getvalue(), filename=filename)


# ============== 启动 ==============

if __name__ == "__main__":
    print("=" * 70)
    print("📚 高校教务选课排课漏斗分析报表")
    print("=" * 70)
    print("技术栈: Dash + Plotly + Pandas + PostgreSQL + Celery")
    print(f"访问地址: http://localhost:{Config.PORT}")
    print("=" * 70)

    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.DEBUG,
        dev_tools_hot_reload=False,
    )
