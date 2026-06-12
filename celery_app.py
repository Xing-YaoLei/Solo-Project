from celery import Celery
from config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND, SYNC_CRONTAB_MINUTE, SYNC_CRONTAB_HOUR, ALERT_CRONTAB_MINUTE, ALERT_CRONTAB_HOUR

app = Celery(
    "coffee_replenish",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

app.conf.update(
    serializer="json",
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "sync-daily-data": {
            "task": "tasks.data_sync.sync_all_data",
            "schedule": {
                "minute": SYNC_CRONTAB_MINUTE,
                "hour": SYNC_CRONTAB_HOUR,
            },
        },
        "check-alerts": {
            "task": "tasks.alert_check.check_all_alerts",
            "schedule": {
                "minute": ALERT_CRONTAB_MINUTE,
                "hour": ALERT_CRONTAB_HOUR,
            },
        },
    },
)

app.autodiscover_tasks(["tasks"])
