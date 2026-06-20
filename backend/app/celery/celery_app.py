from celery import Celery
from ..config import get_settings

settings = get_settings()

celery_app = Celery(
    "errand_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.celery.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
)
