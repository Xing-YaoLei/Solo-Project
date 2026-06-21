import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./errand_dashboard.db")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/1"))
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/2"))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    COMPENSATION_RULES = {
        "rider_reject_penalty": 5.0,
        "system_delay_compensation": 3.0,
        "payment_missing_refund": 2.0,
        "map_calibration_adjustment": 1.5,
        "base_compensation_per_order": 8.0,
        "distance_rate_per_km": 2.0,
        "peak_hour_multiplier": 1.3,
        "peak_hours": [11, 12, 13, 17, 18, 19],
    }

    ANOMALY_THRESHOLDS = {
        "system_delay_seconds": 300,
        "payment_missing_hours": 2,
        "reject_rate_spike": 0.15,
        "track_anomaly_distance_m": 100,
    }
