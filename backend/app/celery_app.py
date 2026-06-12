from celery import Celery
from app.config import settings

celery_app = Celery(
    "coffee_loss",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "detect-abnormal-loss": {
            "task": "app.tasks.detect_abnormal_loss",
            "schedule": 3600.0,
        },
        "generate-daily-report": {
            "task": "app.tasks.generate_daily_report",
            "schedule": 86400.0,
        },
    },
)

celery_app.autodiscover_tasks(["app"])
