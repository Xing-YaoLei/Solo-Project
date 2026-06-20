from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/scenic_performance"
    DUCKDB_PATH: str = "./data/analytics.duckdb"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MINIAPP_API_URL: str = "https://api.example.com/miniapp"
    MERCHANT_API_URL: str = "https://api.example.com/merchant"
    CAMERA_API_URL: str = "https://api.example.com/camera"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
