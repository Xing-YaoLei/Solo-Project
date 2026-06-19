import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/auto_repair"
)

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

DEBUG = os.getenv("DEBUG", "True").lower() == "true"
PORT = int(os.getenv("PORT", 8050))
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", 30))

RISK_THRESHOLDS = {
    "high_risk_repair_rate": 0.15,
    "medium_risk_repair_rate": 0.08,
    "parts_shortage_warning": 3,
    "appointment_delay_warning_hours": 2,
}

EXPORT_CONFIG = {
    "retain_filter_context": True,
    "default_export_format": "xlsx",
    "include_caliber_note": True,
}
