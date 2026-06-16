from dash import dcc, html, dash_table, Input, Output, State, callback_context, no_update
import dash_bootstrap_components as dbc
from datetime import date, datetime
from flask import session as flask_session
import traceback
import logging

from app.models import (
    get_session, FollowUp, Prescription, PrescriptionNote,
    PrescriptionStatus, FollowUpStatus, UserRole,
)
from app.dashboards.data_service import (
    get_follow_up_tasks, get_prescription_notes,
)
from app.dashboards.charts import create_kpi_card

logger = logging.getLogger(__name__)


def _safe_kpi_fig():
    return create_kpi_card(0, "", "#9CA3AF")


def build_executor_layout():
    """
    执行角色回访看板布局。组件ID统一加 exec- 前缀避免冲突。
    注意：用户ID从 Flask session 读取，不再通过参数注入到布局。
    """
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col(html.H3("我的回访任务", className="text-primary"), width=8),
            dbc.Col([
                dbc.Button("刷新", id="exec-refresh-btn", color="primary", outline=True, className="me-2"),
                dcc.Dropdown(
                    id="exec-status-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "待处理", "value": FollowUpStatus.PENDING.value},
                        {"label": "进行中", "value": FollowUpStatus.IN_PROGRESS.value},
                        {"label": "已完成", "value": FollowUpStatus.COMPLETED.value},
                    ],
                    value="all",
                    clearable=False,
                    style={"width": "150px", "display": "inline-block"},
                ),
            ], width=4, className="text-end"),
        ]),
        html.Hr(),

        dbc.Row([
            dbc.Col(dcc.Graph(id="exec-kpi-pending", figure=create_kpi_card(0, "待处理", "#EF4444")), width=3),
            dbc.Col(dcc.Graph(id="exec-kpi-progress", figure=create_kpi_card(0, "进行中", "#F59E0B")), width=3),
            dbc.Col(dcc.Graph(id="exec-kpi-done", figure=create_kpi_card(0, "已完成", "#10B981")), width=3),
            dbc.Col(dcc.Graph(id="exec-kpi-total", figure=create_kpi_card(0, "我的任务", "#2563EB")), width=3),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H5("任务列表", className="text-secondary mb-3"),
                dcc.Loading(
                    id="exec-loading",
                    type="default",
                    children=dash_table.DataTable(
                        id="exec-task-table",
                        columns=[
                            {"name": "ID", "id": "id", "hidden": True},
                            {"name": "优先级", "id": "priority_label"},
                            {"name": "状态", "id": "status_label"},
                            {"name": "处方号", "id": "prescription_no"},
                            {"name": "患者", "id": "patient_name"},
                            {"name": "门店", "id": "pharmacy_name"},
                            {"name": "任务类型", "id": "follow_up_type"},
                            {"name": "任务内容", "id": "content"},
                            {"name": "截止日期", "id": "due_date"},
                            {"name": "处理人", "id": "assignee_label"},
                            {"name": "操作", "id": "actions", "presentation": "markdown"},
                        ],
                        page_size=10,
                        style_table={"overflowX": "auto"},
                        style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                        style_cell={"padding": "10px", "textAlign": "left"},
                        style_data_conditional=[
                            {
                                "if": {"filter_query": "{priority_label} = '高'"},
                                "backgroundColor": "#FEF2F2",
                            },
                            {
                                "if": {"filter_query": "{status_label} = '已完成'"},
                                "backgroundColor": "#F0FDF4",
                            },
                        ],
                    ),
                ),
            ], width=12),
        ]),

        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("处理回访任务")),
            dbc.ModalBody([
                dcc.Store(id="exec-selected-task-id"),
                html.Div(id="exec-task-detail"),
                html.Hr(),
                html.H6("添加注释（如处方照片不清晰可说明）"),
                dbc.Textarea(id="exec-note-input", placeholder="请输入注释内容...", rows=3, className="mb-2"),
                dbc.Row([
                    dbc.Col(
                        dcc.Dropdown(
                            id="exec-note-type",
                            options=[
                                {"label": "处方澄清", "value": "clarification"},
                                {"label": "照片不清", "value": "photo_unclear"},
                                {"label": "回访记录", "value": "follow_up"},
                                {"label": "其他", "value": "other"},
                            ],
                            value="clarification",
                            clearable=False,
                        ), width=4,
                    ),
                    dbc.Col(dbc.Button("保存注释", id="exec-save-note-btn", color="secondary", outline=True), width=3),
                ]),
                html.Br(),
                html.Div(id="exec-note-history"),
            ]),
            dbc.ModalFooter([
                dbc.Button("开始处理", id="exec-start-btn", color="warning", className="me-2"),
                dbc.Button("标记完成", id="exec-complete-btn", color="success", className="me-2"),
                dbc.Button("关闭", id="exec-close-modal", color="secondary"),
            ]),
        ], id="exec-task-modal", is_open=False, size="lg"),
    ], fluid=True)


def _get_current_user_id() -> int:
    """从 Flask session 拿当前登录用户ID。回调里必须这么取，不能依赖 layout 构造参数。"""
    return flask_session.get("user_id")


def register_executor_callbacks(app):
    """在 create_app 启动阶段注册执行角色所有回调。"""

    @app.callback(
        [Output("exec-task-table", "data"),
         Output("exec-kpi-pending", "figure"),
         Output("exec-kpi-progress", "figure"),
         Output("exec-kpi-done", "figure"),
         Output("exec-kpi-total", "figure")],
        [Input("exec-refresh-btn", "n_clicks"),
         Input("exec-status-filter", "value")],
        prevent_initial_call=False,
    )
    def _exec_update_task_list(n_clicks, status_filter):
        try:
            user_id = _get_current_user_id()
            df = get_follow_up_tasks(user_id=user_id, role=UserRole.EXECUTOR)
            empty_fig = create_kpi_card(0, "", "#2563EB")
            if df.empty:
                return [], empty_fig, empty_fig, empty_fig, empty_fig

            if status_filter != "all":
                df = df[df["status"].apply(
                    lambda x: x.value == status_filter if hasattr(x, "value") else x == status_filter
                )]

            df_display = df.copy()
            df_display["due_date"] = df_display["due_date"].astype(str)
            df_display["actions"] = "[查看/处理](#)"
            # 执行角色只看到分配给自己的任务，处理人统一显示为「本人」
            df_display["assignee_label"] = "本人"
            df_display = df_display.fillna("")

            pending_count = len(df[df["status"] == FollowUpStatus.PENDING])
            progress_count = len(df[df["status"] == FollowUpStatus.IN_PROGRESS])
            done_count = len(df[df["status"] == FollowUpStatus.COMPLETED])

            return (
                df_display.to_dict("records"),
                create_kpi_card(pending_count, "待处理", "#EF4444"),
                create_kpi_card(progress_count, "进行中", "#F59E0B"),
                create_kpi_card(done_count, "已完成", "#10B981"),
                create_kpi_card(len(df), "我的任务", "#2563EB"),
            )
        except Exception as e:
            logger.exception("exec_update_task_list 失败")
            return [], _safe_kpi_fig(), _safe_kpi_fig(), _safe_kpi_fig(), _safe_kpi_fig()

    @app.callback(
        [Output("exec-task-modal", "is_open"), Output("exec-selected-task-id", "data"),
         Output("exec-task-detail", "children"), Output("exec-note-history", "children")],
        [Input("exec-task-table", "active_cell"),
         Input("exec-task-table", "derived_viewport_data"),
         Input("exec-close-modal", "n_clicks")],
        prevent_initial_call=True,
    )
    def _exec_open_task_modal(active_cell, viewport_data, close_clicks):
        try:
            ctx = callback_context
            if ctx.triggered_id == "exec-close-modal":
                return False, None, "", ""

            if not active_cell or active_cell["column_id"] != "actions":
                return False, None, "", ""

            row_idx = active_cell["row"]
            if not viewport_data or row_idx >= len(viewport_data):
                return False, None, "", ""

            task_id = viewport_data[row_idx]["id"]
            sess = get_session()
            try:
                task = sess.query(FollowUp).filter(FollowUp.id == task_id).first()
                if not task:
                    return False, None, "", ""

                prescription = sess.query(Prescription).filter(Prescription.id == task.prescription_id).first()
                detail = dbc.Row([
                    dbc.Col([
                        html.P([html.Strong("处方号："), prescription.prescription_no if prescription else ""]),
                        html.P([html.Strong("患者姓名："), prescription.patient_name if prescription else ""]),
                        html.P([html.Strong("任务内容："), task.content or ""]),
                    ], width=6),
                    dbc.Col([
                        html.P([html.Strong("任务类型："), task.follow_up_type or ""]),
                        html.P([html.Strong("优先级："), {0: "低", 1: "中", 2: "高"}.get(task.priority, "中")]),
                        html.P([html.Strong("截止日期："), str(task.due_date) if task.due_date else ""]),
                    ], width=6),
                    dbc.Col([
                        html.P([html.Strong("状态："), {
                            FollowUpStatus.PENDING: "待处理",
                            FollowUpStatus.IN_PROGRESS: "进行中",
                            FollowUpStatus.COMPLETED: "已完成",
                            FollowUpStatus.CANCELLED: "已取消",
                        }.get(task.status, str(task.status))]),
                        html.P([html.Strong("创建时间："), task.created_at.strftime("%Y-%m-%d %H:%M") if task.created_at else ""]),
                    ], width=12),
                ])

                notes_df = get_prescription_notes(task.prescription_id)
                if notes_df.empty:
                    note_history = html.P("暂无注释记录", className="text-secondary")
                else:
                    note_items = []
                    for _, note in notes_df.iterrows():
                        badge_color = "success" if note["is_resolved"] else "warning"
                        resolved_text = "  [已解决]" if note["is_resolved"] else ""
                        created_str = note["created_at"].strftime("%Y-%m-%d %H:%M") if hasattr(note["created_at"], "strftime") else str(note["created_at"])
                        note_items.append(
                            dbc.Card([
                                dbc.CardBody([
                                    html.P([
                                        dbc.Badge(note["note_type"], color="info", className="me-2"),
                                        html.Strong(note["author_name"]),
                                        html.Span(f"  ({created_str})"),
                                        dbc.Badge(resolved_text.strip(), color=badge_color, className="ms-2"),
                                    ]),
                                    html.P(note["content"], className="mb-0 mt-2"),
                                ]),
                            ], className="mb-2")
                        )
                    note_history = html.Div(note_items)

                return True, task_id, detail, note_history
            finally:
                sess.close()
        except Exception as e:
            logger.exception("exec_open_task_modal 失败")
            return False, None, dbc.Alert(f"加载详情失败: {str(e)}", color="danger"), ""

    @app.callback(
        Output("exec-note-history", "children", allow_duplicate=True),
        [Input("exec-save-note-btn", "n_clicks")],
        [State("exec-selected-task-id", "data"),
         State("exec-note-input", "value"),
         State("exec-note-type", "value")],
        prevent_initial_call=True,
    )
    def _exec_save_note(n_clicks, task_id, content, note_type):
        try:
            user_id = _get_current_user_id()
            if not task_id or not content or not user_id:
                return no_update

            sess = get_session()
            try:
                task = sess.query(FollowUp).filter(FollowUp.id == task_id).first()
                if not task:
                    return no_update

                note = PrescriptionNote(
                    prescription_id=task.prescription_id,
                    author_id=user_id,
                    note_type=note_type,
                    content=content,
                    is_resolved=False,
                )
                sess.add(note)

                if note_type == "photo_unclear":
                    rx = sess.query(Prescription).filter(Prescription.id == task.prescription_id).first()
                    if rx:
                        rx.has_unclear_photo = True
                        rx.status = PrescriptionStatus.NEEDS_CLARIFICATION

                sess.commit()

                notes_df = get_prescription_notes(task.prescription_id)
                if notes_df.empty:
                    return html.P("暂无注释记录", className="text-secondary")
                note_items = []
                for _, n in notes_df.iterrows():
                    badge_color = "success" if n["is_resolved"] else "warning"
                    resolved_text = "  [已解决]" if n["is_resolved"] else ""
                    created_str = n["created_at"].strftime("%Y-%m-%d %H:%M") if hasattr(n["created_at"], "strftime") else str(n["created_at"])
                    note_items.append(
                        dbc.Card([
                            dbc.CardBody([
                                html.P([
                                    dbc.Badge(n["note_type"], color="info", className="me-2"),
                                    html.Strong(n["author_name"]),
                                    html.Span(f"  ({created_str})"),
                                    dbc.Badge(resolved_text.strip(), color=badge_color, className="ms-2"),
                                ]),
                                html.P(n["content"], className="mb-0 mt-2"),
                            ]),
                        ], className="mb-2")
                    )
                return html.Div(note_items)
            finally:
                sess.close()
        except Exception as e:
            logger.exception("exec_save_note 失败")
            return dbc.Alert(f"保存失败: {str(e)}", color="danger")

    @app.callback(
        [Output("exec-task-modal", "is_open", allow_duplicate=True),
         Output("exec-refresh-btn", "n_clicks")],
        [Input("exec-start-btn", "n_clicks"), Input("exec-complete-btn", "n_clicks")],
        [State("exec-selected-task-id", "data"),
         State("exec-refresh-btn", "n_clicks")],
        prevent_initial_call=True,
    )
    def _exec_update_task_status(start_clicks, complete_clicks, task_id, cur_refresh_clicks):
        try:
            if not task_id:
                return no_update, no_update

            ctx = callback_context
            if not ctx.triggered:
                return no_update, no_update

            user_id = _get_current_user_id()
            sess = get_session()
            try:
                task = sess.query(FollowUp).filter(FollowUp.id == task_id).first()
                if not task:
                    return False, cur_refresh_clicks

                triggered = ctx.triggered_id
                if triggered == "exec-start-btn":
                    task.status = FollowUpStatus.IN_PROGRESS
                    # 自动领取：未分配的任务在"开始处理"时自动归属到当前用户
                    if task.assigned_to is None and user_id:
                        task.assigned_to = user_id
                elif triggered == "exec-complete-btn":
                    task.status = FollowUpStatus.COMPLETED
                    task.completed_at = datetime.utcnow()
                    if task.prescription_id:
                        rx = sess.query(Prescription).filter(Prescription.id == task.prescription_id).first()
                        if rx and rx.status == PrescriptionStatus.FOLLOW_UP:
                            rx.status = PrescriptionStatus.UNDER_REVIEW

                sess.commit()
                # 关闭弹窗并触发刷新按钮刷新列表
                next_clicks = (cur_refresh_clicks or 0) + 1
                return False, next_clicks
            finally:
                sess.close()
        except Exception as e:
            logger.exception("exec_update_task_status 失败")
            return False, cur_refresh_clicks
