from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    DATABASE_URL: str = ""

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "homestay_package"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def FINAL_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        pg_url = (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        try:
            from sqlalchemy import create_engine
            test_engine = create_engine(pg_url, connect_args={"connect_timeout": 2})
            with test_engine.connect() as conn:
                conn.execute("SELECT 1")
            return pg_url
        except Exception:
            pass
        db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "homestay.db"
        )
        return f"sqlite:///{db_path}"

    @property
    def IS_SQLITE(self) -> bool:
        return self.FINAL_DATABASE_URL.startswith("sqlite")

    @property
    def CELERY_BROKER_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


@lru_cache()
def get_settings():
    return Settings()
