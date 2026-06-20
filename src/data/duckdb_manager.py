import duckdb
import polars as pl
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging

from src.config import Config

logger = logging.getLogger(__name__)


class DuckDBManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_connection()
        return cls._instance

    def _init_connection(self):
        db_path = Path(Config.DUCKDB_PATH)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = duckdb.connect(str(db_path))
        self._init_tables()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                run_id VARCHAR,
                step_id VARCHAR,
                step_name VARCHAR,
                status VARCHAR,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                records_count INTEGER,
                error_message VARCHAR,
                duration_seconds DOUBLE,
                PRIMARY KEY (run_id, step_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS mini_program_orders (
                order_id VARCHAR PRIMARY KEY,
                order_date DATE,
                region VARCHAR,
                visitor_count INTEGER,
                order_amount DOUBLE,
                order_type VARCHAR,
                create_time TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS camera_statistics (
                stat_id VARCHAR PRIMARY KEY,
                stat_date DATE,
                region VARCHAR,
                hour INTEGER,
                visitor_in INTEGER,
                visitor_out INTEGER,
                peak_visitors INTEGER,
                create_time TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS merchant_transactions (
                txn_id VARCHAR PRIMARY KEY,
                txn_date DATE,
                region VARCHAR,
                merchant_id VARCHAR,
                merchant_name VARCHAR,
                amount DOUBLE,
                category VARCHAR,
                create_time TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                complaint_id VARCHAR PRIMARY KEY,
                complaint_date DATE,
                region VARCHAR,
                source VARCHAR,
                tag VARCHAR,
                description TEXT,
                status VARCHAR,
                close_hours DOUBLE,
                responsibility VARCHAR,
                followup_result VARCHAR,
                followup_date DATE,
                order_id VARCHAR,
                evidence_files VARCHAR[],
                create_time TIMESTAMP,
                update_time TIMESTAMP
            )
        """)

    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> pl.DataFrame:
        if params:
            result = self.conn.execute(query, params)
        else:
            result = self.conn.execute(query)
        return pl.from_arrow(result.fetch_arrow_table())

    def register_polars(self, df: pl.DataFrame, table_name: str, if_exists: str = "append"):
        if if_exists == "replace":
            self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        self.conn.register("temp_df", df.to_arrow())
        self.conn.execute(f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM temp_df")
        if if_exists == "append":
            self.conn.unregister("temp_df")

    def insert_dataframe(self, df: pl.DataFrame, table_name: str):
        self.conn.register("temp_df", df.to_arrow())
        self.conn.execute(f"INSERT INTO {table_name} SELECT * FROM temp_df")
        self.conn.unregister("temp_df")

    def log_pipeline_run(self, run_id: str, step_id: str, step_name: str, status: str,
                         start_time, end_time=None, records_count: int = 0,
                         error_message: str = None):
        duration = None
        if end_time:
            duration = (end_time - start_time).total_seconds()

        self.conn.execute("""
            INSERT INTO pipeline_runs (run_id, step_id, step_name, status, start_time,
                                   end_time, records_count, error_message, duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (run_id, step_id) DO UPDATE SET
                status = EXCLUDED.status,
                end_time = EXCLUDED.end_time,
                records_count = EXCLUDED.records_count,
                error_message = EXCLUDED.error_message,
                duration_seconds = EXCLUDED.duration_seconds
        """, [run_id, step_id, step_name, status, start_time, end_time,
              records_count, error_message, duration])

    def get_pipeline_runs(self, limit: int = 50) -> pl.DataFrame:
        return self.execute_query("""
            SELECT * FROM pipeline_runs
            ORDER BY start_time DESC
            LIMIT ?
        """, {"limit": limit})

    def close(self):
        self.conn.close()
