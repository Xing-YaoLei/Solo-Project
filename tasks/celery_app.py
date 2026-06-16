from celery import Celery
from config import Config

celery = Celery(
    'pharmacy_audit_tasks',
    broker=Config.REDIS_URL,
    backend=Config.REDIS_URL,
    include=['tasks.audit_tasks', 'tasks.data_sync']
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone=Config.TIMEZONE,
    enable_utc=True,
    task_routes={
        'tasks.audit_tasks.*': {'queue': 'audit'},
        'tasks.data_sync.*': {'queue': 'data_sync'},
    },
    beat_schedule={
        'sync-cashier-data-every-hour': {
            'task': 'tasks.data_sync.sync_cashier_data',
            'schedule': 3600.0,
        },
        'sync-insurance-data-every-2-hours': {
            'task': 'tasks.data_sync.sync_insurance_data',
            'schedule': 7200.0,
        },
        'check-unclear-prescriptions-every-15-minutes': {
            'task': 'tasks.audit_tasks.check_unclear_prescriptions',
            'schedule': 900.0,
        },
        'followup-reminder-daily': {
            'task': 'tasks.audit_tasks.send_followup_reminders',
            'schedule': 86400.0,
        },
    }
)

if __name__ == '__main__':
    celery.start()
