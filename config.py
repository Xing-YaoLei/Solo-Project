import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/prescription_review")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"

    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    BATCH_SIZE = 1000
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")

    ROLE_MANAGEMENT = "management"
    ROLE_EXECUTOR = "executor"
    ROLE_PHARMACIST = "pharmacist"
