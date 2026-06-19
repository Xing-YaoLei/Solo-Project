import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MinIOConfig:
    endpoint: str
    access_key: str
    secret_key: str
    secure: bool
    bucket: str


@dataclass
class DuckDBConfig:
    db_path: str


@dataclass
class AppConfig:
    minio: MinIOConfig
    duckdb: DuckDBConfig
    streamlit_port: int


def load_config() -> AppConfig:
    minio_config = MinIOConfig(
        endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=os.getenv("MINIO_SECURE", "False").lower() == "true",
        bucket=os.getenv("MINIO_BUCKET", "homestay-data"),
    )

    duckdb_config = DuckDBConfig(
        db_path=os.getenv("DUCKDB_PATH", "data/homestay.duckdb")
    )

    streamlit_port = int(os.getenv("STREAMLIT_PORT", "8501"))

    return AppConfig(
        minio=minio_config,
        duckdb=duckdb_config,
        streamlit_port=streamlit_port,
    )
