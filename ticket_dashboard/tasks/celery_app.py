from celery import Celery
from ticket_dashboard.config import config

celery_app = Celery(
    "ticket_dashboard",
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "refresh-dashboard-data": {
            "task": "ticket_dashboard.tasks.dashboard.refresh_dashboard",
            "schedule": config.DATA_REFRESH_INTERVAL,
        },
        "quality-check": {
            "task": "ticket_dashboard.tasks.dashboard.run_quality_check",
            "schedule": config.DATA_REFRESH_INTERVAL * 2,
        },
        "conflict-detection": {
            "task": "ticket_dashboard.tasks.dashboard.run_conflict_detection",
            "schedule": config.DATA_REFRESH_INTERVAL,
        },
    },
)

celery_app.autodiscover_tasks(["ticket_dashboard.tasks"])
