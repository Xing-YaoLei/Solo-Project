import logging
from datetime import datetime

from config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND
from data.loader import load_projects
from data.reconciler import run_reconciliation


_CELERY_AVAILABLE = None


def _check_celery_available():
    global _CELERY_AVAILABLE
    if _CELERY_AVAILABLE is not None:
        return _CELERY_AVAILABLE
    try:
        from celery import Celery

        celery_test = Celery("test_conn", broker=CELERY_BROKER_URL)
        conn = celery_test.connection()
        conn.ensure_connection(max_retries=1, timeout=3)
        conn.release()
        _CELERY_AVAILABLE = True
        logging.info("Celery broker connection: OK")
    except Exception as e:
        _CELERY_AVAILABLE = False
        logging.warning(f"Celery broker unavailable, fallback to sync mode: {e}")
    return _CELERY_AVAILABLE


def _build_celery_app():
    from celery import Celery

    app = Celery(
        "renovation_risk",
        broker=CELERY_BROKER_URL,
        backend=CELERY_RESULT_BACKEND,
    )
    app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="Asia/Shanghai",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=300,
        beat_schedule={
            "daily-reconciliation": {
                "task": "tasks.celery_tasks.reconcile_all_projects",
                "schedule": 86400,
            },
            "hourly-gaps-alert": {
                "task": "tasks.celery_tasks.check_gap_alerts",
                "schedule": 3600,
            },
        },
    )
    return app


if _check_celery_available():
    celery_app = _build_celery_app()

    @celery_app.task(bind=True, name="tasks.celery_tasks.reconcile_project")
    def reconcile_project(self, project_id):
        try:
            start_ts = datetime.now()
            result = run_reconciliation(project_id)
            duration = (datetime.now() - start_ts).total_seconds()
            return {
                "status": "success",
                "project_id": project_id,
                "items": len(result),
                "duration_seconds": round(duration, 2),
            }
        except Exception as exc:
            logging.exception(f"reconcile_project failed for {project_id}")
            return {"status": "error", "project_id": project_id, "error": str(exc)}

    @celery_app.task(bind=True, name="tasks.celery_tasks.reconcile_all_projects")
    def reconcile_all_projects(self):
        try:
            start_ts = datetime.now()
            projects_df = load_projects()
            project_ids = projects_df["id"].tolist() if not projects_df.empty else []
            results = []
            for pid in project_ids:
                res = run_reconciliation(pid)
                results.append({"project_id": pid, "items": len(res)})
            duration = (datetime.now() - start_ts).total_seconds()
            return {
                "status": "success",
                "projects": results,
                "total_projects": len(project_ids),
                "duration_seconds": round(duration, 2),
            }
        except Exception as exc:
            logging.exception("reconcile_all_projects failed")
            return {"status": "error", "error": str(exc)}

    @celery_app.task(bind=True, name="tasks.celery_tasks.check_gap_alerts")
    def check_gap_alerts(self):
        try:
            from data.reconciler import compute_amount_summary

            projects_df = load_projects()
            alerts = []
            for _, proj in projects_df.iterrows():
                s = compute_amount_summary(proj["id"])
                if s["gap_rate"] > 0.2 or s["total_gap"] < -5000 or s["total_gap"] > 5000:
                    alerts.append(
                        {
                            "project_id": proj["id"],
                            "project_name": proj["name"],
                            "total_gap": s["total_gap"],
                            "gap_rate": s["gap_rate"],
                            "severity": "high" if s["gap_rate"] > 0.5 else "medium",
                        }
                    )
            return {"status": "success", "alerts": alerts, "count": len(alerts)}
        except Exception as exc:
            logging.exception("check_gap_alerts failed")
            return {"status": "error", "error": str(exc)}

else:
    class _SyncTaskResult:
        def __init__(self, result):
            self._result = result
            self.task_id = "sync-task"
            self.status = "SUCCESS"

        def get(self, timeout=None, propagate=True):
            return self._result

        def wait(self, timeout=None):
            return self._result

        def ready(self):
            return True

        def successful(self):
            return True

    class _SyncTask:
        def __init__(self, func):
            self.func = func
            self.name = func.__name__

        def delay(self, *args, **kwargs):
            return _SyncTaskResult(self.func(*args, **kwargs))

        def apply_async(self, args=None, kwargs=None, **options):
            args = args or ()
            kwargs = kwargs or {}
            return _SyncTaskResult(self.func(*args, **kwargs))

        def apply(self, args=None, kwargs=None, **options):
            args = args or ()
            kwargs = kwargs or {}
            return _SyncTaskResult(self.func(*args, **kwargs))

    celery_app = None

    def _reconcile_project_sync(project_id):
        try:
            start_ts = datetime.now()
            result = run_reconciliation(project_id)
            duration = (datetime.now() - start_ts).total_seconds()
            return {
                "status": "success",
                "project_id": project_id,
                "items": len(result),
                "duration_seconds": round(duration, 2),
            }
        except Exception as exc:
            logging.exception(f"reconcile_project failed for {project_id}")
            return {"status": "error", "project_id": project_id, "error": str(exc)}

    def _reconcile_all_projects_sync():
        try:
            start_ts = datetime.now()
            projects_df = load_projects()
            project_ids = projects_df["id"].tolist() if not projects_df.empty else []
            results = []
            for pid in project_ids:
                res = run_reconciliation(pid)
                results.append({"project_id": pid, "items": len(res)})
            duration = (datetime.now() - start_ts).total_seconds()
            return {
                "status": "success",
                "projects": results,
                "total_projects": len(project_ids),
                "duration_seconds": round(duration, 2),
            }
        except Exception as exc:
            logging.exception("reconcile_all_projects failed")
            return {"status": "error", "error": str(exc)}

    def _check_gap_alerts_sync():
        try:
            from data.reconciler import compute_amount_summary

            projects_df = load_projects()
            alerts = []
            for _, proj in projects_df.iterrows():
                s = compute_amount_summary(proj["id"])
                if s["gap_rate"] > 0.2 or s["total_gap"] < -5000 or s["total_gap"] > 5000:
                    alerts.append(
                        {
                            "project_id": proj["id"],
                            "project_name": proj["name"],
                            "total_gap": s["total_gap"],
                            "gap_rate": s["gap_rate"],
                            "severity": "high" if s["gap_rate"] > 0.5 else "medium",
                        }
                    )
            return {"status": "success", "alerts": alerts, "count": len(alerts)}
        except Exception as exc:
            logging.exception("check_gap_alerts failed")
            return {"status": "error", "error": str(exc)}

    reconcile_project = _SyncTask(_reconcile_project_sync)
    reconcile_all_projects = _SyncTask(_reconcile_all_projects_sync)
    check_gap_alerts = _SyncTask(_check_gap_alerts_sync)


def is_celery_available():
    return _CELERY_AVAILABLE is True
