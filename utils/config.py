import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings:
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB = os.getenv("POSTGRES_DB", "homestay_dashboard")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    DASH_HOST = os.getenv("DASH_HOST", "0.0.0.0")
    DASH_PORT = int(os.getenv("DASH_PORT", "8050"))
    DASH_DEBUG = os.getenv("DASH_DEBUG", "true").lower() == "true"

    EXPORT_DIR = Path(os.getenv("EXPORT_DIR", str(BASE_DIR / "exports")))
    SYNC_BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "1000"))

    @property
    def DATABASE_URL(self):
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

if not settings.EXPORT_DIR.exists():
    settings.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
