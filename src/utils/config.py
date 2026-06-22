import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "False").lower() == "true"
    MINIO_BUCKET_AUDIT: str = os.getenv("MINIO_BUCKET_AUDIT", "audit-documents")
    MINIO_BUCKET_LOGS: str = os.getenv("MINIO_BUCKET_LOGS", "permission-logs")
    MINIO_BUCKET_MAIL: str = os.getenv("MINIO_BUCKET_MAIL", "mail-materials")

    DUCKDB_PATH: str = os.getenv("DUCKDB_PATH", "data/audit_archive.duckdb")

    STREAMLIT_SERVER_PORT: int = int(os.getenv("STREAMLIT_SERVER_PORT", "8501"))
    STREAMLIT_SERVER_HOST: str = os.getenv("STREAMLIT_SERVER_HOST", "0.0.0.0")


BASE_DIR = Path(__file__).resolve().parent.parent.parent

settings = Settings()


def get_duckdb_path() -> str:
    return str(BASE_DIR / settings.DUCKDB_PATH)


def ensure_data_dirs() -> None:
    for dir_name in ["data/raw", "data/processed", "data/samples"]:
        (BASE_DIR / dir_name).mkdir(parents=True, exist_ok=True)
