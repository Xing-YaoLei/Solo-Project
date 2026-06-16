import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/clinic_db")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    HIS_API_URL = os.getenv("HIS_API_URL", "http://his-system/api")
    IMAGING_API_URL = os.getenv("IMAGING_API_URL", "http://imaging-system/api")
    BILLING_API_URL = os.getenv("BILLING_API_URL", "http://billing-system/api")

    HIS_SYNC_INTERVAL = int(os.getenv("HIS_SYNC_INTERVAL", "300"))
    IMAGING_CHECK_INTERVAL = int(os.getenv("IMAGING_CHECK_INTERVAL", "600"))

    HIS_DELAY_THRESHOLD_MINUTES = 60
    NO_SHOW_IMPACT_THRESHOLD = 0.05
    CLEANING_PROCEDURE_CODES = ["111", "112", "113", "121"]
    FOLLOW_UP_DAYS = 180
    CACHE_TIMEOUT = 300

    DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
    DEMO_DATA_DAYS = int(os.getenv("DEMO_DATA_DAYS", "60"))
