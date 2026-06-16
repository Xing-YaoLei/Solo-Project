from dash import dcc, html, dash_table, Input, Output, State, no_update, callback_context
import dash_bootstrap_components as dbc
from datetime import date, timedelta, datetime
import traceback
import logging

from app.models import UserRole, PharmacistOpinion
from app.dashboards.data_service import (
    get_prescription_summary, get_prescription_trend,
    get_photo_distribution, get_photo_quality_detail,
    get_pharmacist_funnel, get_expiry_ranking,
    get_member_changes, get_pharmacy_stats, get_batch_history,
    submit_pharmacist_review, resolve_note, get_pending_review_list,
    get_prescription_notes,
)
from app.dashboards.charts import (
    create_trend_chart, create_photo_distribution_chart,
    create_photo_quality_pie, create_pharmacist_funnel,
    create_expiry_ranking_chart, create_member_change_chart,
    create_pharmacy_comparison, create_status_pie, create_kpi_card,
)
from flask import session as flask_session

logger = logging.getLogger(__name__)


def _get_current_user_id():
    """从 Flask session 读取当前用户ID。"""
    return flask_session.get("user_id")


def _mgmt_load_all_notes(limit: int = 50):
    """加载所有处方注释（带处方信息），给管理/药师视图用。"""
    from app.models import get_session, PrescriptionNote, Prescription, User
    import pandas as pd

    session = get_session()
    try:
        rows = (
            session.query(
                PrescriptionNote.id,
                PrescriptionNote.prescription_id,
                PrescriptionNote.note_type,
                PrescriptionNote.content,
                PrescriptionNote.is_resolved,
                PrescriptionNote.created_at,
                PrescriptionNote.resolved_at,
                Prescription.prescription_no,
                Prescription.patient_name,
                User.full_name.label("author_name"),
            )
            .join(Prescription, PrescriptionNote.prescription_id == Prescription.id)
            .join(User, PrescriptionNote.author_id == User.id)
            .order_by(PrescriptionNote.created_at.desc())
            .limit(limit)
            .all()
        )
        columns = ["id", "prescription_id", "note_type", "content",
                   "is_resolved", "created_at", "resolved_at",
                   "prescription_no", "patient_name", "author_name"]
        df = pd.DataFrame(rows, columns=columns)
        return df
    finally:
        session.close()


def _safe_empty_fig(msg: str = "暂无数据"):
    """生成一个简单的空数据占位图，避免回调崩溃。"""
    import plotly.graph_objects as go
    fig = go.Figure()
    fig.update_layout(
        annotations=[dict(
            text=msg, showarrow=False, font=dict(size=14, color="#9CA3AF"),
            xref="paper", yref="paper", x=0.5, y=0.5,
        )],
        paper_bgcolor="white", plot_bgcolor="white",
        xaxis=dict(visible=False), yaxis=dict(visible=False),
        height=240,
    )
    return fig


def build_management_layout():
    """只构建布局，不注册任何回调。组件ID统一加 mgmt- 前缀避免冲突。"""
    today = date.today()
    default_start = today - timedelta(days=30)

    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col(html.H3("药店连锁处方审核总览", className="text-primary"), width=8),
            dbc.Col([
                dbc.Row([
                    dbc.Col(dcc.DatePickerRange(
                        id="mgmt-date-range",
                        start_date=default_start,
                        end_date=today,
                        display_format="YYYY-MM-DD",
                        className="mb-2",
                    )),
                    dbc.Col(dbc.Button("刷新数据", id="mgmt-refresh-btn", color="primary", outline=True, className="mb-2")),
                ]),
            ], width=4),
        ]),
        html.Hr(),

        dbc.Row([
            dbc.Col(dcc.Graph(id="mgmt-kpi-total", figure=create_kpi_card(0, "处方总数", "#2563EB")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-approved", figure=create_kpi_card(0, "审核通过", "#10B981")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-rate", figure=create_kpi_card(0, "通过率", "#3B82F6", suffix="%")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-amount", figure=create_kpi_card(0, "总金额", "#8B5CF6", prefix="¥")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-insurance", figure=create_kpi_card(0, "医保支付", "#F59E0B", prefix="¥")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-pending", figure=create_kpi_card(0, "待审核", "#EF4444")), width=2),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col(dcc.Graph(id="mgmt-trend-chart"), width=8),
            dbc.Col(dcc.Graph(id="mgmt-status-pie"), width=4),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H5("分析区域", className="text-secondary mb-3"),
                dbc.Tabs([
                    dbc.Tab(label="处方照片分布", tab_id="photo"),
                    dbc.Tab(label="药师意见漏斗", tab_id="funnel"),
                    dbc.Tab(label="批号效期排行", tab_id="expiry"),
                    dbc.Tab(label="会员档案变化", tab_id="member"),
                    dbc.Tab(label="门店对比", tab_id="pharmacy"),
                    dbc.Tab(label="待审核处方", tab_id="review"),
                    dbc.Tab(label="处方注释", tab_id="notes"),
                    dbc.Tab(label="导入批次", tab_id="batch"),
                ], id="mgmt-analysis-tabs", active_tab="photo"),
                html.Br(),
                html.Div(id="mgmt-analysis-content"),
            ], width=12),
        ]),

        dcc.Store(id="mgmt-summary-store"),
        dcc.Store(id="mgmt-selected-prescription-id"),

        # ---------- 审核弹窗 ----------
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("处方审核")),
            dbc.ModalBody([
                html.Div(id="mgmt-review-detail", className="mb-3"),
                html.Hr(),
                dbc.Label("审核意见"),
                dcc.Dropdown(
                    id="mgmt-review-opinion",
                    options=[
                        {"label": "审核通过", "value": PharmacistOpinion.PASSED.value},
                        {"label": "照片不清", "value": PharmacistOpinion.PHOTO_UNCLEAR.value},
                        {"label": "信息不全", "value": PharmacistOpinion.INCOMPLETE_INFO.value},
                        {"label": "剂量问题", "value": PharmacistOpinion.DOSE_ISSUE.value},
                        {"label": "相互作用", "value": PharmacistOpinion.INTERACTION_WARNING.value},
                        {"label": "重复治疗", "value": PharmacistOpinion.DUPLICATE_THERAPY.value},
                        {"label": "禁忌症", "value": PharmacistOpinion.CONTRAINDICATION.value},
                    ],
                    value=PharmacistOpinion.PASSED.value,
                    clearable=False,
                    className="mb-3",
                ),
                dbc.Label("审核备注"),
                dbc.Textarea(id="mgmt-review-comment", placeholder="可填写具体审核意见或退回原因...", rows=3),
                html.Div(id="mgmt-review-error", className="text-danger mt-2"),
            ]),
            dbc.ModalFooter([
                dbc.Button("取消", id="mgmt-review-cancel-btn", color="secondary", className="me-2"),
                dbc.Button("提交审核", id="mgmt-review-submit-btn", color="primary"),
            ]),
        ], id="mgmt-review-modal", size="lg", is_open=False),
    ], fluid=True)


def register_management_callbacks(app):
    """在 create_app 启动阶段调用，一次性注册管理层所有回调。"""

    @app.callback(
        Output("mgmt-summary-store", "data"),
        [Input("mgmt-date-range", "start_date"), Input("mgmt-date-range", "end_date"),
         Input("mgmt-refresh-btn", "n_clicks")],
        prevent_initial_call=False,
    )
    def _mgmt_update_summary(start_date, end_date, n_clicks):
        try:
            start = date.fromisoformat(start_date) if start_date else None
            end = date.fromisoformat(end_date) if end_date else None
            return get_prescription_summary(start, end)
        except Exception as e:
            logger.exception("mgmt_update_summary 失败")
            return {"error": str(e)}

    @app.callback(
        [Output("mgmt-kpi-total", "figure"), Output("mgmt-kpi-approved", "figure"),
         Output("mgmt-kpi-rate", "figure"), Output("mgmt-kpi-amount", "figure"),
         Output("mgmt-kpi-insurance", "figure"), Output("mgmt-kpi-pending", "figure"),
         Output("mgmt-trend-chart", "figure"), Output("mgmt-status-pie", "figure")],
        [Input("mgmt-summary-store", "data"),
         Input("mgmt-date-range", "start_date"), Input("mgmt-date-range", "end_date")],
    )
    def _mgmt_update_kpis(summary, start_date, end_date):
        try:
            if not summary or isinstance(summary, dict) and "error" in summary:
                summary = get_prescription_summary()
            trend_df = get_prescription_trend(30)
            return (
                create_kpi_card(summary.get("total_prescriptions", 0), "处方总数", "#2563EB"),
                create_kpi_card(summary.get("approved", 0), "审核通过", "#10B981"),
                create_kpi_card(summary.get("approval_rate", 0), "通过率", "#3B82F6", suffix="%"),
                create_kpi_card(summary.get("total_amount", 0), "总金额", "#8B5CF6", prefix="¥"),
                create_kpi_card(summary.get("insurance_amount", 0), "医保支付", "#F59E0B", prefix="¥"),
                create_kpi_card(summary.get("pending_review", 0), "待审核", "#EF4444"),
                create_trend_chart(trend_df) if not trend_df.empty else _safe_empty_fig("暂无趋势数据"),
                create_status_pie(summary),
            )
        except Exception as e:
            logger.exception("mgmt_update_kpis 失败")
            empty = _safe_empty_fig(f"数据加载失败: {str(e)[:40]}")
            return [empty] * 8

    @app.callback(
        Output("mgmt-analysis-content", "children"),
        [Input("mgmt-analysis-tabs", "active_tab")],
    )
    def _mgmt_render_analysis_tab(tab_id):
        try:
            if tab_id == "photo":
                photo_df = get_photo_distribution()
                quality_df = get_photo_quality_detail()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_photo_distribution_chart(photo_df) if not photo_df.empty else _safe_empty_fig()
                    ), width=8),
                    dbc.Col(dcc.Graph(
                        figure=create_photo_quality_pie(quality_df) if not quality_df.empty else _safe_empty_fig()
                    ), width=4),
                ])
            elif tab_id == "funnel":
                funnel_df = get_pharmacist_funnel()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_pharmacist_funnel(funnel_df) if not funnel_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "expiry":
                expiry_df = get_expiry_ranking(limit=20)
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_expiry_ranking_chart(expiry_df) if not expiry_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "member":
                member_df = get_member_changes(90)
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_member_change_chart(member_df) if not member_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "pharmacy":
                ph_df = get_pharmacy_stats()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_pharmacy_comparison(ph_df) if not ph_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "review":
                review_df = get_pending_review_list(limit=50)
                if review_df.empty:
                    return html.Div("暂无待审核处方", className="text-secondary p-4")
                display_cols = ["prescription_no", "patient_name", "pharmacy_name",
                                "status_label", "has_unclear_photo", "prescription_date", "actions"]
                review_df = review_df.copy()
                review_df["prescription_date"] = review_df["prescription_date"].astype(str)
                review_df["has_unclear_photo"] = review_df["has_unclear_photo"].map(
                    lambda v: "是" if v else "否"
                )
                review_df["actions"] = "[审核](#)"
                return dbc.Container([
                    html.Div("点击「审核」可打开审核窗口，提交后处方状态与回访任务会自动联动。",
                             className="text-muted small mb-2"),
                    dash_table.DataTable(
                        id="mgmt-review-table",
                        # id 列放在 data 里但不在 columns 中定义 → 隐藏列，viewport_data 可读取
                        data=review_df[display_cols + ["id"]].to_dict("records"),
                        columns=[{"name": c, "id": c} for c in display_cols],
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                        style_cell={"padding": "10px", "textAlign": "left"},
                        style_data_conditional=[{
                            "if": {"column_id": "actions"},
                            "cursor": "pointer", "color": "#2563EB",
                        }],
                    ),
                ], fluid=True)
            elif tab_id == "notes":
                # 取所有处方注释（含已/未解决），合并到处方信息
                notes_df = _mgmt_load_all_notes()
                if notes_df.empty:
                    return html.Div("暂无处方注释", className="text-secondary p-4")
                display_cols = ["prescription_no", "patient_name", "note_type",
                                "author_name", "content", "is_resolved_label", "created_at", "actions"]
                notes_df = notes_df.copy()
                notes_df["created_at"] = notes_df["created_at"].astype(str)
                notes_df["is_resolved_label"] = notes_df["is_resolved"].map(
                    lambda v: "已解决" if v else "未解决"
                )
                notes_df["actions"] = notes_df["is_resolved"].map(
                    lambda v: "" if v else "[标记已解决]"
                )
                return dbc.Container([
                    html.Div("点击「标记已解决」可关闭该注释；一处方所有注释解决后自动回到审核中。",
                             className="text-muted small mb-2"),
                    dash_table.DataTable(
                        id="mgmt-notes-table",
                        # id(prescription_note 主键)、prescription_id 隐藏在 data 中
                        data=notes_df[display_cols + ["id", "prescription_id"]].to_dict("records"),
                        columns=[{"name": c, "id": c} for c in display_cols],
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                        style_cell={"padding": "10px", "textAlign": "left"},
                        style_data_conditional=[{
                            "if": {"column_id": "actions", "filter_query": '{actions} ne ""'},
                            "cursor": "pointer", "color": "#10B981",
                        }],
                    ),
                ], fluid=True)
            elif tab_id == "batch":
                batch_df = get_batch_history(50)
                if batch_df.empty:
                    return html.Div("暂无导入批次记录", className="text-secondary p-4")
                display_cols = ["batch_no", "source_label", "status_label", "total_records",
                                "success_records", "failed_records", "file_name", "started_at"]
                return dash_table.DataTable(
                    data=batch_df[display_cols].to_dict("records"),
                    columns=[{"name": c, "id": c} for c in display_cols],
                    page_size=15,
                    style_table={"overflowX": "auto"},
                    style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                    style_cell={"padding": "10px", "textAlign": "left"},
                )
            return html.Div()
        except Exception as e:
            logger.exception("mgmt_render_analysis_tab 失败")
            return dbc.Alert(f"数据加载失败: {str(e)}", color="danger")

    # ---------- 审核弹窗：打开 / 关闭 ----------
    @app.callback(
        [Output("mgmt-review-modal", "is_open"),
         Output("mgmt-selected-prescription-id", "data"),
         Output("mgmt-review-detail", "children"),
         Output("mgmt-review-error", "children")],
        [Input("mgmt-review-table", "active_cell"),
         Input("mgmt-review-cancel-btn", "n_clicks")],
        [State("mgmt-review-table", "derived_viewport_data")],
        prevent_initial_call=True,
    )
    def _mgmt_handle_review_modal(active_cell, cancel_clicks, viewport_data):
        try:
            ctx = callback_context
            if ctx.triggered_id == "mgmt-review-cancel-btn":
                return False, None, "", ""

            if not active_cell or active_cell["column_id"] != "actions":
                return no_update, no_update, no_update, no_update

            row_idx = active_cell["row"]
            if not viewport_data or row_idx >= len(viewport_data):
                return no_update, no_update, no_update, no_update

            rx_id = viewport_data[row_idx]["id"]
            rx_no = viewport_data[row_idx].get("prescription_no", "")
            patient = viewport_data[row_idx].get("patient_name", "")
            pharmacy = viewport_data[row_idx].get("pharmacy_name", "")
            status_label = viewport_data[row_idx].get("status_label", "")
            rx_date = viewport_data[row_idx].get("prescription_date", "")
            has_unclear = viewport_data[row_idx].get("has_unclear_photo", "")

            detail = dbc.Row([
                dbc.Col([
                    html.P([html.Strong("处方号："), rx_no]),
                    html.P([html.Strong("患者："), patient]),
                    html.P([html.Strong("门店："), pharmacy]),
                ], width=6),
                dbc.Col([
                    html.P([html.Strong("状态："), status_label]),
                    html.P([html.Strong("开具日期："), rx_date]),
                    html.P([html.Strong("照片不清："), str(has_unclear)]),
                ], width=6),
            ])
            return True, rx_id, detail, ""
        except Exception as e:
            logger.exception("mgmt_handle_review_modal 失败")
            return True, None, dbc.Alert(f"加载失败: {str(e)}", color="danger"), str(e)

    # ---------- 提交审核 ----------
    @app.callback(
        [Output("mgmt-review-modal", "is_open", allow_duplicate=True),
         Output("mgmt-analysis-content", "children", allow_duplicate=True)],
        [Input("mgmt-review-submit-btn", "n_clicks")],
        [State("mgmt-selected-prescription-id", "data"),
         State("mgmt-review-opinion", "value"),
         State("mgmt-review-comment", "value"),
         State("mgmt-analysis-tabs", "active_tab")],
        prevent_initial_call=True,
    )
    def _mgmt_submit_review(n_clicks, prescription_id, opinion_value, comment, active_tab):
        try:
            user_id = _get_current_user_id()
            if not prescription_id or not user_id:
                return no_update, no_update

            # 把字符串转回 PharmacistOpinion 枚举
            opinion = PharmacistOpinion(opinion_value)
            result = submit_pharmacist_review(
                prescription_id=prescription_id,
                pharmacist_id=user_id,
                opinion=opinion,
                comment=comment or "",
            )
            if not result.get("ok"):
                return no_update, dbc.Alert(
                    f"审核提交失败: {result.get('error', '未知错误')}",
                    color="danger",
                    className="mt-2",
                )

            # 提交成功：关闭弹窗，重新渲染当前 Tab 以刷新列表
            new_content = _mgmt_render_tab_content(active_tab)
            return False, new_content
        except Exception as e:
            logger.exception("mgmt_submit_review 失败")
            return True, dbc.Alert(f"提交异常: {str(e)}", color="danger", className="mt-2")

    # ---------- 注释标记已解决 ----------
    @app.callback(
        Output("mgmt-analysis-content", "children", allow_duplicate=True),
        [Input("mgmt-notes-table", "active_cell")],
        [State("mgmt-notes-table", "derived_viewport_data"),
         State("mgmt-analysis-tabs", "active_tab")],
        prevent_initial_call=True,
    )
    def _mgmt_resolve_note_via_table(active_cell, viewport_data, active_tab):
        try:
            if not active_cell or active_cell["column_id"] != "actions":
                return no_update

            row_idx = active_cell["row"]
            if not viewport_data or row_idx >= len(viewport_data):
                return no_update

            note_id = viewport_data[row_idx]["id"]
            user_id = _get_current_user_id()
            if not user_id:
                return no_update

            result = resolve_note(note_id=note_id, resolver_id=user_id)
            if not result.get("ok"):
                return dbc.Alert(
                    f"标记失败: {result.get('error', '未知错误')}",
                    color="danger",
                    className="mt-2",
                )

            # 重新渲染当前 Tab 以刷新列表
            return _mgmt_render_tab_content(active_tab)
        except Exception as e:
            logger.exception("mgmt_resolve_note_via_table 失败")
            return dbc.Alert(f"操作异常: {str(e)}", color="danger")

    # ---------- 辅助：按 tab_id 重新渲染内容（复用 _mgmt_render_analysis_tab 逻辑） ----------
    def _mgmt_render_tab_content(tab_id):
        """供内部回调复用的 Tab 渲染函数，含 try-except 兜底。"""
        try:
            if tab_id == "photo":
                photo_df = get_photo_distribution()
                quality_df = get_photo_quality_detail()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_photo_distribution_chart(photo_df) if not photo_df.empty else _safe_empty_fig()
                    ), width=8),
                    dbc.Col(dcc.Graph(
                        figure=create_photo_quality_pie(quality_df) if not quality_df.empty else _safe_empty_fig()
                    ), width=4),
                ])
            elif tab_id == "funnel":
                funnel_df = get_pharmacist_funnel()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_pharmacist_funnel(funnel_df) if not funnel_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "expiry":
                expiry_df = get_expiry_ranking(limit=20)
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_expiry_ranking_chart(expiry_df) if not expiry_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "member":
                member_df = get_member_changes(90)
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_member_change_chart(member_df) if not member_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "pharmacy":
                ph_df = get_pharmacy_stats()
                return dbc.Row([
                    dbc.Col(dcc.Graph(
                        figure=create_pharmacy_comparison(ph_df) if not ph_df.empty else _safe_empty_fig()
                    ), width=12),
                ])
            elif tab_id == "review":
                review_df = get_pending_review_list(limit=50)
                if review_df.empty:
                    return html.Div("暂无待审核处方", className="text-secondary p-4")
                display_cols = ["prescription_no", "patient_name", "pharmacy_name",
                                "status_label", "has_unclear_photo", "prescription_date", "actions"]
                review_df = review_df.copy()
                review_df["prescription_date"] = review_df["prescription_date"].astype(str)
                review_df["has_unclear_photo"] = review_df["has_unclear_photo"].map(
                    lambda v: "是" if v else "否"
                )
                review_df["actions"] = "[审核](#)"
                return dbc.Container([
                    html.Div("点击「审核」可打开审核窗口，提交后处方状态与回访任务会自动联动。",
                             className="text-muted small mb-2"),
                    dash_table.DataTable(
                        id="mgmt-review-table",
                        # id 列放在 data 里但不在 columns 中定义 → 隐藏列，viewport_data 可读取
                        data=review_df[display_cols + ["id"]].to_dict("records"),
                        columns=[{"name": c, "id": c} for c in display_cols],
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                        style_cell={"padding": "10px", "textAlign": "left"},
                        style_data_conditional=[{
                            "if": {"column_id": "actions"},
                            "cursor": "pointer", "color": "#2563EB",
                        }],
                    ),
                ], fluid=True)
            elif tab_id == "notes":
                notes_df = _mgmt_load_all_notes()
                if notes_df.empty:
                    return html.Div("暂无处方注释", className="text-secondary p-4")
                display_cols = ["prescription_no", "patient_name", "note_type",
                                "author_name", "content", "is_resolved_label", "created_at", "actions"]
                notes_df = notes_df.copy()
                notes_df["created_at"] = notes_df["created_at"].astype(str)
                notes_df["is_resolved_label"] = notes_df["is_resolved"].map(
                    lambda v: "已解决" if v else "未解决"
                )
                notes_df["actions"] = notes_df["is_resolved"].map(
                    lambda v: "" if v else "[标记已解决]"
                )
                return dbc.Container([
                    html.Div("点击「标记已解决」可关闭该注释；一处方所有注释解决后自动回到审核中。",
                             className="text-muted small mb-2"),
                    dash_table.DataTable(
                        id="mgmt-notes-table",
                        # id(prescription_note 主键)、prescription_id 隐藏在 data 中
                        data=notes_df[display_cols + ["id", "prescription_id"]].to_dict("records"),
                        columns=[{"name": c, "id": c} for c in display_cols],
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                        style_cell={"padding": "10px", "textAlign": "left"},
                        style_data_conditional=[{
                            "if": {"column_id": "actions", "filter_query": '{actions} ne ""'},
                            "cursor": "pointer", "color": "#10B981",
                        }],
                    ),
                ], fluid=True)
            elif tab_id == "batch":
                batch_df = get_batch_history(50)
                if batch_df.empty:
                    return html.Div("暂无导入批次记录", className="text-secondary p-4")
                display_cols = ["batch_no", "source_label", "status_label", "total_records",
                                "success_records", "failed_records", "file_name", "started_at"]
                return dash_table.DataTable(
                    data=batch_df[display_cols].to_dict("records"),
                    columns=[{"name": c, "id": c} for c in display_cols],
                    page_size=15,
                    style_table={"overflowX": "auto"},
                    style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                    style_cell={"padding": "10px", "textAlign": "left"},
                )
            return html.Div()
        except Exception as e:
            logger.exception("mgmt_render_tab_content 失败")
            return dbc.Alert(f"数据加载失败: {str(e)}", color="danger")
