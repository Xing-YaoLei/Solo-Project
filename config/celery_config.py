from celery import Celery
from celery.schedules import crontab
from config.settings import settings

celery_app = Celery(
    "rehab_center",
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

celery_app.conf.beat_schedule = {
    "run-daily-metrics-calculation": {
        "task": "tasks.scheduled_tasks.calculate_daily_metrics",
        "schedule": crontab(hour=2, minute=0),
    },
    "run-anomaly-detection": {
        "task": "tasks.scheduled_tasks.detect_anomalies",
        "schedule": crontab(hour=3, minute=0),
    },
    "run-equipment-utilization-update": {
        "task": "tasks.scheduled_tasks.update_equipment_utilization",
        "schedule": crontab(hour=4, minute=0),
    },
    "run-insurance-trend-analysis": {
        "task": "tasks.scheduled_tasks.analyze_insurance_trends",
        "schedule": crontab(hour=5, minute=0),
    },
}

celery_app.autodiscover_tasks(["tasks"])
