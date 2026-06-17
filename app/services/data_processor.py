import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import pandas as pd
import numpy as np
from app.utils.database import SessionLocal
from app.models.schema import (
    CareTerminalRecord, BillingRecord, CaliberConflict,
    AdmissionAssessment, FallIncident
)

logger = logging.getLogger(__name__)

CARE_STANDARDS = {
    "自理": {"min_score": 90, "care_items": 5, "frequency_daily": True},
    "半自理": {"min_score": 60, "care_items": 8, "frequency_daily": True},
    "全护理": {"min_score": 30, "care_items": 12, "frequency_daily": True},
    "特护": {"min_score": 0, "care_items": 15, "frequency_daily": True},
}

CARE_LEVEL_ORDER = ["自理", "半自理", "全护理", "特护"]

COLOR_MAP = {
    "自理": "#28a745",
    "半自理": "#ffc107",
    "全护理": "#fd7e14",
    "特护": "#dc3545",
}


def calculate_fall_impact_range(fall_time: datetime, injury_level: str) -> Tuple[datetime, datetime]:
    impact_days_map = {
        "无损伤": 3,
        "轻伤": 7,
        "中度": 14,
        "重伤": 30,
    }
    days = impact_days_map.get(injury_level, 7)
    impact_start = fall_time - timedelta(days=1)
    impact_end = fall_time + timedelta(days=days)
    return impact_start, impact_end


def detect_caliber_conflicts(days_back: int = 30) -> List[Dict]:
    db = SessionLocal()
    conflicts = []
    try:
        cutoff = datetime.now().date() - timedelta(days=days_back)

        care_records = db.query(CareTerminalRecord).filter(
            CareTerminalRecord.record_date >= cutoff,
            CareTerminalRecord.is_missing == False
        ).all()

        billing_records = db.query(BillingRecord).filter(
            BillingRecord.billing_date >= cutoff
        ).all()

        care_df = pd.DataFrame([{
            "elder_code": r.elder_code,
            "date": r.record_date,
            "care_level": _infer_care_level(r.care_item),
            "source": "care_terminal"
        } for r in care_records])

        billing_df = pd.DataFrame([{
            "elder_code": r.elder_code,
            "date": r.billing_date,
            "care_level": r.care_level_billed,
            "caliber": r.billing_caliber_version,
            "source": "billing"
        } for r in billing_records])

        if care_df.empty or billing_df.empty:
            return conflicts

        care_agg = care_df.groupby(["elder_code", "date"]).agg({
            "care_level": lambda x: x.mode().iloc[0] if len(x) > 0 else None
        }).reset_index()

        billing_agg = billing_df.groupby(["elder_code", "date"]).agg({
            "care_level": "first",
            "caliber": "first"
        }).reset_index()

        merged = pd.merge(
            care_agg, billing_agg,
            on=["elder_code", "date"],
            how="inner",
            suffixes=("_care", "_billing")
        )

        for _, row in merged.iterrows():
            if (pd.notna(row["care_level_care"]) and
                pd.notna(row["care_level_billing"]) and
                row["care_level_care"] != row["care_level_billing"]):

                existing = db.query(CaliberConflict).filter(
                    CaliberConflict.elder_code == row["elder_code"],
                    CaliberConflict.conflict_date == row["date"],
                    CaliberConflict.conflict_type == "护理等级"
                ).first()

                conflict_data = {
                    "elder_code": row["elder_code"],
                    "conflict_date": str(row["date"]),
                    "conflict_type": "护理等级",
                    "care_terminal_value": row["care_level_care"],
                    "billing_system_value": row["care_level_billing"],
                    "care_terminal_caliber": "护理终端实际执行",
                    "billing_caliber": row["caliber"],
                    "difference_description": (
                        f"护理终端记录{row['care_level_care']}，"
                        f"收费系统按{row['care_level_billing']}计费"
                    ),
                }

                if not existing:
                    conflict = CaliberConflict(**conflict_data)
                    db.add(conflict)
                    conflicts.append(conflict_data)
                else:
                    if not existing.resolved:
                        conflicts.append(conflict_data)

        db.commit()
        return conflicts
    except Exception as e:
        logger.error(f"口径冲突检测失败: {e}")
        db.rollback()
        return conflicts
    finally:
        db.close()


def _infer_care_level(care_items: str) -> Optional[str]:
    if not care_items:
        return None
    item_count = len(care_items) if isinstance(care_items, (list, set)) else 1
    if item_count >= 12:
        return "特护"
    elif item_count >= 8:
        return "全护理"
    elif item_count >= 5:
        return "半自理"
    else:
        return "自理"


def clean_assessment_data(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.copy()
    df["assessment_date"] = pd.to_datetime(df["assessment_date"])
    df = df.sort_values(["elder_id", "assessment_date"])
    df["care_score"] = pd.to_numeric(df["care_score"], errors="coerce")
    df["care_score"] = df["care_score"].fillna(df["care_score"].median())
    df["care_level"] = pd.Categorical(
        df["care_level"], categories=CARE_LEVEL_ORDER, ordered=True
    )
    return df


def calculate_care_compliance(elder_code: str, start_date=None, end_date=None) -> Dict:
    db = SessionLocal()
    try:
        result = {
            "elder_code": elder_code,
            "total_expected": 0,
            "total_actual": 0,
            "compliance_rate": 0.0,
            "missing_items": [],
            "calculation_rules": get_care_standards_text(),
        }

        query = db.query(CareTerminalRecord).filter(
            CareTerminalRecord.elder_code == elder_code
        )
        if start_date:
            query = query.filter(CareTerminalRecord.record_date >= start_date)
        if end_date:
            query = query.filter(CareTerminalRecord.record_date <= end_date)

        records = query.all()

        if not records:
            return result

        df = pd.DataFrame([{
            "date": r.record_date,
            "care_item": r.care_item,
            "is_missing": r.is_missing,
        } for r in records])

        total_records = len(df)
        missing_records = df["is_missing"].sum() if "is_missing" in df.columns else 0

        result["total_expected"] = total_records
        result["total_actual"] = total_records - missing_records
        result["compliance_rate"] = (
            (total_records - missing_records) / total_records * 100
            if total_records > 0 else 0.0
        )
        result["missing_items"] = df[df["is_missing"]]["care_item"].tolist()

        return result
    finally:
        db.close()


def get_care_standards_text() -> str:
    lines = ["护理达标计算规则：", ""]
    for level, standard in CARE_STANDARDS.items():
        lines.append(f"{level}级：")
        lines.append(f"  - 护理评分 >= {standard['min_score']}分")
        lines.append(f"  - 每日护理项目数: {standard['care_items']}项")
        lines.append(f"  - 执行频率: {'每日' if standard['frequency_daily'] else '按需'}")
        lines.append("")
    lines.append("")
    lines.append("达标率计算公式:")
    lines.append("  达标率 = (实际完成护理项数 / 预期护理项总数) × 100%")
    lines.append("")
    lines.append("异常标记规则:")
    lines.append("  - 门禁延迟: 门禁记录同步时间 > 3600秒(1小时)")
    lines.append("  - 护理终端缺失: 当日应有护理项未记录")
    lines.append("  - 收费口径变化: 收费系统版本号变更")
    return "\n".join(lines)


def get_fall_impact_periods(elder_id: int = None, days_back: int = 90) -> pd.DataFrame:
    db = SessionLocal()
    try:
        cutoff = datetime.now() - timedelta(days=days_back)
        query = db.query(FallIncident).filter(FallIncident.fall_time >= cutoff)
        if elder_id:
            query = query.filter(FallIncident.elder_id == elder_id)
        falls = query.all()

        df = pd.DataFrame([{
            "elder_id": f.elder_id,
            "fall_time": f.fall_time,
            "fall_id": f.id,
            "impact_start": f.impact_scope_start,
            "impact_end": f.impact_scope_end,
            "injury_level": f.injury_level,
        } for f in falls])

        return df
    finally:
        db.close()


def generate_conflict_diff_table(days_back: int = 30, only_unresolved: bool = True) -> pd.DataFrame:
    db = SessionLocal()
    try:
        cutoff = datetime.now().date() - timedelta(days=days_back)
        query = db.query(CaliberConflict).filter(
            CaliberConflict.conflict_date >= cutoff
        )
        if only_unresolved:
            query = query.filter(CaliberConflict.resolved == False)
        conflicts = query.all()

        df = pd.DataFrame([{
            "老人编号": c.elder_code,
            "冲突日期": c.conflict_date,
            "冲突类型": c.conflict_type,
            "护理终端值": c.care_terminal_value,
            "收费系统值": c.billing_system_value,
            "护理终端口径": c.care_terminal_caliber,
            "收费口径": c.billing_caliber,
            "差异说明": c.difference_description,
            "是否已解决": "是" if c.resolved else "否",
            "解决备注": c.resolution_note or "",
        } for c in conflicts])
        return df
    finally:
        db.close()


def aggregate_assessment_trend(start_date=None, end_date=None, care_level=None) -> pd.DataFrame:
    db = SessionLocal()
    try:
        query = db.query(AdmissionAssessment)
        if start_date:
            query = query.filter(AdmissionAssessment.assessment_date >= start_date)
        if end_date:
            query = query.filter(AdmissionAssessment.assessment_date <= end_date)
        if care_level:
            query = query.filter(AdmissionAssessment.care_level == care_level)
        records = query.all()

        df = pd.DataFrame([{
            "id": r.id,
            "elder_id": r.elder_id,
            "assessment_date": r.assessment_date,
            "care_level": r.care_level,
            "care_score": float(r.care_score) if r.care_score else 0,
            "physical_condition": r.physical_condition,
        } for r in records])

        if not df.empty:
            return df

        df = clean_assessment_data(df)

        daily_stats = df.groupby(df["assessment_date"].dt.date).agg({
            "elder_id": "nunique",
            "care_score": "mean",
        }).reset_index()
        daily_stats.columns = ["日期", "评估人数", "平均护理评分"]

        level_counts = df.groupby([
            df["assessment_date"].dt.date,
            "care_level"
        ]).size().unstack(fill_value=0).reset_index()

        return daily_stats, level_counts
    finally:
        db.close()
