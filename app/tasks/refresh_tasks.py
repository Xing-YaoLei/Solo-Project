import logging
import json
from datetime import datetime, timedelta
from app.utils.celery_app import celery_app
from app.utils.database import SessionLocal
from app.models.schema import (
    AdmissionAssessment, ElderProfile, DataSyncStatus,
    FallIncident, CaliberConflict
)
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_TTL = 1800


@celery_app.task(name="app.tasks.refresh_tasks.refresh_dashboard_cache")
def refresh_dashboard_cache():
    db = SessionLocal()
    try:
        result = {}

        assessments = db.query(AdmissionAssessment).all()
        if assessments:
            df = pd.DataFrame([{
                "id": a.id,
                "elder_id": a.elder_id,
                "assessment_date": str(a.assessment_date),
                "care_level": a.care_level,
                "care_score": float(a.care_score) if a.care_score else 0,
            } for a in assessments])
            result["assessment_trend"] = df.to_dict(orient="records")

        falls = db.query(FallIncident).all()
        result["fall_incidents"] = [{
            "id": f.id,
            "elder_id": f.elder_id,
            "fall_time": str(f.fall_time),
            "impact_start": str(f.impact_scope_start) if f.impact_scope_start else None,
            "impact_end": str(f.impact_scope_end) if f.impact_scope_end else None,
            "injury_level": f.injury_level,
        } for f in falls]

        sync_status = db.query(DataSyncStatus).all()
        result["sync_status"] = [{
            "system": s.system_name,
            "status": s.sync_status,
            "last_sync": str(s.last_sync_time) if s.last_sync_time else None,
            "delay_count": s.current_delay_seconds,
        } for s in sync_status]

        conflicts = db.query(CaliberConflict).filter(
            CaliberConflict.resolved == False
        ).all()
        result["unresolved_conflicts"] = len(conflicts)

        cache_path = "app/data/dashboard_cache.json"
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        logger.info("看板缓存刷新成功")
        return {"status": "success", "cached_at": str(datetime.now())}
    except Exception as e:
        logger.error(f"刷新缓存失败: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.refresh_tasks.refresh_elder_view_cache")
def refresh_elder_view_cache(elder_id=None):
    db = SessionLocal()
    try:
        cache_data = {}

        elders_query = db.query(ElderProfile)
        if elder_id:
            elders_query = elders_query.filter(ElderProfile.id == elder_id)
        elders = elders_query.all()

        for elder in elders:
            cache_data[elder.elder_code] = {
                "profile": {
                    "name": elder.name,
                    "gender": elder.gender,
                    "birth_date": str(elder.birth_date),
                    "admission_date": str(elder.admission_date),
                    "room_number": elder.room_number,
                },
                "assessments": [{
                    "date": str(a.assessment_date),
                    "level": a.care_level,
                    "score": float(a.care_score) if a.care_score else 0,
                } for a in elder.assessments],
                "medications": [{
                    "name": m.medication_name,
                    "dosage": m.dosage,
                    "frequency": m.frequency,
                } for m in elder.medications if m.is_active],
                "review_notes": [{
                    "date": str(n.note_date),
                    "type": n.note_type,
                    "content": n.content,
                } for n in elder.review_notes],
            }

        cache_path = "app/data/elder_view_cache.json"
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)

        logger.info("老人视图缓存刷新成功")
        return {"status": "success", "elder_count": len(elders)}
    finally:
        db.close()
