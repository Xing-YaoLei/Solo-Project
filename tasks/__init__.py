from tasks.sync_student_application import sync_student_application
from tasks.sync_teaching_platform import sync_teaching_platform
from tasks.sync_smart_card import sync_smart_card
from tasks.anomaly_detection import run_anomaly_detection

__all__ = [
    "sync_student_application",
    "sync_teaching_platform",
    "sync_smart_card",
    "run_anomaly_detection",
]
