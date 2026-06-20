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
    bucket: str = os.getenv("MINIO_BUCKET", "ticket-data")


@dataclass
class DatabaseConfig:
    duckdb_path: str = os.getenv("DUCKDB_PATH", "./data/ticket_analytics.duckdb")


@dataclass
class AppConfig:
    title: str = os.getenv("APP_TITLE", "活动票务核销漏斗报表")
    icon: str = os.getenv("APP_ICON", "🎫")


minio_config = MinIOConfig()
db_config = DatabaseConfig()
app_config = AppConfig()
