import duckdb
import polars as pl
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import os

from src.data.minio_storage import minio_storage
from src.data.mock_data import generate_all_data


class DataLoader:
    def __init__(self, use_mock: bool = True):
        self.con = duckdb.connect(database=':memory:', read_only=False)
        self.use_mock = use_mock
        self._tables: Dict[str, pl.DataFrame] = {}
        self._load_data()

    def _load_data(self):
        if self.use_mock or not minio_storage.is_connected:
            self._load_mock_data()
        else:
            self._load_from_minio()

    def _load_mock_data(self):
        data = generate_all_data()
        self._tables = data
        for name, df in data.items():
            self.con.register(name, df)

    def _load_from_minio(self):
        data_sources = {
            "payment_flow": "payment_flow.parquet",
            "calendar_events": "calendar_events.parquet",
            "case_docs": "case_docs.parquet",
            "review_records": "review_records.parquet",
            "interaction_logs": "interaction_logs.parquet",
        }
        for table_name, object_name in data_sources.items():
            df = minio_storage.read_parquet(object_name)
            if df is not None:
                self._tables[table_name] = df
                self.con.register(table_name, df)

    def query(self, sql: str) -> pl.DataFrame:
        return self.con.sql(sql).pl()

    def get_table(self, name: str) -> Optional[pl.DataFrame]:
        return self._tables.get(name)

    def list_tables(self) -> List[str]:
        return list(self._tables.keys())

    def refresh(self):
        self._tables.clear()
        self._load_data()


data_loader = DataLoader(use_mock=True)
