from celery import Celery
from kombu import Queue
from config.settings import Config

celery_app = Celery(
    "clinic_monitoring",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_queues=(
        Queue("sync_queue", routing_key="celery.sync.#"),
        Queue("monitor_queue", routing_key="celery.monitor.#"),
        Queue("analytics_queue", routing_key="celery.analytics.#"),
    ),
    task_routes={
        "celery_tasks.tasks.sync_his_data": {"queue": "sync_queue", "routing_key": "celery.sync.his"},
        "celery_tasks.tasks.check_his_delay": {"queue": "monitor_queue", "routing_key": "celery.monitor.his_delay"},
        "celery_tasks.tasks.check_imaging_missing": {"queue": "monitor_queue", "routing_key": "celery.monitor.imaging"},
        "celery_tasks.tasks.check_billing_caliber_change": {"queue": "monitor_queue", "routing_key": "celery.monitor.billing"},
        "celery_tasks.tasks.check_no_show_impact": {"queue": "analytics_queue", "routing_key": "celery.analytics.no_show"},
        "celery_tasks.tasks.run_full_monitoring_cycle": {"queue": "analytics_queue", "routing_key": "celery.analytics.full_cycle"},
    },
    task_default_queue="sync_queue",
    task_default_routing_key="celery.sync.default"
)

celery_app.autodiscover_tasks(["celery_tasks"])
