from app.tasks.celery_app import celery_app
from app.tasks import inventory_tasks

__all__ = ["celery_app", "inventory_tasks"]
