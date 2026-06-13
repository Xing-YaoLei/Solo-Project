from celery import Celery

from config import Config

celery_app = Celery(
    "beauty_salon_risk",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "refresh-data-cache": {
            "task": "tasks.scheduler.refresh_data_cache",
            "schedule": Config.REFRESH_INTERVAL_MINUTES * 60,
        },
        "run-conflict-detection": {
            "task": "tasks.scheduler.run_conflict_detection",
            "schedule": Config.REFRESH_INTERVAL_MINUTES * 60,
        },
        "run-anomaly-detection": {
            "task": "tasks.scheduler.run_anomaly_detection",
            "schedule": Config.REFRESH_INTERVAL_MINUTES * 60,
        },
    },
)

celery_app.autodiscover_tasks(["tasks"])
