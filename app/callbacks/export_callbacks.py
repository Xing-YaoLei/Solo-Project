import logging
import io
from datetime import date
import pandas as pd
from dash import Input, Output, State, dash_table, html, dcc
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc

from app.utils.database import SessionLocal
from app.models.schema import CaliberConflict, ElderProfile, AdmissionAssessment
from app.services.data_processor import (
    generate_conflict_diff_table, get_care_standards_text,
    clean_assessment_data,
)
from app.services.export_service import (
    export_assessment_report, export_conflict_report,
    export_elder_full_report, get_download_filename,
)

logger = logging.getLogger(__name__)


def register_export_callbacks(app):
    @app.callback(
        Output("conflict-table-container", "children"),
        Input("conflict-date-range", "start_date"),
        Input("conflict-date-range", "end_date"),
        Input("conflict-only-unresolved", "value"),
        Input("interval-component", "n_intervals"),
    )
    def load_conflict_table(start_date, end_date, only_unresolved, n):
        db = SessionLocal()
        try:
            query = db.query(CaliberConflict)
            if start_date:
                query = query.filter(CaliberConflict.conflict_date >= start_date)
            if end_date:
                query = query.filter(CaliberConflict.conflict_date <= end_date)
            if only_unresolved:
                query = query.filter(CaliberConflict.resolved == False)

            conflicts = query.order_by(
                CaliberConflict.conflict_date.desc(),
                CaliberConflict.elder_code,
            ).all()

            if not conflicts:
                return html.P("暂无口径冲突记录", className="text-muted")

            data = []
            for c in conflicts:
                row_style = {} if c.resolved else {"backgroundColor": "#fff3cd"}
                data.append({
                    "老人编号": c.elder_code,
                    "冲突日期": str(c.conflict_date),
                    "冲突类型": c.conflict_type,
                    "护理终端值": c.care_terminal_value or "-",
                    "收费系统值": c.billing_system_value or "-",
                    "护理终端口径": c.care_terminal_caliber or "-",
                    "收费口径": c.billing_caliber or "-",
                    "差异说明": c.difference_description or "",
                    "状态": "已解决" if c.resolved else "未解决",
                    "解决备注": c.resolution_note or "",
                })

            return dash_table.DataTable(
                data=data,
                page_size=20,
                style_table={"overflowX": "auto"},
                style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                style_cell={"textAlign": "left", "padding": "8px", "whiteSpace": "normal"},
                style_data_conditional=[
                    {
                        "if": {"filter_query": '{状态} = "未解决"'},
                        "backgroundColor": "#fff3cd",
                    }
                ],
                sort_action="native",
                filter_action="native",
                export_format="xlsx",
                export_headers="display",
            )
        except Exception as e:
            logger.error(f"加载冲突表失败: {e}")
            return html.P(f"加载失败: {str(e)}", className="text-danger")
        finally:
            db.close()

    @app.callback(
        Output("download-report", "data"),
        Input("btn-export-report", "n_clicks"),
        State("filter-start-date", "date"),
        State("filter-end-date", "date"),
        State("elder-selector", "value"),
        prevent_initial_call=True,
    )
    def export_report(n_clicks, start_date, end_date, elder_id):
        if not n_clicks:
            raise PreventUpdate

        db = SessionLocal()
        try:
            query = db.query(AdmissionAssessment)
            if start_date:
                query = query.filter(AdmissionAssessment.assessment_date >= start_date)
            if end_date:
                query = query.filter(AdmissionAssessment.assessment_date <= end_date)
            records = query.all()

            df = pd.DataFrame([{
                "评估ID": r.id,
                "老人ID": r.elder_id,
                "评估日期": str(r.assessment_date),
                "护理等级": r.care_level,
                "护理评分": float(r.care_score) if r.care_score else 0,
                "身体状况": r.physical_condition or "",
                "认知状态": r.cognitive_status or "",
                "行动能力": r.mobility_level or "",
                "自理能力": r.self_care_ability or "",
                "营养状况": r.nutritional_status or "",
                "评估人": r.assessor or "",
            } for r in records])

            elder_code = None
            if elder_id:
                elder = db.query(ElderProfile).filter(ElderProfile.id == elder_id).first()
                if elder:
                    elder_code = elder.elder_code

            excel_bytes = export_assessment_report(df, elder_code=elder_code)
            return dcc.send_bytes(excel_bytes, get_download_filename("assessment_report"))
        except Exception as e:
            logger.error(f"导出评估报告失败: {e}")
            raise PreventUpdate
        finally:
            db.close()

    @app.callback(
        Output("download-conflict", "data"),
        Input("btn-export-conflict", "n_clicks"),
        prevent_initial_call=True,
    )
    def export_conflict(n_clicks):
        if not n_clicks:
            raise PreventUpdate
        try:
            excel_bytes = export_conflict_report(days_back=90)
            return dcc.send_bytes(excel_bytes, get_download_filename("caliber_conflicts"))
        except Exception as e:
            logger.error(f"导出冲突报告失败: {e}")
            raise PreventUpdate

    @app.callback(
        Output("download-rules", "data"),
        Input("btn-export-rules", "n_clicks"),
        prevent_initial_call=True,
    )
    def export_rules(n_clicks):
        if not n_clicks:
            raise PreventUpdate
        try:
            rules_text = get_care_standards_text()
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                rules_df = pd.DataFrame({"护理达标计算规则": rules_text.split("\n")})
                rules_df.to_excel(writer, sheet_name="规则说明", index=False)
            output.seek(0)
            return dcc.send_bytes(output.getvalue(), get_download_filename("care_standards"))
        except Exception as e:
            logger.error(f"导出规则失败: {e}")
            raise PreventUpdate
