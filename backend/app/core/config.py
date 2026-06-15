from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "职业教育题库练习风险监测系统"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/edu_monitor"
    DUCKDB_PATH: str = "./data/edu_analytics.duckdb"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    SHARE_TOKEN_EXPIRE_HOURS: int = 72

    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    COMPLETION_RATE_FORMULA: str = "完成率 = 已完成题目数 / 应完成题目总数 × 100%"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
