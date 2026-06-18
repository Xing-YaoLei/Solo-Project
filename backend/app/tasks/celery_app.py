from celery import Celery

from app.config import settings

celery_app = Celery(
    "work_order_system",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Shanghai",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app.tasks"])
