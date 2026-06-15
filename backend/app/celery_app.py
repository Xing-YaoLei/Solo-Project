from celery import Celery
from .config import settings

celery_app = Celery(
    "community_followup",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
)

celery_app.autodiscover_tasks(["app.tasks"])
