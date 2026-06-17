import logging
from datetime import datetime, timedelta
from app.utils.celery_app import celery_app
from app.utils.database import SessionLocal
from app.models.schema import (
    AccessRecord, CareTerminalRecord, BillingRecord,
    FallIncident, CaliberConflict, ElderProfile
)
from app.services.data_processor import (
    calculate_fall_impact_range, detect_caliber_conflicts
)

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.detection_tasks.detect_access_delays")
def detect_access_delays(threshold_seconds=3600):
    db = SessionLocal()
    try:
        cutoff = datetime.now() - timedelta(hours=48)
        delayed = db.query(AccessRecord).filter(
            AccessRecord.access_time >= cutoff,
            AccessRecord.is_delayed == True
        ).count()
        logger.info(f"检测到门禁延迟记录: {delayed}条")
        return {"delayed_count": delayed, "threshold_seconds": threshold_seconds}
    finally:
        db.close()


@celery_app.task(name="app.tasks.detection_tasks.detect_care_terminal_missing")
def detect_care_terminal_missing(days_back=7):
    db = SessionLocal()
    try:
        cutoff = datetime.now().date() - timedelta(days=days_back)
        missing = db.query(CareTerminalRecord).filter(
            CareTerminalRecord.record_date >= cutoff,
            CareTerminalRecord.is_missing == True
        ).count()
        logger.info(f"检测到护理终端缺失记录: {missing}条")
        return {"missing_count": missing, "days_back": days_back}
    finally:
        db.close()


@celery_app.task(name="app.tasks.detection_tasks.detect_billing_caliber_changes")
def detect_billing_caliber_changes(days_back=30):
    db = SessionLocal()
    try:
        cutoff = datetime.now().date() - timedelta(days=days_back)
        changed = db.query(BillingRecord).filter(
            BillingRecord.billing_date >= cutoff,
            BillingRecord.caliber_changed == True
        ).count()
        logger.info(f"检测到收费口径变更记录: {changed}条")
        return {"changed_count": changed, "days_back": days_back}
    finally:
        db.close()


@celery_app.task(name="app.tasks.detection_tasks.detect_fall_impact")
def detect_fall_impact(days_back=90):
    db = SessionLocal()
    try:
        cutoff = datetime.now() - timedelta(days=days_back)
        falls = db.query(FallIncident).filter(
            FallIncident.fall_time >= cutoff
        ).all()

        updated = 0
        for fall in falls:
            if not fall.impact_scope_start or not fall.impact_scope_end:
                impact_start, impact_end = calculate_fall_impact_range(
                    fall.fall_time, fall.injury_level
                )
                fall.impact_scope_start = impact_start
                fall.impact_scope_end = impact_end
                updated += 1

        db.commit()
        logger.info(f"更新跌倒影响时间范围: {updated}条")
        return {"updated_count": updated, "total_falls": len(falls)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.detection_tasks.detect_all_anomalies")
def detect_all_anomalies():
    result_delay = detect_access_delays.delay()
    result_missing = detect_care_terminal_missing.delay()
    result_caliber = detect_billing_caliber_changes.delay()
    result_fall = detect_fall_impact.delay()
    result_conflicts = celery_app.send_task(
        "app.tasks.detection_tasks.run_caliber_conflict_detection"
    )
    return {
        "delay_task": result_delay.id,
        "missing_task": result_missing.id,
        "caliber_task": result_caliber.id,
        "fall_task": result_fall.id,
        "conflict_task": result_conflicts.id,
    }


@celery_app.task(name="app.tasks.detection_tasks.run_caliber_conflict_detection")
def run_caliber_conflict_detection(days_back=30):
    conflicts = detect_caliber_conflicts(days_back)
    logger.info(f"检测到口径冲突: {len(conflicts)}条")
    return {"conflict_count": len(conflicts), "conflicts": conflicts}
