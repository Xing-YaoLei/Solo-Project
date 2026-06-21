import os
from celery import Celery
from config import config


def make_celery(app_name=__name__):
    config_name = os.environ.get('FLASK_ENV', 'default')
    cfg = config[config_name]

    celery = Celery(
        app_name,
        broker=cfg.CELERY_BROKER_URL,
        backend=cfg.CELERY_RESULT_BACKEND,
        timezone=cfg.CELERY_TIMEZONE,
        enable_utc=cfg.CELERY_ENABLE_UTC,
    )

    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        beat_schedule=cfg.CELERY_BEAT_SCHEDULE,
        task_track_started=True,
        task_time_limit=30 * 60,
        task_soft_time_limit=25 * 60,
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
    )

    return celery


celery_app = make_celery()
