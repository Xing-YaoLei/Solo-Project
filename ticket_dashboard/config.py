import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ticket_dashboard")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
    SECRET_KEY = os.getenv("DASH_SECRET_KEY", "dev-key")
    DATA_REFRESH_INTERVAL = int(os.getenv("DATA_REFRESH_INTERVAL_SECONDS", "300"))
    CAMERA_DELAY_THRESHOLD = int(os.getenv("CAMERA_DELAY_THRESHOLD_SECONDS", "120"))
    MERCHANT_GAP_THRESHOLD = int(os.getenv("MERCHANT_GAP_THRESHOLD_MINUTES", "30"))
    GATE_CALIBER_CHANGE_SENSITIVITY = float(os.getenv("GATE_CALIBER_CHANGE_SENSITIVITY", "0.15"))


config = Config()
