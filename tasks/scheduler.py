import json
import logging
from datetime import datetime

from tasks.celery_config import celery_app

logger = logging.getLogger(__name__)

_cache_store: dict = {}


def _set_cache(key: str, data):
    _cache_store[key] = {"data": data, "updated_at": datetime.utcnow().isoformat()}


def get_cached(key: str):
    entry = _cache_store.get(key)
    if entry is None:
        return None
    return entry


@celery_app.task(bind=True, name="tasks.scheduler.refresh_data_cache")
def refresh_data_cache(self):
    from db.connection import db_session
    from db.models import DataRefreshLog
    from services.risk_analysis import (
        compute_anomaly_reminders,
        compute_attendance_summary,
        compute_conflict_trend,
        compute_reschedule_composition,
    )

    log = DataRefreshLog(task_name="full_refresh", status="running", started_at=datetime.utcnow())
    with db_session() as session:
        session.add(log)
        session.commit()
        log_id = log.id

    try:
        conflict_trend = compute_conflict_trend()
        _set_cache("conflict_trend", conflict_trend)

        reschedule_composition = compute_reschedule_composition()
        _set_cache("reschedule_composition", reschedule_composition)

        attendance_summary = compute_attendance_summary()
        _set_cache("attendance_summary", attendance_summary)

        anomaly_reminders = compute_anomaly_reminders()
        _set_cache("anomaly_reminders", anomaly_reminders)

        total_rows = sum(
            len(v.get("data", [])) if isinstance(v.get("data"), list) else 1
            for v in _cache_store.values()
        )

        with db_session() as session:
            log = session.query(DataRefreshLog).get(log_id)
            log.status = "completed"
            log.completed_at = datetime.utcnow()
            log.row_count = total_rows
            session.commit()

        logger.info("Data cache refreshed successfully, %d rows", total_rows)

    except Exception as exc:
        with db_session() as session:
            log = session.query(DataRefreshLog).get(log_id)
            log.status = "failed"
            log.completed_at = datetime.utcnow()
            log.error_message = str(exc)
            session.commit()
        logger.error("Data cache refresh failed: %s", exc)
        raise self.retry(exc=exc, countdown=60, max_retries=3)


@celery_app.task(name="tasks.scheduler.run_conflict_detection")
def run_conflict_detection():
    from services.risk_analysis import compute_conflict_trend
    result = compute_conflict_trend()
    _set_cache("conflict_trend", result)
    return result


@celery_app.task(name="tasks.scheduler.run_anomaly_detection")
def run_anomaly_detection():
    from services.risk_analysis import compute_anomaly_reminders
    result = compute_anomaly_reminders()
    _set_cache("anomaly_reminders", result)
    return result
