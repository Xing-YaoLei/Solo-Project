import json
from datetime import date, datetime
from celery import shared_task
from ticket_dashboard.data.quality import run_all_quality_checks
from ticket_dashboard.data.conflict import detect_capacity_conflicts, detect_timeslot_overlaps
from ticket_dashboard.db.session import SessionLocal
from ticket_dashboard.db.models import RefreshLog


def _log_refresh(refresh_type, triggered_by, status, quality_summary=None, rows_affected=0, error_msg=None):
    with SessionLocal() as session:
        log = RefreshLog(
            refresh_type=refresh_type,
            triggered_by=triggered_by,
            status=status,
            quality_flags_summary=quality_summary or {},
            rows_affected=rows_affected,
            finished_at=datetime.now(),
            error_message=error_msg,
        )
        session.add(log)
        session.commit()


@shared_task(bind=True, name="ticket_dashboard.tasks.dashboard.refresh_dashboard")
def refresh_dashboard(self, target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)

    try:
        quality_result = run_all_quality_checks(target_date, scenic_area_id)
        _log_refresh(
            refresh_type="dashboard_refresh",
            triggered_by="celery_beat",
            status="success",
            quality_summary=quality_result,
        )
        return quality_result
    except Exception as e:
        _log_refresh(
            refresh_type="dashboard_refresh",
            triggered_by="celery_beat",
            status="failed",
            error_msg=str(e),
        )
        raise


@shared_task(name="ticket_dashboard.tasks.dashboard.run_quality_check")
def run_quality_check(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)

    try:
        result = run_all_quality_checks(target_date, scenic_area_id)
        _log_refresh(
            refresh_type="quality_check",
            triggered_by="celery_beat",
            status="success",
            quality_summary=result,
        )
        return result
    except Exception as e:
        _log_refresh(
            refresh_type="quality_check",
            triggered_by="celery_beat",
            status="failed",
            error_msg=str(e),
        )
        raise


@shared_task(name="ticket_dashboard.tasks.dashboard.run_conflict_detection")
def run_conflict_detection(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)

    try:
        capacity_conflicts = detect_capacity_conflicts(scenic_area_id, target_date)
        overlap_conflicts = detect_timeslot_overlaps(scenic_area_id, target_date)

        result = {
            "target_date": str(target_date),
            "capacity_conflicts": capacity_conflicts,
            "overlap_conflicts": overlap_conflicts,
            "total_conflicts": len(capacity_conflicts) + len(overlap_conflicts),
        }

        _log_refresh(
            refresh_type="conflict_detection",
            triggered_by="celery_beat",
            status="success",
            quality_summary=result,
        )
        return result
    except Exception as e:
        _log_refresh(
            refresh_type="conflict_detection",
            triggered_by="celery_beat",
            status="failed",
            error_msg=str(e),
        )
        raise


@shared_task(name="ticket_dashboard.tasks.dashboard.manual_refresh")
def manual_refresh(target_date=None, scenic_area_id=None, operator="manual"):
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)

    try:
        quality_result = run_all_quality_checks(target_date, scenic_area_id)
        capacity_conflicts = detect_capacity_conflicts(scenic_area_id, target_date)
        overlap_conflicts = detect_timeslot_overlaps(scenic_area_id, target_date)

        result = {
            "target_date": str(target_date),
            "quality_flags": quality_result,
            "capacity_conflicts": capacity_conflicts,
            "overlap_conflicts": overlap_conflicts,
        }

        _log_refresh(
            refresh_type="manual_refresh",
            triggered_by=operator,
            status="success",
            quality_summary=result,
        )
        return result
    except Exception as e:
        _log_refresh(
            refresh_type="manual_refresh",
            triggered_by=operator,
            status="failed",
            error_msg=str(e),
        )
        raise
