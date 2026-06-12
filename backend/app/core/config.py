from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Coffee Equipment Cleaning System"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/coffee_cleaning"

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    DEVICE_OFFLINE_THRESHOLD_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
