from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "cleaning_schedule",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "check-daily-attendance": {
            "task": "app.tasks.check_daily_attendance",
            "schedule": crontab(hour=18, minute=0)
        },
        "send-upcoming-reminders": {
            "task": "app.tasks.send_upcoming_reminders",
            "schedule": crontab(minute="*/30")
        },
        "weekly-performance-report": {
            "task": "app.tasks.generate_weekly_performance_report",
            "schedule": crontab(day_of_week=0, hour=9, minute=0)
        }
    }
)

celery_app.autodiscover_tasks(["app"])
