import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/group_buy")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
    SYNC_BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "500"))
    DASH_HOST = os.getenv("DASH_HOST", "0.0.0.0")
    DASH_PORT = int(os.getenv("DASH_PORT", "8050"))
    DASH_DEBUG = os.getenv("DASH_DEBUG", "true").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


config = Config()
