from celery import chain, group
from celery.schedules import crontab
from celery_tasks.app import celery_app

celery_app.conf.beat_schedule = {
    "sync-his-every-5-minutes": {
        "task": "celery_tasks.tasks.sync_his_data",
        "schedule": 300,
        "options": {"queue": "sync_queue"}
    },
    "check-his-delay-every-10-minutes": {
        "task": "celery_tasks.tasks.check_his_delay",
        "schedule": 600,
        "options": {"queue": "monitor_queue"}
    },
    "check-imaging-missing-every-15-minutes": {
        "task": "celery_tasks.tasks.check_imaging_missing",
        "schedule": 900,
        "options": {"queue": "monitor_queue"}
    },
    "check-no-show-impact-every-hour": {
        "task": "celery_tasks.tasks.check_no_show_impact",
        "schedule": crontab(minute="0"),
        "options": {"queue": "analytics_queue"}
    },
    "check-billing-caliber-daily": {
        "task": "celery_tasks.tasks.check_billing_caliber_change",
        "schedule": crontab(hour="2", minute="0"),
        "options": {"queue": "monitor_queue"}
    },
    "run-full-monitoring-cycle-every-30-minutes": {
        "task": "celery_tasks.tasks.run_full_monitoring_cycle",
        "schedule": 1800,
        "options": {"queue": "analytics_queue"}
    }
}

from celery_tasks import tasks
