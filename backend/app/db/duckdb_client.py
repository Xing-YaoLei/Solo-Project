import asyncio
from typing import Any

import duckdb
import pandas as pd
import polars as pl

from app.config.settings import settings


class DuckDBClient:
    def __init__(self) -> None:
        self._conn: duckdb.DuckDBPyConnection | None = None
        self._lock = asyncio.Lock()

    async def connect(self) -> None:
        async with self._lock:
            if self._conn is None:
                if settings.DUCKDB_MEMORY:
                    self._conn = duckdb.connect(":memory:")
                else:
                    self._conn = duckdb.connect(settings.DUCKDB_PATH)
                self._conn.execute("INSTALL parquet; LOAD parquet;")
                self._conn.execute("INSTALL httpfs; LOAD httpfs;")

    async def close(self) -> None:
        async with self._lock:
            if self._conn is not None:
                self._conn.close()
                self._conn = None

    async def execute(self, query: str, params: dict[str, Any] | None = None) -> None:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            self._conn.execute(query, params or {})

    async def fetch_all(self, query: str, params: dict[str, Any] | None = None) -> list[tuple[Any, ...]]:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            result = self._conn.execute(query, params or {})
            return result.fetchall()

    async def fetch_df(self, query: str, params: dict[str, Any] | None = None) -> pd.DataFrame:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            result = self._conn.execute(query, params or {})
            return result.fetchdf()

    async def fetch_polars(self, query: str, params: dict[str, Any] | None = None) -> pl.DataFrame:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            result = self._conn.execute(query, params or {})
            return result.pl()

    async def fetch_one(self, query: str, params: dict[str, Any] | None = None) -> tuple[Any, ...] | None:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            result = self._conn.execute(query, params or {})
            return result.fetchone()

    async def register_table(self, table_name: str, df: pd.DataFrame | pl.DataFrame) -> None:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            self._conn.register(table_name, df)

    async def create_view(self, view_name: str, query: str) -> None:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            self._conn.execute(f"CREATE OR REPLACE VIEW {view_name} AS {query}")

    async def export_to_parquet(self, query: str, output_path: str) -> None:
        async with self._lock:
            if self._conn is None:
                raise RuntimeError("DuckDB connection not initialized")
            self._conn.execute(f"COPY ({query}) TO '{output_path}' (FORMAT PARQUET)")


duckdb_client = DuckDBClient()
