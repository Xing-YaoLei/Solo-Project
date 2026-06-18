from celery import Celery
from config.settings import settings

celery_app = Celery(
    "repair_dashboard",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["tasks.etl_tasks", "tasks.review_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)
