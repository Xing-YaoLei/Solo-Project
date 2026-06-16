import time
from app.celery_app import celery_app


@celery_app.task(name="export_report_task")
def export_report_task(export_type: str, filters: dict = None):
    time.sleep(2)
    return {"status": "completed", "export_type": export_type, "filters": filters}


@celery_app.task(name="send_notification_task")
def send_notification_task(user_id: int, title: str, content: str):
    time.sleep(1)
    return {"status": "sent", "user_id": user_id, "title": title}


@celery_app.task(name="generate_daily_report_task")
def generate_daily_report_task(report_date: str):
    time.sleep(5)
    return {"status": "completed", "report_date": report_date}
