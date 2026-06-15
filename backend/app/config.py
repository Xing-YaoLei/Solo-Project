from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://mp0148:mp0148_password@localhost:5433/mp0148_edu"
    DATABASE_SYNC_URL: str = "postgresql+psycopg2://mp0148:mp0148_password@localhost:5433/mp0148_edu"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "mp0148-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    APP_NAME: str = "高校教务成绩复核跟进台"
    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
