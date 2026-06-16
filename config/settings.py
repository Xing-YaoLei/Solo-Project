import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MinIOConfig:
    endpoint: str = field(default_factory=lambda: os.getenv("MINIO_ENDPOINT", "localhost:9000"))
    access_key: str = field(default_factory=lambda: os.getenv("MINIO_ACCESS_KEY", "minioadmin"))
    secret_key: str = field(default_factory=lambda: os.getenv("MINIO_SECRET_KEY", "minioadmin"))
    secure: bool = field(default_factory=lambda: os.getenv("MINIO_SECURE", "false").lower() == "true")
    bucket: str = field(default_factory=lambda: os.getenv("MINIO_BUCKET", "elder-care-data"))


@dataclass
class DuckDBConfig:
    db_path: str = field(default_factory=lambda: os.getenv("DUCKDB_PATH", "./data/elder_care.duckdb"))


@dataclass
class ThresholdConfig:
    compliance_threshold: float = field(default_factory=lambda: float(os.getenv("COMPLIANCE_THRESHOLD", "85")))
    fall_impact_days: int = field(default_factory=lambda: int(os.getenv("FALL_IMPACT_DAYS", "7")))
    terminal_delay_threshold_hours: int = field(default_factory=lambda: int(os.getenv("TERMINAL_DELAY_THRESHOLD_HOURS", "24")))


@dataclass
class AppConfig:
    minio: MinIOConfig = field(default_factory=MinIOConfig)
    duckdb: DuckDBConfig = field(default_factory=DuckDBConfig)
    thresholds: ThresholdConfig = field(default_factory=ThresholdConfig)
    app_name: str = field(default_factory=lambda: "养老护理康复活动漏斗报表")
    data_dir: str = field(default_factory=lambda: "./data")


config = AppConfig()
