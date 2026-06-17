from celery import Celery
from app.config import config


def make_celery():
    celery = Celery(
        'long_rent_report',
        broker=config.CELERY_BROKER_URL,
        backend=config.CELERY_RESULT_BACKEND,
    )

    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='Asia/Shanghai',
        enable_utc=True,
        task_track_started=True,
        task_time_limit=3600,
        task_soft_time_limit=3000,
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


celery = make_celery()
