import os
from dotenv import load_dotenv

load_dotenv()


class DatabaseConfig:
    HOST = os.getenv("POSTGRES_HOST", "localhost")
    PORT = os.getenv("POSTGRES_PORT", "5432")
    DB = os.getenv("POSTGRES_DB", "fitness_pt_dashboard")
    USER = os.getenv("POSTGRES_USER", "postgres")
    PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return f"postgresql+psycopg2://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.DB}"


class CeleryConfig:
    BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")


class DashConfig:
    HOST = os.getenv("DASH_HOST", "0.0.0.0")
    PORT = int(os.getenv("DASH_PORT", "8050"))
    DEBUG = os.getenv("DASH_DEBUG", "true").lower() == "true"


class SyncConfig:
    BATCH_SIZE = 1000
    RETRY_TIMES = 3
    RETRY_DELAY = 5


db_config = DatabaseConfig()
celery_config = CeleryConfig()
dash_config = DashConfig()
sync_config = SyncConfig()
