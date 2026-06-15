import duckdb
import polars as pl
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from config import settings, setup_logger

logger = setup_logger()


class DatabaseManager:
    _instance = None
    _conn = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._conn is None:
            self._connect()
            self._init_tables()

    def _connect(self):
        max_retries = 5
        import os
        
        for attempt in range(max_retries):
            try:
                config = {
                    "threads": "4",
                    "memory_limit": "2GB",
                    "preserve_insertion_order": "false",
                }
                try:
                    self._conn = duckdb.connect(
                        settings.DUCKDB_PATH,
                        config=config
                    )
                    logger.info(f"成功连接到DuckDB数据库: {settings.DUCKDB_PATH}")
                    return
                except Exception as e:
                    if "lock" in str(e).lower() or "conflict" in str(e).lower():
                        logger.warning(f"数据库被锁定，尝试使用只读模式连接: {e}")
                        read_only_config = config.copy()
                        read_only_config["access_mode"] = "read_only"
                        try:
                            self._conn = duckdb.connect(
                                settings.DUCKDB_PATH,
                                config=read_only_config
                            )
                            logger.info(f"成功以只读模式连接到DuckDB数据库: {settings.DUCKDB_PATH}")
                            return
                        except Exception as roe:
                            logger.warning(f"只读模式连接也失败，尝试复制数据库: {roe}")
                            db_path = settings.DUCKDB_PATH
                            backup_path = f"{db_path}.backup"
                            if os.path.exists(db_path):
                                import shutil
                                shutil.copy2(db_path, backup_path)
                                self._conn = duckdb.connect(
                                    backup_path,
                                    config=config
                                )
                                logger.info(f"成功连接到数据库备份: {backup_path}")
                                return
                    raise
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"连接失败，{wait_time}秒后重试 (第{attempt + 1}/{max_retries}次): {e}")
                    import time
                    time.sleep(wait_time)
                else:
                    logger.error(f"连接DuckDB数据库失败: {e}")
                    raise

    def _init_tables(self):
        ddl_path = "sql/ddl.sql"
        try:
            with open(ddl_path, "r", encoding="utf-8") as f:
                ddl_sql = f.read()
            self.execute(ddl_sql)
            logger.info("数据库表初始化完成")
        except FileNotFoundError:
            logger.warning(f"DDL文件未找到: {ddl_path}")
        except Exception as e:
            logger.error(f"初始化数据库表失败: {e}")

    @contextmanager
    def connection(self):
        if self._conn is None:
            self._connect()
        try:
            yield self._conn
        except Exception as e:
            logger.error(f"数据库操作异常: {e}")
            raise

    def execute(self, sql: str, params: Optional[Dict] = None) -> None:
        with self.connection() as conn:
            if params:
                conn.execute(sql, params)
            else:
                conn.execute(sql)

    def query(self, sql: str, params: Optional[Dict] = None) -> pl.DataFrame:
        with self.connection() as conn:
            if params:
                result = conn.execute(sql, params).pl()
            else:
                result = conn.execute(sql).pl()
            return result

    def query_pandas(self, sql: str, params: Optional[Dict] = None):
        with self.connection() as conn:
            if params:
                result = conn.execute(sql, params).df()
            else:
                result = conn.execute(sql).df()
            return result

    def insert_dataframe(self, table_name: str, df: pl.DataFrame) -> int:
        if df.is_empty():
            logger.warning(f"插入数据为空，跳过表 {table_name}")
            return 0

        with self.connection() as conn:
            conn.register("temp_df", df)
            sql = f"INSERT INTO {table_name} SELECT * FROM temp_df"
            conn.execute(sql)
            conn.unregister("temp_df")
            logger.info(f"成功插入 {len(df)} 条记录到表 {table_name}")
            return len(df)

    def create_table_from_df(self, table_name: str, df: pl.DataFrame, overwrite: bool = False) -> None:
        mode = "replace" if overwrite else "append"
        with self.connection() as conn:
            conn.register("temp_df", df)
            if overwrite:
                conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_df")
            conn.unregister("temp_df")
            logger.info(f"成功创建表 {table_name}，包含 {len(df)} 条记录")

    def count(self, table_name: str, where_clause: str = "") -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {table_name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        result = self.query(sql)
        return result["cnt"][0]

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
            logger.info("数据库连接已关闭")


db = DatabaseManager()
