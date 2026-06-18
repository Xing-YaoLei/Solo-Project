import duckdb
import polars as pl
from pathlib import Path
from typing import Optional, Union, Dict, List, Any
from contextlib import contextmanager
from datetime import datetime

from config import DuckDBConfig


class DuckDBEngine:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DuckDBConfig.PATH
        self._conn: Optional[duckdb.DuckDBPyConnection] = None
        self._init_database()

    @contextmanager
    def get_connection(self):
        conn = duckdb.connect(str(self.db_path))
        try:
            yield conn
        finally:
            conn.close()

    def _init_database(self):
        with self.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_batches (
                    batch_id VARCHAR PRIMARY KEY,
                    data_source VARCHAR NOT NULL,
                    batch_date TIMESTAMP NOT NULL,
                    status VARCHAR NOT NULL,
                    total_count INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    failed_count INTEGER DEFAULT 0,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS design_exports (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR NOT NULL,
                    project_name VARCHAR,
                    region VARCHAR,
                    customer_id VARCHAR,
                    customer_name VARCHAR,
                    design_version VARCHAR,
                    export_time TIMESTAMP,
                    file_path VARCHAR,
                    file_size BIGINT,
                    confirmation_status VARCHAR DEFAULT '待确认',
                    confirmed_by VARCHAR,
                    confirmed_at TIMESTAMP,
                    batch_id VARCHAR,
                    is_missing BOOLEAN DEFAULT false,
                    missing_fields TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS payment_records (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR NOT NULL,
                    project_name VARCHAR,
                    region VARCHAR,
                    customer_id VARCHAR,
                    customer_name VARCHAR,
                    payment_amount DECIMAL(15, 2),
                    payment_time TIMESTAMP,
                    payment_method VARCHAR,
                    payment_status VARCHAR,
                    batch_id VARCHAR,
                    is_missing BOOLEAN DEFAULT false,
                    missing_fields TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS purchase_orders (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR NOT NULL,
                    project_name VARCHAR,
                    region VARCHAR,
                    supplier_name VARCHAR,
                    material_name VARCHAR,
                    order_amount DECIMAL(15, 2),
                    order_time TIMESTAMP,
                    order_status VARCHAR,
                    batch_id VARCHAR,
                    is_missing BOOLEAN DEFAULT false,
                    missing_fields TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS project_confirmations (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR NOT NULL,
                    project_name VARCHAR,
                    region VARCHAR,
                    customer_id VARCHAR,
                    customer_name VARCHAR,
                    design_confirmed BOOLEAN DEFAULT false,
                    payment_confirmed BOOLEAN DEFAULT false,
                    purchase_confirmed BOOLEAN DEFAULT false,
                    overall_completeness DECIMAL(5, 2) DEFAULT 0,
                    risk_level VARCHAR DEFAULT '低风险',
                    confirmation_date TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    tags TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS attachments (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR NOT NULL,
                    category VARCHAR,
                    file_name VARCHAR,
                    file_path VARCHAR,
                    file_size BIGINT,
                    upload_time TIMESTAMP,
                    uploaded_by VARCHAR,
                    tags TEXT,
                    is_valid BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS change_timeline (
                    id VARCHAR PRIMARY KEY,
                    project_id VARCHAR,
                    change_type VARCHAR,
                    field_name VARCHAR,
                    old_value TEXT,
                    new_value TEXT,
                    changed_by VARCHAR,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT,
                    version VARCHAR
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS auth_scopes (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR,
                    user_name VARCHAR,
                    region VARCHAR,
                    allowed_project_ids TEXT,
                    role VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def execute(self, sql: str, params: Optional[Dict] = None) -> duckdb.DuckDBPyResult:
        with self.get_connection() as conn:
            if params:
                return conn.execute(sql, params)
            return conn.execute(sql)

    def query_df(self, sql: str, params: Optional[Dict] = None) -> pl.DataFrame:
        with self.get_connection() as conn:
            if params:
                result = conn.execute(sql, params)
            else:
                result = conn.execute(sql)
            return pl.from_arrow(result.fetch_arrow_table())

    def write_df(self, table_name: str, df: pl.DataFrame, mode: str = "append"):
        with self.get_connection() as conn:
            if mode == "overwrite":
                conn.execute(f"DELETE FROM {table_name}")

            table_cols_result = conn.execute(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position",
                [table_name.lower()],
            ).fetchall()
            table_cols = [row[0] for row in table_cols_result]

            if not table_cols:
                pandas_df = df.to_pandas()
                conn.register("temp_df", pandas_df)
                conn.execute(f"INSERT INTO {table_name} SELECT * FROM temp_df")
                conn.unregister("temp_df")
                return

            pandas_df = df.to_pandas()
            df_cols = list(pandas_df.columns)

            select_parts = []
            for col in table_cols:
                if col in df_cols:
                    select_parts.append(f'"{col}"')
                else:
                    select_parts.append(f"NULL AS \"{col}\"")

            select_sql = ", ".join(select_parts)
            conn.register("temp_df", pandas_df)
            conn.execute(f"INSERT INTO {table_name} ({', '.join(f'\"{c}\"' for c in table_cols)}) SELECT {select_sql} FROM temp_df")
            conn.unregister("temp_df")

    def table_exists(self, table_name: str) -> bool:
        with self.get_connection() as conn:
            result = conn.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?",
                [table_name.lower()],
            ).fetchone()
            return result[0] > 0

    def get_last_update_time(self, table_name: str) -> Optional[datetime]:
        try:
            with self.get_connection() as conn:
                result = conn.execute(
                    f"SELECT MAX(updated_at) FROM {table_name}"
                ).fetchone()
                return result[0] if result and result[0] else None
        except Exception:
            return None
