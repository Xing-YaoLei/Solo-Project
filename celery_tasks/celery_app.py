import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')
REDIS_DB = os.getenv('REDIS_DB', '0')

REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'

celery = Celery(
    'risk_monitor',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'celery_tasks.data_sync',
        'celery_tasks.risk_calculator',
        'celery_tasks.review_generator'
    ]
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    beat_schedule={
        'sync-order-data-every-5-minutes': {
            'task': 'celery_tasks.data_sync.sync_order_data',
            'schedule': crontab(minute='*/5'),
        },
        'sync-payment-data-every-10-minutes': {
            'task': 'celery_tasks.data_sync.sync_payment_data',
            'schedule': crontab(minute='*/10'),
        },
        'sync-trajectory-data-every-1-minute': {
            'task': 'celery_tasks.data_sync.sync_trajectory_data',
            'schedule': crontab(minute='*/1'),
        },
        'calculate-real-time-risk-every-2-minutes': {
            'task': 'celery_tasks.risk_calculator.calculate_realtime_risk',
            'schedule': crontab(minute='*/2'),
        },
        'generate-daily-review-material': {
            'task': 'celery_tasks.review_generator.generate_daily_review',
            'schedule': crontab(hour=2, minute=0),
        },
        'check-warning-thresholds-every-minute': {
            'task': 'celery_tasks.risk_calculator.check_warning_thresholds',
            'schedule': crontab(minute='*'),
        },
    }
)


if __name__ == '__main__':
    celery.start()
