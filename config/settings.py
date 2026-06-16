import os
from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/dental_clinic")
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")

    DASH_DEBUG: bool = Field(default=True)
    DASH_PORT: int = Field(default=8050)
    DASH_HOST: str = Field(default="0.0.0.0")

    HIS_DATA_SOURCE: str = Field(default="his_prod")
    APPOINTMENT_DELAY_THRESHOLD_HOURS: int = Field(default=24)
    MISSING_PAYMENT_WINDOW_DAYS: int = Field(default=7)
    HIS_CALIBER_CHANGE_THRESHOLD: float = Field(default=0.15)

    REFRESH_INTERVAL_MINUTES: int = Field(default=30)
    DATA_RETENTION_DAYS: int = Field(default=365)

    class Config:
        env_file = BASE_DIR / ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
