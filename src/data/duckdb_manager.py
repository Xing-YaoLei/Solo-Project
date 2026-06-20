import duckdb
import polars as pl
import os
from src.utils.config import Config


class DuckDBManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_conn()
        return cls._instance

    def _init_conn(self):
        data_dir = Config.ensure_data_dir()
        ext_dir = os.path.join(data_dir, ".duckdb_extensions")
        os.makedirs(ext_dir, exist_ok=True)

        config = {"extension_directory": ext_dir}
        self.conn = duckdb.connect(Config.DUCKDB_PATH, config=config)
        self._install_extensions()

    def _install_extensions(self):
        try:
            self.conn.execute("INSTALL httpfs;")
            self.conn.execute("LOAD httpfs;")
        except Exception:
            pass

    def close(self):
        self.conn.close()

    def query(self, sql: str) -> pl.DataFrame:
        return pl.from_arrow(self.conn.execute(sql).fetch_arrow_table())

    def query_pandas(self, sql: str):
        return self.conn.execute(sql).fetchdf()

    def execute(self, sql: str):
        self.conn.execute(sql)

    def create_table_from_polars(self, table_name: str, df: pl.DataFrame, if_exists="replace"):
        if if_exists == "replace":
            self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM df")
        return table_name

    def create_table_from_csv(self, table_name: str, csv_path: str, if_exists="replace"):
        if if_exists == "replace":
            self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        self.conn.execute(
            f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{csv_path}')"
        )
        return table_name

    def table_exists(self, table_name: str) -> bool:
        result = self.conn.execute(
            f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'"
        ).fetchone()
        return result is not None

    def list_tables(self) -> list:
        result = self.conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        return [row[0] for row in result]

    def get_row_count(self, table_name: str) -> int:
        result = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
        return result[0] if result else 0
