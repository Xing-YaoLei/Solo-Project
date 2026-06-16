from celery import chain, group
from celery.schedules import crontab
from celery_tasks.app import celery_app

celery_app.conf.beat_schedule = {
    "sync-his-every-5-minutes": {
        "task": "celery_tasks.tasks.sync_his_data",
        "schedule": 300
    },
    "check-his-delay-every-10-minutes": {
        "task": "celery_tasks.tasks.check_his_delay",
        "schedule": 600
    },
    "check-imaging-missing-every-15-minutes": {
        "task": "celery_tasks.tasks.check_imaging_missing",
        "schedule": 900
    },
    "check-no-show-impact-every-hour": {
        "task": "celery_tasks.tasks.check_no_show_impact",
        "schedule": crontab(minute="0")
    },
    "check-billing-caliber-daily": {
        "task": "celery_tasks.tasks.check_billing_caliber_change",
        "schedule": crontab(hour="2", minute="0")
    }
}

from celery_tasks import tasks
