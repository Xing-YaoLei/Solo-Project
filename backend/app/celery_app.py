from celery import Celery
from app.config import settings

celery_app = Celery(
    "mp0148_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=False,
)

from app.tasks import notifications, reports  # noqa

celery_app.autodiscover_tasks(["app.tasks"], related_name="notifications")
celery_app.autodiscover_tasks(["app.tasks"], related_name="reports")
