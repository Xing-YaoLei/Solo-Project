import logging
from datetime import datetime, date
import pandas as pd
import plotly.graph_objects as go
from dash import Input, Output, State, ALL, dash_table, html, dcc, callback_context
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc

from app.utils.database import SessionLocal
from app.models.schema import (
    ElderProfile, AdmissionAssessment, Medication, ReviewNote
)
from app.services.data_processor import COLOR_MAP
from app.services.export_service import (
    export_elder_full_report, get_download_filename,
)
from app.services.view_storage import (
    save_view, list_views, get_view, delete_view, build_snapshot
)

logger = logging.getLogger(__name__)


def _render_profile_html(profile: dict) -> html.Div:
    age = None
    if profile.get("birth_date"):
        try:
            bd = date.fromisoformat(profile["birth_date"])
            today = date.today()
            age = today.year - bd.year - (
                (today.month, today.day) < (bd.month, bd.day)
            )
        except Exception:
            pass

    rows = [
        ("姓名", profile.get("name")),
        ("编号", profile.get("elder_code")),
        ("性别", profile.get("gender")),
        ("年龄", f"{age}岁" if age else "-"),
        ("出生日期", profile.get("birth_date") or "-"),
        ("入住日期", profile.get("admission_date") or "-"),
        ("房间号", profile.get("room_number") or "-"),
        ("联系电话", profile.get("phone") or "-"),
        ("紧急联系人", profile.get("emergency_contact") or "-"),
        ("紧急联系电话", profile.get("emergency_phone") or "-"),
        ("当前状态", profile.get("current_status")),
    ]
    return dbc.Row([
        dbc.Col(
            [
                html.Strong(f"{label}: "),
                html.Span(str(value)),
            ],
            width=6,
            className="mb-2",
        )
        for label, value in rows
    ])


def _render_care_figure(assessments: list) -> go.Figure:
    if not assessments:
        fig = go.Figure()
        fig.update_layout(title="暂无评估记录", height=300)
        return fig

    df = pd.DataFrame([{
        "date": pd.to_datetime(a["date"]),
        "score": a["score"],
        "level": a["level"],
    } for a in assessments])

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["date"],
        y=df["score"],
        mode="lines+markers+text",
        text=df["level"],
        textposition="top center",
        line=dict(color="#0d6efd", width=2),
        marker=dict(size=10, color=[COLOR_MAP.get(l, "#666") for l in df["level"]]),
    ))
    fig.update_layout(
        title="护理等级评估历史（快照）",
        xaxis_title="评估日期",
        yaxis_title="护理评分",
        yaxis=dict(range=[0, 100]),
        height=300,
    )
    return fig


def _render_medication_html(medications: list) -> html.Div:
    if not medications:
        return html.P("暂无用药记录", className="text-muted")

    data = [{
        "药品名称": m["medication_name"],
        "剂量": m.get("dosage") or "-",
        "频次": m.get("frequency") or "-",
        "给药途径": m.get("administration_route") or "-",
        "开始日期": m.get("start_date") or "-",
        "开方医生": m.get("prescribing_doctor") or "-",
        "备注": m.get("notes") or "-",
    } for m in medications]

    return dash_table.DataTable(
        data=data,
        page_size=8,
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"textAlign": "left", "padding": "8px"},
    )


def _render_notes_html(notes: list) -> html.Div:
    if not notes:
        return html.P("暂无复盘备注", className="text-muted")

    note_cards = [
        dbc.Card(
            dbc.CardBody(
                [
                    html.Div(
                        [
                            dbc.Badge(n.get("type") or "备注", color="secondary", className="me-2"),
                            html.Small(
                                f"{n.get('date', '-')} - {n.get('author') or '未知'}"
                            ),
                        ],
                        className="mb-2",
                    ),
                    html.P(n.get("content", ""), className="mb-0"),
                ]
            ),
            className="mb-2",
        )
        for n in notes
    ]
    return html.Div(note_cards)


def register_elder_callbacks(app):
    @app.callback(
        Output("elder-selector", "options"),
        Input("interval-component", "n_intervals"),
    )
    def load_elder_options(n):
        db = SessionLocal()
        try:
            elders = db.query(ElderProfile).filter(
                ElderProfile.current_status == "在住"
            ).order_by(ElderProfile.name).all()
            return [
                {"label": f"{e.name} ({e.elder_code})", "value": e.id}
                for e in elders
            ]
        except Exception as e:
            logger.error(f"加载老人列表失败: {e}")
            return []
        finally:
            db.close()

    @app.callback(
        Output("elder-profile-display", "children"),
        Output("elder-care-badge", "children"),
        Output("elder-assessment-history", "figure"),
        Output("elder-medication-display", "children"),
        Output("elder-review-notes", "children"),
        Output("btn-save-view", "disabled"),
        Input("elder-selector", "value"),
        State("interval-component", "n_intervals"),
    )
    def load_elder_detail(elder_id, n):
        if not elder_id:
            return (
                html.P("请选择一位老人查看档案", className="text-muted"),
                "",
                go.Figure(),
                html.P("暂无用药信息", className="text-muted"),
                html.P("暂无复盘备注", className="text-muted"),
                True,
            )

        db = SessionLocal()
        try:
            elder = db.query(ElderProfile).filter(ElderProfile.id == elder_id).first()
            if not elder:
                return (
                    html.P("未找到老人信息", className="text-danger"),
                    "",
                    go.Figure(),
                    html.P("无数据", className="text-muted"),
                    html.P("无数据", className="text-muted"),
                    True,
                )

            age = None
            if elder.birth_date:
                today = date.today()
                age = today.year - elder.birth_date.year - (
                    (today.month, today.day) < (elder.birth_date.month, elder.birth_date.day)
                )

            profile_rows = [
                ("姓名", elder.name),
                ("编号", elder.elder_code),
                ("性别", elder.gender),
                ("年龄", f"{age}岁" if age else "-"),
                ("出生日期", str(elder.birth_date) if elder.birth_date else "-"),
                ("入住日期", str(elder.admission_date) if elder.admission_date else "-"),
                ("房间号", elder.room_number or "-"),
                ("联系电话", elder.phone or "-"),
                ("紧急联系人", elder.emergency_contact or "-"),
                ("紧急联系电话", elder.emergency_phone or "-"),
                ("当前状态", elder.current_status),
            ]
            profile_html = dbc.Row([
                dbc.Col(
                    [html.Strong(f"{label}: "), html.Span(str(value))],
                    width=6,
                    className="mb-2",
                )
                for label, value in profile_rows
            ])

            assessments = db.query(AdmissionAssessment).filter(
                AdmissionAssessment.elder_id == elder_id
            ).order_by(AdmissionAssessment.assessment_date).all()

            latest_level = ""
            if assessments:
                latest = assessments[-1]
                latest_level = latest.care_level

            if assessments:
                df = pd.DataFrame([{
                    "date": a.assessment_date,
                    "score": float(a.care_score) if a.care_score else 0,
                    "level": a.care_level,
                } for a in assessments])

                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df["date"],
                    y=df["score"],
                    mode="lines+markers+text",
                    text=df["level"],
                    textposition="top center",
                    line=dict(color="#0d6efd", width=2),
                    marker=dict(size=10, color=[COLOR_MAP.get(l, "#666") for l in df["level"]]),
                ))
                fig.update_layout(
                    title="护理等级评估历史",
                    xaxis_title="评估日期",
                    yaxis_title="护理评分",
                    yaxis=dict(range=[0, 100]),
                    height=300,
                )
            else:
                fig = go.Figure()
                fig.update_layout(title="暂无评估记录", height=300)

            medications = db.query(Medication).filter(
                Medication.elder_id == elder_id,
                Medication.is_active == True,
            ).all()

            if medications:
                med_data = [{
                    "药品名称": m.medication_name,
                    "剂量": m.dosage or "-",
                    "频次": m.frequency or "-",
                    "给药途径": m.administration_route or "-",
                    "开始日期": str(m.start_date) if m.start_date else "-",
                    "开方医生": m.prescribing_doctor or "-",
                    "备注": m.notes or "-",
                } for m in medications]
                med_html = dash_table.DataTable(
                    data=med_data,
                    page_size=8,
                    style_table={"overflowX": "auto"},
                    style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                    style_cell={"textAlign": "left", "padding": "8px"},
                )
            else:
                med_html = html.P("暂无用药记录", className="text-muted")

            notes = db.query(ReviewNote).filter(
                ReviewNote.elder_id == elder_id
            ).order_by(ReviewNote.note_date.desc()).all()

            if notes:
                note_cards = []
                for note in notes:
                    note_cards.append(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.Div(
                                        [
                                            dbc.Badge(note.note_type or "备注", color="secondary", className="me-2"),
                                            html.Small(
                                                f"{note.note_date} - {note.note_author or '未知'}"
                                            ),
                                        ],
                                        className="mb-2",
                                    ),
                                    html.P(note.content, className="mb-0"),
                                ]
                            ),
                            className="mb-2",
                        )
                    )
                notes_html = html.Div(note_cards)
            else:
                notes_html = html.P("暂无复盘备注", className="text-muted")

            return profile_html, latest_level, fig, med_html, notes_html, False
        except Exception as e:
            logger.error(f"加载老人详情失败: {e}")
            return (
                html.P(f"加载失败: {str(e)}", className="text-danger"),
                "",
                go.Figure(),
                html.P("加载失败", className="text-danger"),
                html.P("加载失败", className="text-danger"),
                True,
            )
        finally:
            db.close()

    @app.callback(
        Output("note-modal", "is_open"),
        Input("btn-add-note", "n_clicks"),
        Input("btn-cancel-note", "n_clicks"),
        State("note-modal", "is_open"),
        prevent_initial_call=True,
    )
    def toggle_note_modal(open_clicks, cancel_clicks, is_open):
        return not is_open

    @app.callback(
        Output("btn-save-note", "disabled"),
        Input("note-type", "value"),
        Input("note-content", "value"),
    )
    def validate_note_form(note_type, note_content):
        return not (note_type and note_content and len(note_content.strip()) > 0)

    @app.callback(
        Output("note-modal", "is_open", allow_duplicate=True),
        Output("interval-component", "n_intervals", allow_duplicate=True),
        Input("btn-save-note", "n_clicks"),
        State("elder-selector", "value"),
        State("note-type", "value"),
        State("note-content", "value"),
        State("interval-component", "n_intervals"),
        prevent_initial_call=True,
    )
    def save_note(save_clicks, elder_id, note_type, content, n):
        if not elder_id or not note_type or not content:
            raise PreventUpdate
        db = SessionLocal()
        try:
            note = ReviewNote(
                elder_id=elder_id,
                note_date=date.today(),
                note_type=note_type,
                content=content.strip(),
                note_author="系统用户",
            )
            db.add(note)
            db.commit()
            return False, (n or 0) + 1
        except Exception as e:
            logger.error(f"保存备注失败: {e}")
            db.rollback()
            raise PreventUpdate
        finally:
            db.close()

    # ========== 保存视图弹窗 ==========
    @app.callback(
        Output("save-view-modal", "is_open"),
        Output("save-view-name", "value"),
        Input("btn-save-view", "n_clicks"),
        Input("btn-cancel-save-view", "n_clicks"),
        State("elder-selector", "value"),
        State("save-view-modal", "is_open"),
        prevent_initial_call=True,
    )
    def toggle_save_view_modal(save_clicks, cancel_clicks, elder_id, is_open):
        ctx = callback_context
        trigger = ctx.triggered[0]["prop_id"].split(".")[0]
        if trigger == "btn-save-view" and elder_id:
            db = SessionLocal()
            default_name = ""
            try:
                elder = db.query(ElderProfile).filter(ElderProfile.id == elder_id).first()
                if elder:
                    existing = list_views()
                    for v in existing:
                        if v.get("elder_id") == elder_id:
                            default_name = v.get("view_name", f"{elder.name}的常用视图")
                            break
                    else:
                        default_name = f"{elder.name}的常用视图"
            except Exception:
                pass
            finally:
                db.close()
            return True, default_name
        return False, ""

    @app.callback(
        Output("btn-confirm-save-view", "disabled"),
        Input("elder-selector", "value"),
    )
    def validate_save_view(elder_id):
        return elder_id is None

    @app.callback(
        Output("save-view-modal", "is_open", allow_duplicate=True),
        Output("saved-views-list", "children", allow_duplicate=True),
        Output("btn-save-view", "children", allow_duplicate=True),
        Input("btn-confirm-save-view", "n_clicks"),
        State("elder-selector", "value"),
        State("save-view-name", "value"),
        prevent_initial_call=True,
    )
    def do_save_view(n_clicks, elder_id, view_name):
        if not n_clicks or not elder_id:
            raise PreventUpdate
        db = SessionLocal()
        try:
            elder = db.query(ElderProfile).filter(ElderProfile.id == elder_id).first()
            if not elder:
                raise PreventUpdate

            snapshot = build_snapshot(db, elder_id)
            saved = save_view(
                elder_id=elder_id,
                elder_code=elder.elder_code,
                elder_name=elder.name,
                snapshot=snapshot,
                view_name=view_name.strip() if view_name and view_name.strip() else None,
            )
            if saved:
                views_list = _render_saved_views_list()
                return False, views_list, "✓ 已更新视图快照"
            else:
                raise PreventUpdate
        except Exception as e:
            logger.error(f"保存视图失败: {e}")
            raise PreventUpdate
        finally:
            db.close()

    # ========== 侧边栏：已保存视图列表 ==========
    @app.callback(
        Output("saved-views-list", "children"),
        Input("interval-component", "n_intervals"),
    )
    def render_saved_views_list(n):
        return _render_saved_views_list()

    def _render_saved_views_list():
        views = list_views()
        if not views:
            return html.Div(
                html.Small("暂无已保存视图", className="text-white-50"),
                className="mt-1",
            )

        items = []
        for v in views:
            try:
                updated_at = datetime.fromisoformat(v["updated_at"])
                time_label = updated_at.strftime("%m-%d %H:%M")
            except Exception:
                time_label = v.get("updated_at", "")

            items.append(
                html.Div(
                    [
                        dbc.Button(
                            [
                                html.Div(
                                    [
                                        html.Strong(v["elder_name"], className="d-block text-start text-truncate"),
                                        html.Small(
                                            f"{v.get('elder_code','')} · {time_label}",
                                            className="text-white-50 d-block text-start",
                                        ),
                                    ],
                                    className="flex-grow-1",
                                )
                            ],
                            id={"type": "btn-restore-view", "index": v["view_id"]},
                            color="link",
                            className="w-100 text-start text-white p-1 mb-1 border border-white-50 rounded",
                            style={"textDecoration": "none"},
                            n_clicks=0,
                        ),
                    ],
                    className="mb-1",
                )
            )
        return html.Div(items)

    # ========== 恢复视图弹窗 ==========
    @app.callback(
        Output("restore-view-modal", "is_open"),
        Output("restore-view-title", "children"),
        Output("active-view-id", "data"),
        Output("restore-profile-body", "children"),
        Output("restore-care-graph", "figure"),
        Output("restore-medication-body", "children"),
        Output("restore-notes-body", "children"),
        Output("btn-download-restored-view", "children"),
        Input({"type": "btn-restore-view", "index": ALL}, "n_clicks"),
        Input("btn-close-restore", "n_clicks"),
        State("restore-view-modal", "is_open"),
        prevent_initial_call=True,
    )
    def open_restore_view_modal(restore_clicks, close_clicks, is_open):
        ctx = callback_context
        trigger = ctx.triggered[0]["prop_id"].split(".")[0]

        if trigger == "btn-close-restore":
            return False, "", "", html.Div(), go.Figure(), html.Div(), html.Div(), ""

        try:
            import json
            trigger_dict = json.loads(trigger)
            view_id = trigger_dict.get("index")
        except (json.JSONDecodeError, KeyError, TypeError):
            raise PreventUpdate

        view = get_view(view_id)
        if not view:
            raise PreventUpdate

        snapshot = view.get("snapshot", {})
        try:
            updated_at = datetime.fromisoformat(view.get("updated_at", ""))
            time_label = updated_at.strftime("%Y-%m-%d %H:%M")
        except Exception:
            time_label = view.get("updated_at", "")

        profile_html = _render_profile_html(snapshot.get("profile", {}))
        care_fig = _render_care_figure(snapshot.get("assessments", []))
        med_html = _render_medication_html(snapshot.get("medications", []))
        notes_html = _render_notes_html(snapshot.get("review_notes", []))
        title = f"{view.get('view_name', '视图快照')}  ·  快照时间: {time_label}"

        return (
            True,
            title,
            view_id,
            profile_html,
            care_fig,
            med_html,
            notes_html,
            "📥 导出快照Excel",
        )

    @app.callback(
        Output("restore-view-modal", "is_open", allow_duplicate=True),
        Output("elder-selector", "value", allow_duplicate=True),
        Input("btn-apply-restore", "n_clicks"),
        State("active-view-id", "data"),
        prevent_initial_call=True,
    )
    def apply_restore_to_selector(n_clicks, view_id):
        if not n_clicks or not view_id:
            raise PreventUpdate
        view = get_view(view_id)
        if not view:
            raise PreventUpdate
        elder_id = view.get("elder_id")
        if not elder_id:
            raise PreventUpdate
        return False, elder_id

    @app.callback(
        Output("restore-view-modal", "is_open", allow_duplicate=True),
        Output("saved-views-list", "children", allow_duplicate=True),
        Input("btn-delete-restore", "n_clicks"),
        State("active-view-id", "data"),
        State("restore-view-modal", "is_open"),
        prevent_initial_call=True,
    )
    def delete_saved_view(n_clicks, view_id, is_open):
        if not n_clicks or not view_id:
            raise PreventUpdate
        delete_view(view_id)
        return False, _render_saved_views_list()

    @app.callback(
        Output("download-restored-view", "data"),
        Input("btn-download-restored-view", "n_clicks"),
        State("active-view-id", "data"),
        prevent_initial_call=True,
    )
    def download_restored_view(n_clicks, view_id):
        if not n_clicks or not view_id:
            raise PreventUpdate
        view = get_view(view_id)
        if not view:
            raise PreventUpdate
        elder_data = view.get("snapshot", {})
        excel_bytes = export_elder_full_report(elder_data)
        filename = get_download_filename(
            f"view_{view.get('elder_code', 'snapshot')}"
        )
        return dcc.send_bytes(excel_bytes, filename)

    # ========== 用药清单筛选 ==========
    @app.callback(
        Output("medication-elder-filter", "options"),
        Input("interval-component", "n_intervals"),
    )
    def load_med_filter_options(n):
        db = SessionLocal()
        try:
            elders = db.query(ElderProfile).order_by(ElderProfile.name).all()
            options = [{"label": "全部老人", "value": None}]
            options.extend([
                {"label": f"{e.name} ({e.elder_code})", "value": e.id}
                for e in elders
            ])
            return options
        except Exception as e:
            logger.error(f"加载用药筛选失败: {e}")
            return []
        finally:
            db.close()

    @app.callback(
        Output("medication-table-container", "children"),
        Input("medication-elder-filter", "value"),
        Input("interval-component", "n_intervals"),
    )
    def load_medication_table(elder_id, n):
        db = SessionLocal()
        try:
            query = db.query(Medication).filter(Medication.is_active == True)
            if elder_id:
                query = query.filter(Medication.elder_id == elder_id)
            meds = query.all()

            if not meds:
                return html.P("暂无用药数据", className="text-muted")

            elder_map = {}
            if elder_id is None:
                elders = db.query(ElderProfile).all()
                elder_map = {e.id: f"{e.name}({e.elder_code})" for e in elders}

            med_data = []
            for m in meds:
                row = {
                    "老人": elder_map.get(m.elder_id, "") if elder_id is None else "",
                    "药品名称": m.medication_name,
                    "剂量": m.dosage or "-",
                    "频次": m.frequency or "-",
                    "给药途径": m.administration_route or "-",
                    "开始日期": str(m.start_date) if m.start_date else "-",
                    "结束日期": str(m.end_date) if m.end_date else "-",
                    "开方医生": m.prescribing_doctor or "-",
                    "备注": m.notes or "-",
                }
                if elder_id is None:
                    med_data.append(row)
                else:
                    del row["老人"]
                    med_data.append(row)

            return dash_table.DataTable(
                data=med_data,
                page_size=15,
                style_table={"overflowX": "auto"},
                style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                style_cell={"textAlign": "left", "padding": "8px"},
                sort_action="native",
                filter_action="native",
            )
        except Exception as e:
            logger.error(f"加载用药表失败: {e}")
            return html.P(f"加载失败: {str(e)}", className="text-danger")
        finally:
            db.close()
