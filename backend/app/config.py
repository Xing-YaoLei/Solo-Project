from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./home_measure.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    USE_SQLITE: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
