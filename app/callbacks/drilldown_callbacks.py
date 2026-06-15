import logging
import pandas as pd
from datetime import datetime

from dash import Input, Output, State, callback_context, html, no_update
import dash_bootstrap_components as dbc

from app import app
from app.services import (
    get_student_grade_detail,
    get_chapter_progress,
    get_original_samples,
    get_reminder_rules,
    get_notes,
    save_note,
    FilterParams,
)
from app.pages.drilldown import (
    create_chapter_progress_chart,
    create_study_duration_chart,
    create_rules_table,
    create_chapter_table,
    create_notes_list,
    create_samples_tables,
)

logger = logging.getLogger(__name__)


def register_drilldown_callbacks():
    @app.callback(
        Output("drilldown-grade-id", "data"),
        Input("drilldown-url", "pathname"),
    )
    def extract_grade_id(pathname):
        if pathname and pathname.startswith("/drilldown/"):
            try:
                grade_id = int(pathname.split("/")[-1])
                return grade_id
            except (ValueError, IndexError):
                return None
        return None

    @app.callback(
        [
            Output("drilldown-title", "children"),
            Output("info-student-code", "children"),
            Output("info-student-name", "children"),
            Output("info-major", "children"),
            Output("info-class", "children"),
            Output("info-completion", "children"),
            Output("info-score", "children"),
            Output("student-info-alert", "children"),
            Output("chapter-chart", "figure"),
            Output("duration-chart", "figure"),
            Output("rules-container", "children"),
            Output("chapter-table-container", "children"),
            Output("samples-container", "children"),
            Output("notes-container", "children"),
            Output("notes-count-badge", "children"),
        ],
        [
            Input("drilldown-grade-id", "data"),
            Input("drilldown-refresh-btn", "n_clicks"),
        ],
        prevent_initial_call=False,
    )
    def load_drilldown_data(grade_id, refresh_clicks):
        if not grade_id:
            empty_info = html.Div(
                [
                    html.I(className="fas fa-info-circle fa-lg me-2"),
                    html.Span("--"),
                ],
                className="d-flex align-items-center",
            )
            return (
                [html.I(className="fas fa-user-graduate me-2"), "学生学习详情"],
                empty_info,
                empty_info,
                empty_info,
                empty_info,
                empty_info,
                empty_info,
                None,
                create_chapter_progress_chart(pd.DataFrame()),
                create_study_duration_chart(pd.DataFrame()),
                html.Div("请先选择学生", className="text-center p-4 text-muted"),
                html.Div("请先选择学生", className="text-center p-4 text-muted"),
                html.Div("请先选择学生", className="text-center p-4 text-muted"),
                html.Div("请先选择学生", className="text-center p-4 text-muted"),
                "0",
            )

        try:
            detail = get_student_grade_detail(grade_id)
            if not detail:
                alert = dbc.Alert(
                    [
                        html.I(className="fas fa-exclamation-circle me-2"),
                        "未找到该学生的学习记录",
                    ],
                    color="danger",
                )
                return (
                    [html.I(className="fas fa-user-graduate me-2"), "学生学习详情"],
                    html.Div("--"),
                    html.Div("--"),
                    html.Div("--"),
                    html.Div("--"),
                    html.Div("--%"),
                    html.Div("--"),
                    alert,
                    create_chapter_progress_chart(pd.DataFrame()),
                    create_study_duration_chart(pd.DataFrame()),
                    html.Div("暂无数据"),
                    html.Div("暂无数据"),
                    html.Div("暂无数据"),
                    html.Div("暂无数据"),
                    "0",
                )

            title = [
                html.I(className="fas fa-user-graduate me-2"),
                f"{detail['student_name']} - {detail['course_name']} 学习详情",
            ]

            def make_info_card(value, icon, color):
                return html.Div(
                    [
                        html.Div(
                            [html.I(className=f"fas {icon} fa-lg me-2", style={"color": color})],
                            className="me-3",
                        ),
                        html.Div(
                            [
                                html.Span(value, className="h5 mb-0", style={"fontWeight": "600"}),
                            ]
                        ),
                    ],
                    className="d-flex align-items-center",
                )

            completion_color = "#dc2626" if detail["completion_rate"] < 60 else "#16a34a"
            score_color = "#dc2626" if (detail["total_score"] or 0) < 60 else "#16a34a"

            alert = None
            if detail["progress_warning"]:
                alert = dbc.Alert(
                    [
                        html.I(className="fas fa-exclamation-triangle me-2"),
                        f"⚠️ 该学生学习进度落后！当前完成率 {detail['completion_rate']:.1f}%，请及时关注并跟进。",
                    ],
                    color="warning",
                    className="mb-4",
                )

            chapter_df = get_chapter_progress(grade_id)
            rules = get_reminder_rules()
            samples = get_original_samples(grade_id)
            notes = get_notes(student_id=detail["student_id"], grade_id=grade_id)

            matched_rules = []
            for rule in rules:
                if rule["threshold_type"] == "completion_rate":
                    value = detail["completion_rate"] or 0
                elif rule["threshold_type"] == "total_score":
                    value = detail["total_score"] or 0
                else:
                    continue

                threshold = rule["threshold_value"]
                comparison = rule["comparison"]

                matched = False
                if comparison == "lt" and value < threshold:
                    matched = True
                elif comparison == "lte" and value <= threshold:
                    matched = True
                elif comparison == "gt" and value > threshold:
                    matched = True
                elif comparison == "gte" and value >= threshold:
                    matched = True
                elif comparison == "eq" and value == threshold:
                    matched = True
                elif comparison == "ne" and value != threshold:
                    matched = True

                if matched:
                    matched_rules.append(rule)

            return (
                title,
                make_info_card(detail["student_code"], "fa-id-card", "#2563eb"),
                make_info_card(detail["student_name"], "fa-user", "#16a34a"),
                make_info_card(detail.get("major", "--") or "--", "fa-book", "#0891b2"),
                make_info_card(detail.get("grade_class", "--") or "--", "fa-users", "#f59e0b"),
                make_info_card(f"{detail['completion_rate']:.1f}%", "fa-chart-line", completion_color),
                make_info_card(f"{detail['total_score'] or '--'}", "fa-award", score_color),
                alert,
                create_chapter_progress_chart(chapter_df),
                create_study_duration_chart(chapter_df),
                create_rules_table(matched_rules),
                create_chapter_table(chapter_df),
                create_samples_tables(samples),
                create_notes_list(notes),
                str(len(notes)),
            )

        except Exception as e:
            logger.error(f"加载下钻数据失败: {e}", exc_info=True)
            alert = dbc.Alert(
                [
                    html.I(className="fas fa-exclamation-circle me-2"),
                    f"数据加载失败: {str(e)}",
                ],
                color="danger",
            )
            return (
                [html.I(className="fas fa-user-graduate me-2"), "学生学习详情"],
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                html.Div("错误"),
                alert,
                create_chapter_progress_chart(pd.DataFrame()),
                create_study_duration_chart(pd.DataFrame()),
                html.Div("加载失败"),
                html.Div("加载失败"),
                html.Div("加载失败"),
                html.Div("加载失败"),
                "0",
            )

    @app.callback(
        Output("drilldown-url", "pathname"),
        Input("back-to-main", "n_clicks"),
        prevent_initial_call=True,
    )
    def navigate_back(n_clicks):
        return "/"

    @app.callback(
        [
            Output("drilldown-note-modal", "is_open"),
            Output("drilldown-note-content", "value"),
            Output("drilldown-toast", "is_open"),
            Output("drilldown-toast", "children"),
        ],
        [
            Input("add-note-btn", "n_clicks"),
            Input("drilldown-note-cancel", "n_clicks"),
            Input("drilldown-note-save", "n_clicks"),
        ],
        [
            State("drilldown-grade-id", "data"),
            State("drilldown-note-content", "value"),
            State("drilldown-note-type", "value"),
            State("drilldown-note-modal", "is_open"),
        ],
        prevent_initial_call=True,
    )
    def handle_drilldown_note(
        add_clicks, cancel_clicks, save_clicks, grade_id, note_content, note_type, is_open
    ):
        ctx = callback_context
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]

        if trigger_id == "add-note-btn":
            return True, "", False, ""

        elif trigger_id == "drilldown-note-cancel":
            return False, "", False, ""

        elif trigger_id == "drilldown-note-save":
            if not note_content or not note_content.strip():
                return True, "", True, "备注内容不能为空"

            if not grade_id:
                return True, "", True, "无效的学生记录"

            detail = get_student_grade_detail(grade_id)
            if not detail:
                return True, "", True, "未找到该学生记录"

            result = save_note(
                student_id=detail["student_id"],
                content=note_content,
                created_by="dashboard_user",
                note_type=note_type,
                grade_id=grade_id,
            )

            if result["status"] == "success":
                return False, "", True, "备注保存成功"
            else:
                return True, "", True, result.get("message", "保存失败")

        return no_update, no_update, no_update, no_update
