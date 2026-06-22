import io
import base64
import json
from datetime import date, datetime

import pandas as pd
from dash import Input, Output, State, callback_context, no_update, html, dash_table
import dash_bootstrap_components as dbc
from flask_login import current_user

from app.database import SessionLocal
from app.services.query_service import (
    get_checklist_distribution, get_sampling_funnel,
    get_rectification_ranking, get_risk_level_changes,
    get_risk_summary, get_sampling_records_df, get_comments_for_sample,
    get_batch_history,
)
from app.services.sample_service import add_comment, get_user_by_id
from app.services.email_service import parse_email_dataframe, import_emails
from app.services.permission_service import parse_permission_dataframe, import_permission_logs
from app.services.workpaper_service import parse_workpaper_dataframe, import_workpapers
from app.services.merge_service import run_merge_pipeline
from app.dash_app.charts import (
    fig_checklist_distribution, fig_sampling_funnel,
    fig_rectification_ranking, fig_risk_level_changes,
)


def _parse_date(date_value):
    if date_value is None:
        return None
    if isinstance(date_value, date):
        return date_value
    try:
        return datetime.fromisoformat(str(date_value)).date()
    except Exception:
        return None


def _parse_upload(contents, filename):
    if contents is None:
        return None
    content_type, content_string = contents.split(",")
    decoded = base64.b64decode(content_string)
    try:
        if "csv" in filename.lower():
            return pd.read_csv(io.StringIO(decoded.decode("utf-8")))
        else:
            return pd.read_excel(io.BytesIO(decoded))
    except Exception:
        return None


def register_callbacks(app):
    @app.callback(
        [
            Output("kpi-total", "children"),
            Output("kpi-completed", "children"),
            Output("kpi-high-risk", "children"),
            Output("kpi-evidence-missing", "children"),
            Output("chart-checklist-dist", "figure"),
            Output("chart-funnel", "figure"),
            Output("chart-rectification", "figure"),
            Output("chart-risk-change", "figure"),
            Output("table-samples", "data"),
        ],
        [
            Input("btn-refresh", "n_clicks"),
            Input("filter-start-date", "date"),
            Input("filter-end-date", "date"),
            Input("filter-department", "value"),
        ],
        prevent_initial_call=False,
    )
    def update_dashboard(_n_clicks, start_date_str, end_date_str, department):
        if not current_user.is_authenticated:
            return no_update

        db = SessionLocal()
        try:
            start_date = _parse_date(start_date_str)
            end_date = _parse_date(end_date_str)
            dept = department if department else None

            samples_df = get_sampling_records_df(db, current_user, start_date, end_date, dept)
            total = len(samples_df)
            completed = len(samples_df[samples_df["status"] == "completed"]) if not samples_df.empty else 0
            high_risk = len(samples_df[samples_df["risk_level"].isin(["high", "critical"])]) if not samples_df.empty else 0
            evidence_missing = len(samples_df[samples_df["status"] == "evidence_missing"]) if not samples_df.empty else 0

            checklist_df = get_checklist_distribution(db, current_user, start_date, end_date, dept)
            funnel = get_sampling_funnel(db, current_user, start_date, end_date, dept)
            rect_df = get_rectification_ranking(db, current_user, start_date, end_date, dept)
            risk_changes_df = get_risk_level_changes(db, current_user, start_date, end_date, dept)
            risk_summary = get_risk_summary(db, current_user, start_date, end_date, dept)

            fig1 = fig_checklist_distribution(checklist_df)
            fig2 = fig_sampling_funnel(funnel)
            fig3 = fig_rectification_ranking(rect_df)
            fig4 = fig_risk_level_changes(risk_changes_df, risk_summary)

            table_data = samples_df.to_dict("records") if not samples_df.empty else []
            for row in table_data:
                if "audit_date" in row and row["audit_date"]:
                    row["audit_date"] = str(row["audit_date"])
                if "has_evidence" in row:
                    row["has_evidence"] = "是" if row["has_evidence"] else "否"
                if "status" in row:
                    status_map = {
                        "pending": "待处理", "in_progress": "处理中",
                        "completed": "已完成", "evidence_missing": "证据缺失",
                    }
                    row["status"] = status_map.get(row["status"], row["status"])
                if "risk_level" in row:
                    risk_map = {"low": "低", "medium": "中", "high": "高", "critical": "严重"}
                    row["risk_level"] = risk_map.get(row["risk_level"], row["risk_level"])

            return total, completed, high_risk, evidence_missing, fig1, fig2, fig3, fig4, table_data
        finally:
            db.close()

    @app.callback(
        Output("btn-open-comment", "disabled"),
        [Input("table-samples", "selected_rows")],
    )
    def toggle_comment_button(selected_rows):
        return not (selected_rows and len(selected_rows) > 0)

    @app.callback(
        [
            Output("modal-comment", "is_open"),
            Output("modal-sample-info", "children"),
            Output("modal-comments-list", "children"),
            Output("comment-content", "value"),
            Output("comment-evidence-missing", "value"),
        ],
        [
            Input("btn-open-comment", "n_clicks"),
            Input("btn-close-modal", "n_clicks"),
            Input("btn-submit-comment", "n_clicks"),
        ],
        [
            State("modal-comment", "is_open"),
            State("table-samples", "derived_virtual_data"),
            State("table-samples", "selected_rows"),
            State("comment-content", "value"),
            State("comment-evidence-missing", "value"),
        ],
        prevent_initial_call=True,
    )
    def handle_comment_modal(btn_open, btn_close, btn_submit, is_open, rows, selected, content, evidence_flags):
        ctx = callback_context
        triggered = ctx.triggered[0]["prop_id"].split(".")[0]
        db = SessionLocal()
        try:
            if triggered == "btn-submit-comment" and content:
                if selected and len(selected) > 0 and rows:
                    row = rows[selected[0]]
                    sample_id = row.get("id")
                    if sample_id and content.strip():
                        is_evidence = bool(evidence_flags and "evidence_missing" in evidence_flags)
                        add_comment(
                            db,
                            sampling_record_id=sample_id,
                            user_id=current_user.id,
                            content=content.strip(),
                            is_evidence_missing=is_evidence,
                        )

            if triggered in ("btn-open-comment", "btn-submit-comment"):
                if not selected or len(selected) == 0 or not rows:
                    return False, html.Div(), html.Div(), "", []
                row = rows[selected[0]]
                sample_id = row.get("id")

                info = dbc.Alert(
                    [
                        html.Strong(f"抽样编号: {row.get('sample_code', '')}  "),
                        html.Span(f"部门: {row.get('department', '')}  "),
                        html.Span(f"状态: {row.get('status', '')}  "),
                        html.Span(f"风险: {row.get('risk_level', '')}  "),
                        html.Span(f"证据: {row.get('has_evidence', '')}"),
                    ],
                    color="info",
                )

                comments = get_comments_for_sample(db, sample_id) if sample_id else []
                if not comments:
                    comments_list = html.P("暂无注释", className="text-muted")
                else:
                    items = []
                    for c in comments:
                        badge_color = "danger" if c.get("is_evidence_missing") else "secondary"
                        badge_text = "证据缺失" if c.get("is_evidence_missing") else c.get("comment_type", "general")
                        items.append(
                            dbc.Card(
                                dbc.CardBody(
                                    [
                                        html.Div(
                                            [
                                                html.Strong(c.get("user_name", "未知用户")),
                                                dbc.Badge(badge_text, color=badge_color, className="ms-2"),
                                                html.Span(
                                                    f"  {c.get('created_at', '').strftime('%Y-%m-%d %H:%M') if hasattr(c.get('created_at'), 'strftime') else c.get('created_at', '')}",
                                                    className="text-muted small ms-2",
                                                ),
                                            ],
                                            className="mb-2",
                                        ),
                                        html.P(c.get("content", ""), className="mb-0"),
                                    ]
                                ),
                                className="mb-2",
                            )
                        )
                    comments_list = html.Div(items)

                return True, info, comments_list, "", []

            return False, html.Div(), html.Div(), "", []
        finally:
            db.close()

    @app.callback(
        Output("upload-email-status", "children"),
        Input("upload-email", "contents"),
        State("upload-email", "filename"),
        prevent_initial_call=True,
    )
    def handle_email_upload(contents, filename):
        if not contents:
            return ""
        df = _parse_upload(contents, filename)
        if df is None:
            return dbc.Alert("文件解析失败，请检查格式", color="danger")
        db = SessionLocal()
        try:
            records = parse_email_dataframe(df)
            batch_num = import_emails(db, records, f"上传文件: {filename}", current_user.id)
            return dbc.Alert(f"导入成功！批次号: {batch_num}，共 {len(records)} 条记录", color="success")
        except Exception as e:
            return dbc.Alert(f"导入失败: {str(e)}", color="danger")
        finally:
            db.close()

    @app.callback(
        Output("upload-permission-status", "children"),
        Input("upload-permission", "contents"),
        State("upload-permission", "filename"),
        prevent_initial_call=True,
    )
    def handle_permission_upload(contents, filename):
        if not contents:
            return ""
        df = _parse_upload(contents, filename)
        if df is None:
            return dbc.Alert("文件解析失败，请检查格式", color="danger")
        db = SessionLocal()
        try:
            records = parse_permission_dataframe(df)
            batch_num = import_permission_logs(db, records, f"上传文件: {filename}", current_user.id)
            return dbc.Alert(f"导入成功！批次号: {batch_num}，共 {len(records)} 条记录", color="success")
        except Exception as e:
            return dbc.Alert(f"导入失败: {str(e)}", color="danger")
        finally:
            db.close()

    @app.callback(
        Output("upload-workpaper-status", "children"),
        Input("upload-workpaper", "contents"),
        State("upload-workpaper", "filename"),
        prevent_initial_call=True,
    )
    def handle_workpaper_upload(contents, filename):
        if not contents:
            return ""
        df = _parse_upload(contents, filename)
        if df is None:
            return dbc.Alert("文件解析失败，请检查格式", color="danger")
        db = SessionLocal()
        try:
            records = parse_workpaper_dataframe(df)
            batch_num = import_workpapers(db, records, f"上传文件: {filename}", current_user.id)
            return dbc.Alert(f"导入成功！批次号: {batch_num}，共 {len(records)} 条记录", color="success")
        except Exception as e:
            return dbc.Alert(f"导入失败: {str(e)}", color="danger")
        finally:
            db.close()

    @app.callback(
        Output("merge-status", "children"),
        Input("btn-run-merge", "n_clicks"),
        prevent_initial_call=True,
    )
    def run_merge(_n_clicks):
        db = SessionLocal()
        try:
            batch_num, count = run_merge_pipeline(db, imported_by=current_user.id)
            return dbc.Alert(f"合并完成！批次号: {batch_num}，生成 {count} 条抽样记录", color="success", className="ms-2")
        except Exception as e:
            return dbc.Alert(f"合并失败: {str(e)}", color="danger", className="ms-2")
        finally:
            db.close()

    @app.callback(
        Output("table-batches", "data"),
        Input("page-content", "children"),
        prevent_initial_call=False,
    )
    def load_batches(_content):
        db = SessionLocal()
        try:
            df = get_batch_history(db)
            if df.empty:
                return []
            for col in ["started_at", "completed_at"]:
                if col in df.columns:
                    df[col] = df[col].astype(str)
            return df.to_dict("records")
        finally:
            db.close()
