from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = Field(default="Solo Management System")
    APP_ENV: str = Field(default="development")
    DEBUG: bool = Field(default=False)

    API_V1_PREFIX: str = Field(default="/api")
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])

    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/solo_management")
    SYNC_DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/solo_management")

    DUCKDB_PATH: str = Field(default="./data/olap.duckdb")
    DUCKDB_MEMORY: bool = Field(default=False)

    JWT_SECRET_KEY: str = Field(default="your-super-secret-key-change-in-production")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_PASSWORD: str | None = Field(default=None)
    REDIS_DB: int = Field(default=0)

    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2")

    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_PER_HOUR: int = Field(default=1000)

    UPLOAD_DIR: str = Field(default="./uploads")
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024)

    EXPORT_DIR: str = Field(default="./exports")
    REPORT_CACHE_TTL: int = Field(default=3600)

    SHARE_LINK_EXPIRE_HOURS: int = Field(default=24)
    SHARE_LINK_SALT: str = Field(default="share-link-salt")

    FRONTEND_URL: str = Field(default="http://localhost:5173")
    PDF_WATERMARK_TEXT: str = Field(default="CONFIDENTIAL")

    MAIL_SMTP_HOST: str | None = Field(default=None)
    MAIL_SMTP_PORT: int = Field(default=587)
    MAIL_USERNAME: str | None = Field(default=None)
    MAIL_PASSWORD: str | None = Field(default=None)
    MAIL_FROM: str | None = Field(default=None)

    ENCRYPTION_KEY: str = Field(default="encryption-key-change-in-production")


settings = Settings()
