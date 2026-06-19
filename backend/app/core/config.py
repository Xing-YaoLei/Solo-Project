from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "旅游民宿客诉处理风险监测系统"
    
    DATABASE_URL: str = "sqlite:///./data/complaints.db"
    DUCKDB_PATH: str = "./data/analytics.duckdb"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "complaints_db"
    
    USE_POSTGRES: bool = False
    
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
