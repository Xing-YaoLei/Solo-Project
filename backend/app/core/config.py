from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "长租公寓退租验房系统"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "postgresql://admin:admin123@localhost:5432/apartment_inspection"
    DUCKDB_PATH: str = "./data/analytics.duckdb"

    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    ENV: str = "development"
    DEBUG: bool = False


settings = Settings()
