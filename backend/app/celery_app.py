from celery import Celery
from .core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "homestay_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.oversold", "app.tasks.export"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_default_queue="homestay_default",
    task_routes={
        "app.tasks.oversold.*": {"queue": "homestay_anomaly"},
        "app.tasks.export.*": {"queue": "homestay_export"},
    },
)


if __name__ == "__main__":
    celery_app.start()
