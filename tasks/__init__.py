from tasks.celery_app import celery_app
from tasks.sync_parts import sync_parts_system
from tasks.sync_work_orders import sync_work_orders
from tasks.sync_insurance import sync_insurance_documents
from tasks.anomaly_detection import detect_anomalies

__all__ = [
    "celery_app",
    "sync_parts_system",
    "sync_work_orders",
    "sync_insurance_documents",
    "detect_anomalies",
]
