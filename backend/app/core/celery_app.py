from celery import Celery
from ..core.config import settings

celery_app = Celery(
    "auto_repair",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_routes={
        "app.celery_tasks.tasks.*": {"queue": "auto_repair"},
    },
)

celery_app.autodiscover_tasks(["app.celery_tasks"])
