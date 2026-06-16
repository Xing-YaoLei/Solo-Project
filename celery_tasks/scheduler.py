from celery.schedules import crontab
from celery_tasks.celery_app import celery_app
from config import settings


def setup_schedule():
    celery_app.conf.beat_schedule = {
        "refresh-data-every-30-minutes": {
            "task": "refresh_data",
            "schedule": settings.REFRESH_INTERVAL_MINUTES * 60,
            "args": [None, None, "scheduled"],
            "options": {
                "expires": 30 * 60,
                "queue": "default",
            },
        },
        "detect-anomalies-every-hour": {
            "task": "detect_anomalies",
            "schedule": 60 * 60,
            "args": [None, None],
            "options": {
                "expires": 45 * 60,
                "queue": "default",
            },
        },
        "check-delayed-appointments-every-15-minutes": {
            "task": "check_delayed_appointments",
            "schedule": 15 * 60,
            "options": {
                "expires": 10 * 60,
                "queue": "default",
            },
        },
        "check-missing-payments-daily": {
            "task": "check_missing_payments",
            "schedule": crontab(hour=8, minute=0),
            "options": {
                "expires": 60 * 60,
                "queue": "default",
            },
        },
        "full-refresh-nightly": {
            "task": "full_refresh",
            "schedule": crontab(hour=2, minute=0),
            "args": [None, None],
            "options": {
                "expires": 3 * 60 * 60,
                "queue": "default",
            },
        },
    }

    celery_app.conf.timezone = "Asia/Shanghai"
