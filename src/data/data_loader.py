import os
import polars as pl
from pathlib import Path
from src.data.duckdb_manager import DuckDBManager
from src.data.minio_client import MinIOClient
from src.utils.config import Config


TABLE_NAMES = {
    "registrations": "registrations",
    "payments": "payments",
    "checkin_codes": "checkin_codes",
    "seats": "seats",
    "sponsors": "sponsors",
    "refunds": "refunds",
    "refund_notes": "refund_notes",
}


class DataLoader:
    def __init__(self):
        self.ddb = DuckDBManager()
        self.minio = MinIOClient()
        self.data_dir = Path(Config.DATA_DIR)

    def load_local_csv(self, table_name: str, csv_path: str) -> bool:
        if not os.path.exists(csv_path):
            return False
        self.ddb.create_table_from_csv(table_name, csv_path)
        return True

    def load_from_minio(self, table_name: str, object_key: str) -> bool:
        if not self.minio.bucket_exists():
            return False
        local_path = self.data_dir / Path(object_key).name
        try:
            self.minio.download_file(object_key, str(local_path))
            self.ddb.create_table_from_csv(table_name, str(local_path))
            return True
        except Exception:
            return False

    def load_polars_df(self, table_name: str, df: pl.DataFrame):
        self.ddb.create_table_from_polars(table_name, df)

    def has_table(self, table_name: str) -> bool:
        return self.ddb.table_exists(table_name)

    def get_df(self, table_name: str) -> pl.DataFrame:
        return self.ddb.query(f"SELECT * FROM {table_name}")

    def list_tables(self) -> list:
        return self.ddb.list_tables()

    def ensure_all_tables(self) -> dict:
        status = {}
        for key, name in TABLE_NAMES.items():
            status[key] = self.has_table(name)
        return status
