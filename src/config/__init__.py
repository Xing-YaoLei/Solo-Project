import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MinIOConfig:
    endpoint: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    secure: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    bucket: str = os.getenv("MINIO_BUCKET", "coffee-report")


@dataclass
class AppConfig:
    duckdb_path: str = os.getenv("DUCKDB_PATH", "data/loss_review.db")
    app_secret_key: str = os.getenv("APP_SECRET_KEY", "dev-secret-key")
    refresh_cache_path: str = os.getenv("REFRESH_CACHE_PATH", "data/refresh_time.json")


minio_config = MinIOConfig()
app_config = AppConfig()
