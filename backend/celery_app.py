from celery import Celery

from app.config import settings

celery_app = Celery(
    "complaint_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "check-complaint-timeouts": {
        "task": "app.tasks.timeout_monitor.check_complaint_timeouts",
        "schedule": 3600,
    },
    "check-missing-materials": {
        "task": "app.tasks.timeout_monitor.check_missing_materials",
        "schedule": 7200,
    },
}

celery_app.autodiscover_tasks(["app.tasks"])
