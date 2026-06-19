from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    COMPLAINT_TIMEOUT_HOURS: int = 48

    model_config = {"env_file": ".env"}


settings = Settings()
