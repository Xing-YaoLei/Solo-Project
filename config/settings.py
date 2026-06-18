import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://username:password@localhost:5432/repair_dashboard"
    )
    celery_broker_url: str = os.getenv(
        "CELERY_BROKER_URL",
        "redis://localhost:6379/0"
    )
    celery_result_backend: str = os.getenv(
        "CELERY_RESULT_BACKEND",
        "redis://localhost:6379/0"
    )
    app_name: str = "汽车维修预约进厂趋势看板"
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"


settings = Settings()
