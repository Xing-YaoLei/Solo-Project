import logging
from datetime import datetime, date
import pandas as pd
import plotly.graph_objects as go
from dash import Input, Output, State, dash_table, html, dcc, callback_context, ALL
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc

from app.utils.database import SessionLocal
from app.models.schema import (
    ElderProfile, AdmissionAssessment, Medication, ReviewNote
)
from app.services.data_processor import CARE_LEVEL_ORDER, COLOR_MAP
from app.services.export_service import (
    export_assessment_report, export_conflict_report,
    export_elder_full_report, get_download_filename,
)
from app.services.data_processor import get_care_standards_text

logger = logging.getLogger(__name__)


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
                {
                    "label": f"{e.name} ({e.elder_code})",
                    "value": e.id,
                }
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
        Input("elder-selector", "value"),
        State("interval-component", "n_intervals"),
    )
    def load_elder_detail(elder_id, n):
        if not elder_id:
            raise PreventUpdate

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
                    [
                        html.Strong(f"{label}: "),
                        html.Span(str(value)),
                    ],
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

            return profile_html, latest_level, fig, med_html, notes_html
        except Exception as e:
            logger.error(f"加载老人详情失败: {e}")
            return (
                html.P(f"加载失败: {str(e)}", className="text-danger"),
                "",
                go.Figure(),
                html.P("加载失败", className="text-danger"),
                html.P("加载失败", className="text-danger"),
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

    @app.callback(
        Output("btn-save-view", "children"),
        Input("btn-save-view", "n_clicks"),
        State("elder-selector", "value"),
        prevent_initial_call=True,
    )
    def save_favorite_view(n_clicks, elder_id):
        if not elder_id:
            return "保存为常用视图"
        try:
            import json
            favorites_path = "app/data/favorite_views.json"
            try:
                with open(favorites_path, "r", encoding="utf-8") as f:
                    favorites = json.load(f)
            except FileNotFoundError:
                favorites = []
            if elder_id not in favorites:
                favorites.append(elder_id)
                with open(favorites_path, "w", encoding="utf-8") as f:
                    json.dump(favorites, f, ensure_ascii=False, indent=2)
            return "✓ 已保存为常用视图"
        except Exception as e:
            logger.error(f"保存视图失败: {e}")
            return "保存失败"

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
