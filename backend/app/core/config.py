from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "青少年培训教材发放漏斗报表系统"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/youth_training"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    MAPBOX_ACCESS_TOKEN: Optional[str] = ""

    class Config:
        env_file = ".env"


settings = Settings()
