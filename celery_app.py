from celery import Celery
from config import Config

celery = Celery(
    "edu_funnel_tasks",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
    include=[
        "tasks.sync_student_application",
        "tasks.sync_teaching_platform",
        "tasks.sync_smart_card",
        "tasks.anomaly_detection",
    ]
)

celery.conf.update(
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
)

celery.conf.beat_schedule = {
    "sync-student-application-every-30-min": {
        "task": "tasks.sync_student_application.sync_student_application",
        "schedule": 30 * 60,
    },
    "sync-teaching-platform-every-60-min": {
        "task": "tasks.sync_teaching_platform.sync_teaching_platform",
        "schedule": 60 * 60,
    },
    "sync-smart-card-every-120-min": {
        "task": "tasks.sync_smart_card.sync_smart_card",
        "schedule": 120 * 60,
    },
    "anomaly-detection-every-15-min": {
        "task": "tasks.anomaly_detection.run_anomaly_detection",
        "schedule": 15 * 60,
    },
}


if __name__ == "__main__":
    celery.start()
