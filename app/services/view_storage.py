import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

VIEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "saved_views.json")
VIEWS_FILE = os.path.abspath(VIEWS_FILE)

os.makedirs(os.path.dirname(VIEWS_FILE), exist_ok=True)


def _load_raw() -> List[Dict]:
    try:
        if not os.path.exists(VIEWS_FILE):
            return []
        with open(VIEWS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"读取已保存视图失败: {e}，将重建空列表")
        return []


def _save_raw(data: List[Dict]) -> bool:
    try:
        with open(VIEWS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        logger.error(f"保存视图失败: {e}")
        return False


def save_view(
    elder_id: int,
    elder_code: str,
    elder_name: str,
    snapshot: Dict,
    view_name: Optional[str] = None,
) -> Optional[Dict]:
    """保存老人常用视图快照（包含档案、评估、用药、备注）"""
    if not elder_id or not snapshot:
        return None

    views = _load_raw()

    existing = None
    for v in views:
        if v.get("elder_id") == elder_id:
            existing = v
            break

    now = datetime.now().isoformat(timespec="seconds")
    record = {
        "view_id": existing["view_id"] if existing else f"view_{int(datetime.now().timestamp())}",
        "elder_id": elder_id,
        "elder_code": elder_code,
        "elder_name": elder_name,
        "view_name": view_name or existing.get("view_name") if existing else f"{elder_name}的常用视图",
        "created_at": existing["created_at"] if existing else now,
        "updated_at": now,
        "snapshot": snapshot,
    }

    if existing:
        idx = views.index(existing)
        views[idx] = record
    else:
        views.append(record)

    if _save_raw(views):
        return record
    return None


def list_views() -> List[Dict]:
    """列出所有已保存视图（按更新时间倒序）"""
    views = _load_raw()
    for v in views:
        v.pop("snapshot", None)
    return sorted(views, key=lambda x: x.get("updated_at", ""), reverse=True)


def get_view(view_id: str) -> Optional[Dict]:
    """获取单个视图的完整快照（用于恢复）"""
    views = _load_raw()
    for v in views:
        if v.get("view_id") == view_id:
            return v
    return None


def get_view_by_elder(elder_id: int) -> Optional[Dict]:
    """按老人ID获取视图快照"""
    views = _load_raw()
    for v in views:
        if v.get("elder_id") == elder_id:
            return v
    return None


def delete_view(view_id: str) -> bool:
    """删除已保存视图"""
    views = _load_raw()
    new_views = [v for v in views if v.get("view_id") != view_id]
    if len(new_views) == len(views):
        return False
    return _save_raw(new_views)


def build_snapshot(db, elder_id: int) -> Dict:
    """从数据库构建老人完整快照（档案+评估+用药+备注）"""
    from app.models.schema import (
        ElderProfile, AdmissionAssessment, Medication, ReviewNote
    )

    elder = db.query(ElderProfile).filter(ElderProfile.id == elder_id).first()
    if not elder:
        return {}

    assessments = db.query(AdmissionAssessment).filter(
        AdmissionAssessment.elder_id == elder_id
    ).order_by(AdmissionAssessment.assessment_date).all()

    medications = db.query(Medication).filter(
        Medication.elder_id == elder_id,
        Medication.is_active == True,
    ).all()

    notes = db.query(ReviewNote).filter(
        ReviewNote.elder_id == elder_id
    ).order_by(ReviewNote.note_date.desc()).all()

    return {
        "profile": {
            "name": elder.name,
            "elder_code": elder.elder_code,
            "gender": elder.gender,
            "birth_date": str(elder.birth_date) if elder.birth_date else None,
            "admission_date": str(elder.admission_date) if elder.admission_date else None,
            "room_number": elder.room_number,
            "phone": elder.phone,
            "emergency_contact": elder.emergency_contact,
            "emergency_phone": elder.emergency_phone,
            "current_status": elder.current_status,
        },
        "assessments": [
            {
                "date": str(a.assessment_date),
                "level": a.care_level,
                "score": float(a.care_score) if a.care_score else 0,
                "physical_condition": a.physical_condition,
                "cognitive_status": a.cognitive_status,
                "mobility_level": a.mobility_level,
                "self_care_ability": a.self_care_ability,
            }
            for a in assessments
        ],
        "medications": [
            {
                "medication_name": m.medication_name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "administration_route": m.administration_route,
                "start_date": str(m.start_date) if m.start_date else None,
                "end_date": str(m.end_date) if m.end_date else None,
                "prescribing_doctor": m.prescribing_doctor,
                "notes": m.notes,
            }
            for m in medications
        ],
        "review_notes": [
            {
                "date": str(n.note_date),
                "type": n.note_type,
                "content": n.content,
                "author": n.note_author,
            }
            for n in notes
        ],
        "snapshot_time": datetime.now().isoformat(timespec="seconds"),
    }
