from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pharmacy_review"
    DATABASE_ECHO: bool = False

    JWT_SECRET_KEY: str = "CHANGE-ME-TO-A-SECURE-RANDOM-STRING"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    EXPORT_DIR: str = "./exports"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
