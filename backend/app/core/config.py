from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "旅游民宿客诉处理风险监测系统"

    DATABASE_URL: str = "sqlite:///./data/complaints.db"
    DUCKDB_PATH: str = "./data/analytics.duckdb"

    POSTGRES_USER: str = "complaints_user"
    POSTGRES_PASSWORD: str = "complaints_pass"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "complaints_db"

    USE_POSTGRES: bool = True

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5185", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5185"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
