import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "ticket-data")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

    DUCKDB_PATH = os.getenv("DUCKDB_PATH", "./data/ticket_analytics.duckdb")
    DATA_DIR = os.getenv("DATA_DIR", "./data")

    @classmethod
    def ensure_data_dir(cls):
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        return cls.DATA_DIR
