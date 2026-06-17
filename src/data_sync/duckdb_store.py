import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import duckdb
import polars as pl

from ..config import DuckDBConfig

logger = logging.getLogger(__name__)


class DuckDBStore:
    def __init__(self, config: Optional[DuckDBConfig] = None):
        self.config = config or DuckDBConfig
        self._conn = None
        self._init_schema()

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        if self._conn is None:
            self._conn = duckdb.connect(self.config.PATH)
        return self._conn

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

    def _init_schema(self) -> None:
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sync_audit (
                node_id VARCHAR,
                node_name VARCHAR,
                status VARCHAR,
                timestamp TIMESTAMP,
                source_count INTEGER,
                target_count INTEGER,
                error_message VARCHAR,
                duration_ms INTEGER,
                metadata JSON
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS payment_flows (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                tenant_id VARCHAR,
                payment_date DATE,
                amount DECIMAL(12,2),
                payment_type VARCHAR,
                status VARCHAR,
                region VARCHAR,
                created_at TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS e_contracts (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                tenant_id VARCHAR,
                contract_start DATE,
                contract_end DATE,
                monthly_rent DECIMAL(12,2),
                cleaning_frequency VARCHAR,
                region VARCHAR,
                status VARCHAR,
                signed_at TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meter_readings (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                reading_date DATE,
                electricity_usage DECIMAL(10,2),
                water_usage DECIMAL(10,2),
                meter_reader_id VARCHAR,
                region VARCHAR,
                notes VARCHAR,
                created_at TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cleaning_schedules (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                cleaner_id VARCHAR,
                scheduled_date DATE,
                scheduled_start TIME,
                scheduled_end TIME,
                region VARCHAR,
                status VARCHAR,
                actual_start TIME,
                actual_end TIME,
                arrival_status VARCHAR,
                reminder_sent BOOLEAN,
                priority INTEGER,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shared_links (
                id VARCHAR PRIMARY KEY,
                token VARCHAR UNIQUE,
                role VARCHAR,
                created_by VARCHAR,
                tenant_id VARCHAR,
                region VARCHAR,
                expires_at TIMESTAMP,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY,
                username VARCHAR UNIQUE,
                role VARCHAR,
                region VARCHAR,
                tenant_id VARCHAR,
                created_at TIMESTAMP
            )
            """
        )

    def log_sync_node(
        self,
        node_id: str,
        node_name: str,
        status: str,
        source_count: int = 0,
        target_count: int = 0,
        error_message: Optional[str] = None,
        duration_ms: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        import json

        self.conn.execute(
            """
            INSERT INTO sync_audit
            (node_id, node_name, status, timestamp, source_count, target_count,
             error_message, duration_ms, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                node_id,
                node_name,
                status,
                datetime.now(),
                source_count,
                target_count,
                error_message,
                duration_ms,
                json.dumps(metadata or {}) if metadata else None,
            ],
        )

    def get_sync_audit(self, limit: int = 200) -> pl.DataFrame:
        return pl.from_arrow(
            self.conn.execute(
                """
                SELECT * FROM sync_audit
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                [limit],
            ).fetch_arrow_table()
        )

    def write_polars(self, table_name: str, df: pl.DataFrame) -> int:
        if df.is_empty():
            return 0
        self.conn.register(f"_tmp_{table_name}", df)
        result = self.conn.execute(
            f"""
            INSERT OR REPLACE INTO {table_name}
            SELECT * FROM _tmp_{table_name}
            """
        )
        count = result.rowcount
        self.conn.unregister(f"_tmp_{table_name}")
        return count

    def read_table(self, table_name: str, filters: Optional[str] = None) -> pl.DataFrame:
        query = f"SELECT * FROM {table_name}"
        if filters:
            query += f" WHERE {filters}"
        query += " ORDER BY created_at DESC"
        return pl.from_arrow(self.conn.execute(query).fetch_arrow_table())

    def query(self, sql: str, params: Optional[list] = None) -> pl.DataFrame:
        if params:
            return pl.from_arrow(self.conn.execute(sql, params).fetch_arrow_table())
        return pl.from_arrow(self.conn.execute(sql).fetch_arrow_table())

    def execute(self, sql: str, params: Optional[list] = None) -> Any:
        if params:
            return self.conn.execute(sql, params)
        return self.conn.execute(sql)
