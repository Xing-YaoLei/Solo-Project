import duckdb
import pandas as pd
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from sqlalchemy import create_engine, text

from app.core.config import settings


class DuckDBClient:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DUCKDB_PATH
        self.conn: Optional[duckdb.DuckDBPyConnection] = None
        self._pg_engine = None

    @property
    def pg_engine(self):
        if self._pg_engine is None:
            self._pg_engine = create_engine(settings.DATABASE_URL)
        return self._pg_engine

    def connect(self) -> duckdb.DuckDBPyConnection:
        if self.conn is None:
            self.conn = duckdb.connect(self.db_path)
        return self.conn

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    @contextmanager
    def get_connection(self):
        conn = self.connect()
        try:
            yield conn
        finally:
            pass

    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        with self.get_connection() as conn:
            if params:
                return conn.execute(query, params).df()
            return conn.execute(query).df()

    def sync_from_postgres(self, tables: Optional[List[str]] = None):
        all_tables = [
            "users",
            "import_batches",
            "crm_customers",
            "properties",
            "payment_transactions",
            "e_contracts",
            "inspection_records",
            "inspection_items",
            "repair_orders",
            "repair_caliber_versions",
            "rent_overdue_comments",
            "complaints",
        ]

        tables_to_sync = tables or all_tables

        synced = []
        with self.get_connection() as conn:
            for table in tables_to_sync:
                try:
                    df = pd.read_sql(f'SELECT * FROM public."{table}"', self.pg_engine)
                    conn.execute(f"DROP TABLE IF EXISTS {table}")
                    conn.execute(f"CREATE TABLE {table} AS SELECT * FROM df")
                    synced.append(f"{table}({len(df)})")
                except Exception as e:
                    print(f"Error syncing table {table}: {e}")
        print(f"✅ Synced tables: {', '.join(synced)}")

    def sync_table(self, table_name: str):
        self.sync_from_postgres([table_name])

    def get_table_count(self, table_name: str) -> int:
        with self.get_connection() as conn:
            result = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
            return result[0] if result else 0


duckdb_client = DuckDBClient()
