import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MinIOConfig:
    endpoint: str = os.getenv("MINIO_ENDPOINT", "play.min.io")
    access_key: str = os.getenv("MINIO_ACCESS_KEY", "Q3AM3UQ867SPQQA43P2F")
    secret_key: str = os.getenv("MINIO_SECRET_KEY", "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG")
    secure: bool = os.getenv("MINIO_SECURE", "true").lower() == "true"
    bucket: str = os.getenv("MINIO_BUCKET", "ticket-archive")


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
