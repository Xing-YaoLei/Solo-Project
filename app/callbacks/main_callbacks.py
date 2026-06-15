import json
import logging
import pandas as pd
from datetime import datetime, date
from typing import Dict, Any, List

from dash import Input, Output, State, callback_context, dcc, html, no_update
import dash_bootstrap_components as dbc

from app import app, db
from app.models import Student
from app.services import (
    get_funnel_data,
    get_completion_metrics,
    get_reminder_rules,
    get_student_grade_detail,
    save_note,
    export_report_data,
    FilterParams,
)
from app.pages.main import create_funnel_chart, create_completion_rate_chart, create_students_table

logger = logging.getLogger(__name__)


def parse_filters(
    course_ids,
    major,
    start_date,
    end_date,
    status,
    warning_only,
) -> FilterParams:
    date_from = None
    date_to = None

    if start_date:
        if isinstance(start_date, str):
            date_from = date.fromisoformat(start_date[:10])
        else:
            date_from = start_date

    if end_date:
        if isinstance(end_date, str):
            date_to = date.fromisoformat(end_date[:10])
        else:
            date_to = end_date

    return FilterParams(
        course_ids=course_ids if course_ids else None,
        major=major if major else None,
        date_from=date_from,
        date_to=date_to,
        status=status if status else None,
        progress_warning_only=bool(warning_only),
    )


def get_major_options():
    majors = db.session.query(Student.major).distinct().filter(Student.major.isnot(None)).all()
    return [{"label": m[0], "value": m[0]} for m in majors]


def register_main_callbacks():
    @app.callback(
        Output("major-filter", "options"),
        Input("url", "pathname"),
    )
    def update_major_options(pathname):
        return get_major_options()

    @app.callback(
        [
            Output("metric-enrolled", "children"),
            Output("metric-completion", "children"),
            Output("metric-pass-rate", "children"),
            Output("metric-employment", "children"),
            Output("metric-duration", "children"),
            Output("metric-warning", "children"),
            Output("funnel-chart", "figure"),
            Output("scatter-chart", "figure"),
            Output("students-table-container", "children"),
            Output("filter-store", "data"),
        ],
        [
            Input("course-filter", "value"),
            Input("major-filter", "value"),
            Input("date-filter", "start_date"),
            Input("date-filter", "end_date"),
            Input("status-filter", "value"),
            Input("warning-only-switch", "value"),
            Input("refresh-btn", "n_clicks"),
            Input("refresh-interval", "n_intervals"),
        ],
        prevent_initial_call=False,
    )
    def update_dashboard(
        course_ids,
        major,
        start_date,
        end_date,
        status,
        warning_only,
        refresh_clicks,
        interval,
    ):
        filters = parse_filters(course_ids, major, start_date, end_date, status, warning_only)

        try:
            metrics = get_completion_metrics(filters)
            df, funnel_data = get_funnel_data(filters)

            enrolled_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-users fa-2x", style={"color": "#2563eb"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("报名总人数", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['total_enrolled']}",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#1e293b"},
                            ),
                            html.Small("筛选范围内", className="text-muted", style={"fontSize": "0.75rem"}),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            completion_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-check-circle fa-2x", style={"color": "#16a34a"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("课程完成率", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['completion_rate']:.1f}%",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#1e293b"},
                            ),
                            html.Small("已完成/总报名", className="text-muted", style={"fontSize": "0.75rem"}),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            pass_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-award fa-2x", style={"color": "#0891b2"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("成绩合格率", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['pass_rate']:.1f}%",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#1e293b"},
                            ),
                            html.Small("合格/已完成", className="text-muted", style={"fontSize": "0.75rem"}),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            employment_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-briefcase fa-2x", style={"color": "#8b5cf6"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("就业率", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['employment_rate']:.1f}%",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#1e293b"},
                            ),
                            html.Small("就业/已完成", className="text-muted", style={"fontSize": "0.75rem"}),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            duration_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-clock fa-2x", style={"color": "#f59e0b"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("平均学习时长", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['avg_study_duration']:.0f}分钟",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#1e293b"},
                            ),
                            html.Small("人均学习时长", className="text-muted", style={"fontSize": "0.75rem"}),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            warning_card = html.Div(
                [
                    html.Div(
                        [
                            html.I(className="fas fa-exclamation-triangle fa-2x", style={"color": "#dc2626"}),
                        ],
                        className="me-3",
                    ),
                    html.Div(
                        [
                            html.H6("进度落后预警", className="text-muted mb-1", style={"fontSize": "0.875rem"}),
                            html.H4(
                                f"{metrics['progress_warning_count']}人",
                                className="mb-0",
                                style={"fontWeight": "700", "color": "#dc2626"},
                            ),
                            html.Small(
                                f"预警率: {metrics['progress_warning_rate']:.1f}%",
                                className="text-muted",
                                style={"fontSize": "0.75rem"},
                            ),
                        ]
                    ),
                ],
                className="d-flex align-items-center",
            )

            funnel_fig = create_funnel_chart(funnel_data)
            scatter_fig = create_completion_rate_chart(df)
            table = create_students_table(df)

            filter_data = filters.to_dict()
            filter_data["df_ids"] = df["id"].tolist() if not df.empty else []

            return (
                enrolled_card,
                completion_card,
                pass_card,
                employment_card,
                duration_card,
                warning_card,
                funnel_fig,
                scatter_fig,
                table,
                filter_data,
            )

        except Exception as e:
            logger.error(f"更新仪表盘失败: {e}", exc_info=True)
            empty_fig = create_funnel_chart([])
            return (
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                empty_fig,
                create_completion_rate_chart(pd.DataFrame()),
                html.Div("数据加载失败，请稍后重试"),
                {},
            )

    @app.callback(
        Output("drilldown-btn", "disabled"),
        Input("students-table", "selected_rows"),
    )
    def toggle_drilldown_button(selected_rows):
        return not (selected_rows and len(selected_rows) > 0)

    @app.callback(
        Output("url", "pathname"),
        [
            Input("drilldown-btn", "n_clicks"),
            Input("students-table", "active_cell"),
        ],
        [
            State("students-table", "derived_virtual_data"),
            State("students-table", "selected_rows"),
        ],
        prevent_initial_call=True,
    )
    def navigate_to_drilldown(n_clicks, active_cell, table_data, selected_rows):
        ctx = callback_context
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]

        if trigger_id == "drilldown-btn" and selected_rows and len(selected_rows) > 0:
            row_idx = selected_rows[0]
            if row_idx < len(table_data):
                grade_id = table_data[row_idx].get("id")
                return f"/drilldown/{grade_id}"

        elif trigger_id == "students-table" and active_cell:
            row_idx = active_cell["row"]
            if row_idx < len(table_data):
                grade_id = table_data[row_idx].get("id")
                return f"/drilldown/{grade_id}"

        return no_update

    @app.callback(
        [
            Output("note-modal", "is_open"),
            Output("note-student-info", "children"),
            Output("toast", "is_open"),
            Output("toast", "children"),
        ],
        [
            Input("students-table", "selected_rows"),
            Input("note-cancel", "n_clicks"),
            Input("note-save", "n_clicks"),
        ],
        [
            State("students-table", "derived_virtual_data"),
            State("note-content", "value"),
            State("note-type", "value"),
            State("note-modal", "is_open"),
        ],
        prevent_initial_call=True,
    )
    def handle_note_modal(selected_rows, cancel_clicks, save_clicks, table_data, note_content, note_type, is_open):
        ctx = callback_context
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]

        if trigger_id == "students-table" and selected_rows and len(selected_rows) > 0:
            row_idx = selected_rows[0]
            if row_idx < len(table_data):
                row = table_data[row_idx]
                student_info = html.Div(
                    [
                        html.Strong(f"{row.get('name', '')}"),
                        html.Span(f" ({row.get('student_code', '')})", className="text-muted ms-2"),
                        html.Br(),
                        html.Small(
                            f"课程: {row.get('course_name', '')} | 完成率: {row.get('completion_rate', 0):.1f}%",
                            className="text-muted",
                        ),
                    ]
                )
                return True, student_info, False, ""

        elif trigger_id == "note-cancel":
            return False, "", False, ""

        elif trigger_id == "note-save":
            if not note_content or not note_content.strip():
                return True, "", True, "备注内容不能为空"

            if selected_rows and len(selected_rows) > 0 and table_data:
                row_idx = selected_rows[0]
                if row_idx < len(table_data):
                    row = table_data[row_idx]
                    grade_id = row.get("id")

                    grade_detail = get_student_grade_detail(grade_id)
                    if grade_detail:
                        result = save_note(
                            student_id=grade_detail["student_id"],
                            content=note_content,
                            created_by="dashboard_user",
                            note_type=note_type,
                            grade_id=grade_id,
                        )
                        if result["status"] == "success":
                            return False, "", True, "备注保存成功"
                        else:
                            return True, "", True, result.get("message", "保存失败")

            return True, "", True, "请先选择学生"

        return no_update, no_update, no_update, no_update

    @app.callback(
        Output("download-report", "data"),
        Input("export-btn", "n_clicks"),
        [
            State("course-filter", "value"),
            State("major-filter", "value"),
            State("date-filter", "start_date"),
            State("date-filter", "end_date"),
            State("status-filter", "value"),
            State("warning-only-switch", "value"),
        ],
        prevent_initial_call=True,
    )
    def handle_export(n_clicks, course_ids, major, start_date, end_date, status, warning_only):
        if n_clicks is None:
            return no_update

        filters = parse_filters(course_ids, major, start_date, end_date, status, warning_only)

        try:
            excel_data = export_report_data(filters)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"职业教育课程漏斗报表_{timestamp}.xlsx"

            return dcc.send_bytes(excel_data, filename)

        except Exception as e:
            logger.error(f"导出报表失败: {e}", exc_info=True)
            return no_update

    @app.callback(
        Output("morning-mode-btn", "children"),
        Input("morning-mode-btn", "n_clicks"),
        prevent_initial_call=True,
    )
    def toggle_morning_mode(n_clicks):
        if n_clicks and n_clicks % 2 == 1:
            return [
                html.I(className="fas fa-stop-circle me-2"),
                "退出早会",
            ]
        return [
            html.I(className="fas fa-play-circle me-2"),
            "早会模式",
        ]
