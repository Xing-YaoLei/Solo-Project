import io
import logging
from datetime import datetime
from typing import Optional
import pandas as pd
from app.services.data_processor import (
    get_care_standards_text, generate_conflict_diff_table,
    calculate_care_compliance
)

logger = logging.getLogger(__name__)


def export_assessment_report(
    trend_df: pd.DataFrame,
    elder_code: Optional[str] = None,
    include_rules: bool = True
) -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        trend_df.to_excel(writer, sheet_name="入住评估趋势", index=False)

        if elder_code:
            compliance = calculate_care_compliance(elder_code)
            compliance_df = pd.DataFrame([{
                "指标": ["老人编号", "预期护理项", "实际完成", "达标率(%)"],
                "数值": [
                    compliance["elder_code"],
                    compliance["total_expected"],
                    compliance["total_actual"],
                    round(compliance["compliance_rate"], 2),
                ]
            }])
            compliance_df.to_excel(writer, sheet_name="护理达标情况", index=False)

        if include_rules:
            rules_text = get_care_standards_text()
            rules_df = pd.DataFrame({"规则说明": rules_text.split("\n")})
            rules_df.to_excel(writer, sheet_name="护理达标计算规则", index=False)

        conflicts_df = generate_conflict_diff_table(days_back=90, only_unresolved=False)
        if not conflicts_df.empty:
            conflicts_df.to_excel(writer, sheet_name="口径差异表", index=False)

    output.seek(0)
    return output.getvalue()


def export_conflict_report(days_back: int = 30) -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        unresolved = generate_conflict_diff_table(days_back=days_back, only_unresolved=True)
        if not unresolved.empty:
            unresolved.to_excel(writer, sheet_name="未解决差异", index=False)

        all_conflicts = generate_conflict_diff_table(days_back=days_back, only_unresolved=False)
        if not all_conflicts.empty:
            all_conflicts.to_excel(writer, sheet_name="全部差异记录", index=False)

        rules_df = pd.DataFrame({
            "说明": [
                "本表保留护理终端与收费系统口径冲突记录",
                "不做自动覆盖，需人工核实后处理",
                "",
                "冲突处理原则：",
                "1. 核实护理终端实际执行记录",
                "2. 确认收费系统计费依据",
                "3. 与相关部门确认口径",
                "4. 记录解决方案",
            ]
        })
        rules_df.to_excel(writer, sheet_name="处理说明", index=False)

    output.seek(0)
    return output.getvalue()


def export_elder_full_report(elder_data: dict) -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        profile_df = pd.DataFrame([elder_data.get("profile", {})])
        profile_df.to_excel(writer, sheet_name="老人档案", index=False)

        assessments = elder_data.get("assessments", [])
        if assessments:
            assess_df = pd.DataFrame(assessments)
            assess_df.to_excel(writer, sheet_name="护理等级评估", index=False)

        medications = elder_data.get("medications", [])
        if medications:
            med_df = pd.DataFrame(medications)
            med_df.to_excel(writer, sheet_name="用药清单", index=False)

        notes = elder_data.get("review_notes", [])
        if notes:
            notes_df = pd.DataFrame(notes)
            notes_df.to_excel(writer, sheet_name="复盘备注", index=False)

        rules_text = get_care_standards_text()
        rules_df = pd.DataFrame({"护理达标计算规则": rules_text.split("\n")})
        rules_df.to_excel(writer, sheet_name="护理达标计算规则", index=False)

    output.seek(0)
    return output.getvalue()


def get_download_filename(prefix: str = "report") -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.xlsx"
