from celery import Celery
from config.settings import Config

celery_app = Celery(
    "clinic_monitoring",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
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
    task_acks_late=True
)

celery_app.autodiscover_tasks(["celery_tasks"])
