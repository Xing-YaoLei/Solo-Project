import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB = os.getenv("POSTGRES_DB", "scenic_ticket")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
        f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    DASH_SECRET_KEY = os.getenv("DASH_SECRET_KEY", "dev-secret-key-change-in-production")

    ZONES = [
        "主入口区",
        "东门区",
        "西门区",
        "核心景区A",
        "核心景区B",
        "山顶观景区",
        "湖滨休闲区",
        "商业街",
    ]

    TIME_SLOTS = [
        "08:00-10:00",
        "10:00-12:00",
        "12:00-14:00",
        "14:00-16:00",
        "16:00-18:00",
        "18:00-20:00",
    ]

    ROLES = {
        "management": "管理层",
        "frontline": "一线人员",
    }
