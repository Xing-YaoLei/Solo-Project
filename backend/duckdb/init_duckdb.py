import os
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List, Type, TypeVar
from pathlib import Path

import duckdb
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class DatabaseConfig:
    pg_host: str = field(default_factory=lambda: os.getenv("PG_HOST", "localhost"))
    pg_port: str = field(default_factory=lambda: os.getenv("PG_PORT", "5432"))
    pg_db: str = field(default_factory=lambda: os.getenv("PG_DB", "lawfirm_db"))
    pg_user: str = field(default_factory=lambda: os.getenv("PG_USER", "postgres"))
    pg_password: str = field(default_factory=lambda: os.getenv("PG_PASSWORD", "postgres"))
    duckdb_path: str = field(
        default_factory=lambda: os.getenv(
            "DUCKDB_PATH",
            str(Path(__file__).parent / "analytics.duckdb"),
        )
    )


@dataclass
class SyncResult:
    table_name: str
    records_count: int
    status: str
    error_message: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


@dataclass
class QueryResult:
    data: List[Dict[str, Any]]
    updated_at: datetime
    total: int
    filters: Dict[str, Any]


class DuckDBConnectionError(Exception):
    pass


class PostgreSQLConnectionError(Exception):
    pass


class DataSyncError(Exception):
    pass


class DuckDBInitializer:
    TABLES_TO_SYNC = [
        "users",
        "cases",
        "invoices",
        "invoice_items",
        "contract_attachments",
        "approval_nodes",
        "payment_schedules",
        "email_attachments",
        "data_sync_logs",
    ]

    def __init__(self, config: Optional[DatabaseConfig] = None) -> None:
        self.config = config or DatabaseConfig()
        self._duckdb_conn: Optional[duckdb.DuckDBPyConnection] = None
        self._pg_conn: Optional[psycopg2.extensions.connection] = None
        self._sync_results: List[SyncResult] = []

    def __enter__(self) -> "DuckDBInitializer":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def _get_pg_connection(self) -> psycopg2.extensions.connection:
        if self._pg_conn is None or self._pg_conn.closed:
            try:
                self._pg_conn = psycopg2.connect(
                    host=self.config.pg_host,
                    port=self.config.pg_port,
                    dbname=self.config.pg_db,
                    user=self.config.pg_user,
                    password=self.config.pg_password,
                )
                logger.info("PostgreSQL 连接成功")
            except psycopg2.Error as e:
                logger.error(f"PostgreSQL 连接失败: {e}")
                raise PostgreSQLConnectionError(f"无法连接到 PostgreSQL: {e}") from e
        return self._pg_conn

    def _get_duckdb_connection(self) -> duckdb.DuckDBPyConnection:
        if self._duckdb_conn is None:
            try:
                self._duckdb_conn = duckdb.connect(self.config.duckdb_path)
                self._duckdb_conn.execute("SET timezone = 'Asia/Shanghai'")
                logger.info(f"DuckDB 连接成功: {self.config.duckdb_path}")
            except duckdb.Error as e:
                logger.error(f"DuckDB 连接失败: {e}")
                raise DuckDBConnectionError(f"无法连接到 DuckDB: {e}") from e
        return self._duckdb_conn

    def _sync_table(self, table_name: str) -> SyncResult:
        result = SyncResult(table_name=table_name, records_count=0, status="pending")
        try:
            pg_conn = self._get_pg_connection()
            duckdb_conn = self._get_duckdb_connection()

            with pg_conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM {table_name}")
                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

            result.records_count = len(rows)

            duckdb_conn.execute(f"DROP TABLE IF EXISTS {table_name}")

            if rows:
                placeholders = ", ".join(["?" for _ in columns])
                col_names = ", ".join(columns)
                insert_sql = f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})"

                duckdb_conn.execute(
                    f"CREATE TABLE {table_name} AS SELECT * FROM (VALUES {placeholders}) LIMIT 0",
                    tuple(rows[0].values()),
                )

                data_tuples = [tuple(row.values()) for row in rows]
                duckdb_conn.executemany(insert_sql, data_tuples)

            result.status = "success"
            logger.info(f"同步表 {table_name} 完成，共 {result.records_count} 条记录")

        except (psycopg2.Error, duckdb.Error) as e:
            result.status = "failed"
            result.error_message = str(e)
            logger.error(f"同步表 {table_name} 失败: {e}")
            raise DataSyncError(f"同步表 {table_name} 失败: {e}") from e
        finally:
            result.completed_at = datetime.now()
            self._sync_results.append(result)

        return result

    def sync_from_postgres(self, tables: Optional[List[str]] = None) -> List[SyncResult]:
        tables_to_sync = tables or self.TABLES_TO_SYNC
        logger.info(f"开始从 PostgreSQL 同步数据，表数量: {len(tables_to_sync)}")

        self._sync_results = []
        for table in tables_to_sync:
            self._sync_table(table)

        self._log_sync_results()
        return self._sync_results

    def _log_sync_results(self) -> None:
        success_count = sum(1 for r in self._sync_results if r.status == "success")
        failed_count = sum(1 for r in self._sync_results if r.status == "failed")
        total_records = sum(r.records_count for r in self._sync_results)

        logger.info(
            f"数据同步完成: 成功 {success_count} 表, "
            f"失败 {failed_count} 表, 总记录数 {total_records}"
        )

    def create_views(self) -> None:
        duckdb_conn = self._get_duckdb_connection()
        views_dir = Path(__file__).parent.parent / "migrations"
        views_file = views_dir / "003_duckdb_views.sql"

        if not views_file.exists():
            logger.warning(f"视图文件不存在: {views_file}")
            return

        try:
            with open(views_file, "r", encoding="utf-8") as f:
                sql_content = f.read()

            statements = _split_sql_statements(sql_content)

            for stmt in statements:
                stmt = stmt.strip()
                if stmt and not stmt.startswith("--"):
                    try:
                        duckdb_conn.execute(stmt)
                        logger.info("视图创建/更新成功")
                    except duckdb.Error as e:
                        logger.warning(f"执行SQL语句失败: {e}\nSQL: {stmt[:100]}...")

            logger.info("所有分析视图创建完成")

        except Exception as e:
            logger.error(f"创建视图失败: {e}")
            raise

    def initialize(self, sync: bool = True, create_views: bool = True) -> None:
        logger.info("开始初始化 DuckDB 分析层")
        try:
            if sync:
                self.sync_from_postgres()
            if create_views:
                self.create_views()
            logger.info("DuckDB 分析层初始化完成")
        except Exception as e:
            logger.error(f"DuckDB 初始化失败: {e}")
            raise

    def execute_query(
        self,
        query: str,
        params: Optional[tuple] = None,
        model_class: Optional[Type[T]] = None,
    ) -> List[Dict[str, Any]]:
        duckdb_conn = self._get_duckdb_connection()
        try:
            if params:
                result = duckdb_conn.execute(query, params)
            else:
                result = duckdb_conn.execute(query)

            columns = [desc[0] for desc in result.description]
            rows = result.fetchall()

            return [dict(zip(columns, row)) for row in rows]

        except duckdb.Error as e:
            logger.error(f"执行查询失败: {e}\nQuery: {query}")
            raise

    def close(self) -> None:
        if self._duckdb_conn:
            self._duckdb_conn.close()
            self._duckdb_conn = None
            logger.info("DuckDB 连接已关闭")

        if self._pg_conn:
            self._pg_conn.close()
            self._pg_conn = None
            logger.info("PostgreSQL 连接已关闭")

    def get_sync_history(self) -> List[SyncResult]:
        return self._sync_results.copy()


def _split_sql_statements(sql_content: str) -> List[str]:
    statements: List[str] = []
    current_stmt = ""
    in_string = False
    string_char = ""
    i = 0

    while i < len(sql_content):
        char = sql_content[i]

        if char in ("'", '"') and (i == 0 or sql_content[i - 1] != "\\"):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
            current_stmt += char

        elif char == ";" and not in_string:
            current_stmt += char
            statements.append(current_stmt.strip())
            current_stmt = ""

        else:
            current_stmt += char

        i += 1

    if current_stmt.strip():
        statements.append(current_stmt.strip())

    return statements


_global_initializer: Optional[DuckDBInitializer] = None


def get_duckdb_connection(
    config: Optional[DatabaseConfig] = None,
) -> DuckDBInitializer:
    global _global_initializer
    if _global_initializer is None:
        _global_initializer = DuckDBInitializer(config)
    return _global_initializer


def initialize_duckdb(
    config: Optional[DatabaseConfig] = None,
    sync: bool = True,
    create_views: bool = True,
) -> DuckDBInitializer:
    initializer = get_duckdb_connection(config)
    initializer.initialize(sync=sync, create_views=create_views)
    return initializer


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    initializer = DuckDBInitializer()
    try:
        initializer.initialize()
    finally:
        initializer.close()
