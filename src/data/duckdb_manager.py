import duckdb
import polars as pl
from typing import Optional, Dict, Any, List
from contextlib import contextmanager

from src.config.settings import settings


class DuckDBManager:
    def __init__(self):
        self._conn = None
        self._init_connection()

    def _init_connection(self):
        try:
            self._conn = duckdb.connect(settings.DUCKDB_PATH)
            self._conn.execute("SET timezone = 'Asia/Shanghai'")
        except Exception as e:
            print(f"DuckDB 初始化失败: {e}")
            self._conn = duckdb.connect(":memory:")

    @property
    def connection(self) -> duckdb.DuckDBPyConnection:
        return self._conn

    @contextmanager
    def transaction(self):
        try:
            self._conn.execute("BEGIN TRANSACTION")
            yield self._conn
            self._conn.execute("COMMIT")
        except Exception as e:
            self._conn.execute("ROLLBACK")
            raise e

    def register_polars(self, name: str, df: pl.DataFrame) -> None:
        self._conn.register(name, df)

    def unregister(self, name: str) -> None:
        try:
            self._conn.unregister(name)
        except Exception:
            pass

    def execute(self, sql: str, params: Optional[Dict[str, Any]] = None) -> duckdb.DuckDBPyResult:
        if params:
            return self._conn.execute(sql, params)
        return self._conn.execute(sql)

    def query_df(self, sql: str, params: Optional[Dict[str, Any]] = None) -> pl.DataFrame:
        result = self.execute(sql, params)
        return pl.from_arrow(result.fetch_arrow_table())

    def query_pandas(self, sql: str, params: Optional[Dict[str, Any]] = None):
        result = self.execute(sql, params)
        return result.fetchdf()

    def create_table_from_df(self, table_name: str, df: pl.DataFrame, if_exists: str = "replace") -> None:
        if if_exists == "replace":
            self._conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        elif if_exists == "fail":
            existing = self._conn.execute(
                f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'"
            ).fetchone()
            if existing:
                raise ValueError(f"表 {table_name} 已存在")

        self.register_polars(f"temp_{table_name}", df)
        self._conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_{table_name}")
        self.unregister(f"temp_{table_name}")

    def table_exists(self, table_name: str) -> bool:
        result = self._conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [table_name],
        ).fetchone()
        return result is not None

    def get_table_columns(self, table_name: str) -> List[Dict[str, str]]:
        result = self._conn.execute(f"PRAGMA table_info('{table_name}')").fetchall()
        return [{"name": col[1], "type": col[2]} for col in result]

    def list_tables(self) -> List[str]:
        result = self._conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        return [row[0] for row in result]

    def close(self) -> None:
        if self._conn:
            self._conn.close()


duckdb_manager = DuckDBManager()
