from celery import Celery
from ..config import settings


celery_app = Celery(
    "scenic_guide_tasks",
    broker=settings.get_celery_broker,
    backend=settings.get_celery_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
)

celery_app.autodiscover_tasks(["app.tasks"], force=True)
