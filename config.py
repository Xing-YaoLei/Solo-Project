import os
from dataclasses import dataclass
from typing import List, Dict
from datetime import date

@dataclass
class MinIOConfig:
    endpoint: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    secure: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    bucket_name: str = os.getenv("MINIO_BUCKET", "vocational-edu-data")

@dataclass
class DatabaseConfig:
    db_path: str = os.getenv("DUCKDB_PATH", "./data/vocational_edu.duckdb")

@dataclass
class SyncConfig:
    source_systems: List[str] = None
    sync_interval_minutes: int = 60
    audit_log_retention_days: int = 90

    def __post_init__(self):
        if self.source_systems is None:
            self.source_systems = ["employment", "live_platform", "question_bank"]

@dataclass
class AppConfig:
    title: str = "职业教育学员社群风险监测平台"
    regions: List[str] = None
    risk_thresholds: Dict[str, float] = None

    def __post_init__(self):
        if self.regions is None:
            self.regions = ["华东", "华南", "华北", "华中", "西南", "西北", "东北"]
        if self.risk_thresholds is None:
            self.risk_thresholds = {
                "plagiarism": 0.3,
                "dropout_rate": 0.15,
                "refund_rate": 0.1,
                "level_drop": 0.2
            }

minio_config = MinIOConfig()
db_config = DatabaseConfig()
sync_config = SyncConfig()
app_config = AppConfig()
