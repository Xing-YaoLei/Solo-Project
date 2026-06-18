from typing import List, Optional
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "二手车过户材料风险监测系统"
    APP_ENV: str = Field(default="dev")
    ENV: str = Field(default="dev")
    APP_DEBUG: bool = Field(default=True)
    API_PREFIX: str = Field(default="/api/v1")

    MOCK_MODE: bool = Field(default=True)

    DATABASE_URL: str = Field(default="sqlite:///./dev.db")
    TEST_DATABASE_URL: Optional[str] = None

    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_PASSWORD: Optional[str] = None

    SECRET_KEY: str = Field(default="dev-secret-change-me")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    MAPBOX_TOKEN: Optional[str] = None

    CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])

    SCHEDULER_TIMEZONE: str = Field(default="Asia/Shanghai")
    SYNC_CRON: str = Field(default="0 */4 * * *")
    ALERT_SCAN_CRON: str = Field(default="*/10 * * * *")

    DINGTALK_WEBHOOK: Optional[str] = None
    WECOM_WEBHOOK: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
