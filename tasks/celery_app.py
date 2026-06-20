from celery import Celery

from config import Config

celery_app = Celery(
    "scenic_ticket_tasks",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=False,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)

celery_app.autodiscover_tasks(["tasks"])
