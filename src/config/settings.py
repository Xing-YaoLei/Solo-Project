import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Settings:
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "auto-maintenance")

    DUCKDB_PATH: str = os.getenv("DUCKDB_PATH", ":memory:")

    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data"))

    USE_MOCK_DATA: bool = os.getenv("USE_MOCK_DATA", "true").lower() == "true"


settings = Settings()
