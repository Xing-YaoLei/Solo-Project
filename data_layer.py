import os
import duckdb
import polars as pl
from minio import Minio
from dotenv import load_dotenv
from typing import Optional, Dict, List

load_dotenv()


class MinIOClient:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        self.bucket = os.getenv("MINIO_BUCKET", "legal-documents")
        self._client: Optional[Minio] = None
        self._available = False

    @property
    def client(self) -> Minio:
        if self._client is None:
            try:
                self._client = Minio(
                    self.endpoint,
                    access_key=self.access_key,
                    secret_key=self.secret_key,
                    secure=self.secure,
                )
                self._available = True
            except Exception:
                self._available = False
        return self._client

    def is_available(self) -> bool:
        try:
            self.client.list_buckets()
            return True
        except Exception:
            return False

    def list_objects(self, prefix: str = "") -> List[str]:
        if not self.is_available():
            return []
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except Exception:
            return []


class DataWarehouse:
    def __init__(self):
        self.con = duckdb.connect(":memory:")
        self.minio = MinIOClient()
        self._init_schemas()

    def _init_schemas(self):
        self.con.execute("CREATE SCHEMA IF NOT EXISTS raw")
        self.con.execute("CREATE SCHEMA IF NOT EXISTS curated")
        self.con.execute("CREATE SCHEMA IF NOT EXISTS analytics")

    def register_polars(self, name: str, df: pl.DataFrame, schema: str = "curated"):
        self.con.execute(f"CREATE OR REPLACE TABLE {schema}.{name} AS SELECT * FROM df")

    def query(self, sql: str) -> pl.DataFrame:
        result = self.con.execute(sql).pl()
        return result

    def get_table(self, name: str, schema: str = "curated") -> pl.DataFrame:
        return self.query(f"SELECT * FROM {schema}.{name}")

    def list_tables(self, schema: str = "curated") -> List[str]:
        result = self.query(
            f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema}'"
        )
        return result["table_name"].to_list()


dw = DataWarehouse()
