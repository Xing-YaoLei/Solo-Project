from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "False").lower() == "true"
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "rehab-center-data")

    DUCKDB_DATABASE: str = os.getenv("DUCKDB_DATABASE", "data/rehab_center.duckdb")

    STREAMLIT_SERVER_PORT: int = int(os.getenv("STREAMLIT_SERVER_PORT", 8501))
    STREAMLIT_SERVER_HOST: str = os.getenv("STREAMLIT_SERVER_HOST", "0.0.0.0")


config = Config()
