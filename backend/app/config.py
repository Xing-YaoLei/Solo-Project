from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dental_clinic"
    DUCKDB_PATH: str = "./data/analytics.duckdb"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
