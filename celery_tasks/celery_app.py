import os
from celery import Celery
from celery.schedules import crontab

from config import settings

celery_app = Celery(
    "dental_clinic_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
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
    worker_max_tasks_per_child=100,
    result_expires=3600,
)

celery_app.autodiscover_tasks(["celery_tasks"])

from celery_tasks.scheduler import setup_schedule
setup_schedule()
