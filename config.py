import os
import sys
from dotenv import load_dotenv

load_dotenv()


def _pg_available() -> bool:
    try:
        import psycopg2
        host = os.getenv("POSTGRES_HOST", "localhost")
        port = int(os.getenv("POSTGRES_PORT", "5432"))
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "postgres")
        dbname = os.getenv("POSTGRES_DB", "scenic_ticket")
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=password, dbname=dbname,
            connect_timeout=2,
        )
        conn.close()
        return True
    except Exception:
        return False


def _redis_available() -> bool:
    try:
        import redis
        url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
        r = redis.Redis.from_url(url, socket_connect_timeout=2)
        r.ping()
        return True
    except Exception:
        return False


USE_PG = _pg_available()
USE_REDIS = _redis_available()
STANDALONE_MODE = not (USE_PG and USE_REDIS)

if STANDALONE_MODE:
    print("[INFO] 检测到 PostgreSQL 或 Redis 不可用，已切换到 STANDALONE 模式（SQLite + 同步执行）", file=sys.stderr)


class Config:
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB = os.getenv("POSTGRES_DB", "scenic_ticket")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SQLITE_PATH = os.path.join(BASE_DIR, "data", "scenic_ticket.db")

    if USE_PG:
        SQLALCHEMY_DATABASE_URI = (
            f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
            f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
        )
    else:
        os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{SQLITE_PATH}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "connect_args": {"check_same_thread": False} if not USE_PG else {},
    }

    if USE_REDIS:
        CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
        CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    else:
        CELERY_BROKER_URL = "filesystem://"
        CELERY_RESULT_BACKEND = "cache+memory://"

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

    STANDALONE = STANDALONE_MODE
