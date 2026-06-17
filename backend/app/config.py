from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "长租公寓保洁排班跟进台"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cleaning_schedule"
    
    SECRET_KEY: str = "your-secret-key-change-in-production-0123456789abcdef"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    DEFAULT_CLEANING_DURATION_MINUTES: int = 120
    MAX_CLEANINGS_PER_DAY_PER_STAFF: int = 4
    MIN_GAP_BETWEEN_CLEANINGS_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
