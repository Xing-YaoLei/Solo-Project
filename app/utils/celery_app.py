import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_DB = os.getenv("REDIS_DB", "0")

BROKER_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
BACKEND_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

celery_app = Celery(
    "elder_care_dashboard",
    broker=BROKER_URL,
    backend=BACKEND_URL,
    include=[
        "app.tasks.sync_tasks",
        "app.tasks.detection_tasks",
        "app.tasks.refresh_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=False,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3000,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    beat_schedule={
        "sync-access-records-every-5-minutes": {
            "task": "app.tasks.sync_tasks.sync_access_records",
            "schedule": 300.0,
        },
        "sync-care-terminal-every-10-minutes": {
            "task": "app.tasks.sync_tasks.sync_care_terminal_records",
            "schedule": 600.0,
        },
        "sync-billing-hourly": {
            "task": "app.tasks.sync_tasks.sync_billing_records",
            "schedule": 3600.0,
        },
        "detect-anomalies-every-15-minutes": {
            "task": "app.tasks.detection_tasks.detect_all_anomalies",
            "schedule": 900.0,
        },
        "refresh-dashboard-cache-every-30-minutes": {
            "task": "app.tasks.refresh_tasks.refresh_dashboard_cache",
            "schedule": 1800.0,
        },
    },
)
