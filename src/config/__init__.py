"""
配置模块：集中管理系统配置参数
"""
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MinIOConfig:
    endpoint: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    secure: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    bucket_name: str = os.getenv("MINIO_BUCKET_NAME", "beauty-store-data")


@dataclass
class DuckDBConfig:
    db_path: str = os.getenv("DUCKDB_PATH", "data/processed/beauty_store.duckdb")


@dataclass
class DefaultThresholds:
    low_course_consumption_rate: float = 0.6
    high_material_usage_ratio: float = 1.5
    negative_review_ratio: float = 0.1
    overdue_visit_days: int = 30
    review_delay_hours: int = int(os.getenv("REVIEW_DELAY_THRESHOLD_HOURS", "24"))


@dataclass
class AppConfig:
    minio: MinIOConfig = field(default_factory=MinIOConfig)
    duckdb: DuckDBConfig = field(default_factory=DuckDBConfig)
    thresholds: DefaultThresholds = field(default_factory=DefaultThresholds)
    app_title: str = "美业门店顾客回访风险监测平台"


config = AppConfig()
