from celery import Celery
from app.config import Config

celery_app = Celery(
    "compliance_audit",
    broker=Config.REDIS_URL,
    backend=Config.REDIS_URL,
    include=["app.tasks.import_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)
