from celery import Celery

from app.config import REDIS_URL

celery_app = Celery(
    "verification_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.verification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-timeout-verifications": {
            "task": "app.tasks.verification_tasks.check_timeout_verifications",
            "schedule": 3600.0,
        },
        "generate-daily-summary": {
            "task": "app.tasks.verification_tasks.generate_daily_summary",
            "schedule": 86400.0,
        },
    },
)
