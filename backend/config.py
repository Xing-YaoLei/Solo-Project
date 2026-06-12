from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://postgres:password@localhost:5432/groupbuy"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "社区团购预售团单跟进台"


settings = Settings()
