"""
DuckDB 数据层：负责建表、数据持久化、SQL 查询
"""
import os
import logging
from typing import Optional, Dict, Any
import duckdb
import polars as pl
from src.config import config

logger = logging.getLogger(__name__)


class DuckDBManager:
    """DuckDB 管理器，封装连接和常用操作"""

    TABLE_SQLS: Dict[str, str] = {
        "reviews": """
            CREATE TABLE IF NOT EXISTS reviews (
                review_id VARCHAR PRIMARY KEY,
                customer_id VARCHAR NOT NULL,
                store_id VARCHAR NOT NULL,
                order_id VARCHAR,
                service_name VARCHAR,
                technician_name VARCHAR,
                rating INTEGER,
                review_content VARCHAR,
                tags VARCHAR,
                service_date DATE,
                review_submit_date TIMESTAMP,
                sync_date TIMESTAMP,
                is_delayed BOOLEAN DEFAULT FALSE,
                delay_hours DOUBLE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "inventory": """
            CREATE TABLE IF NOT EXISTS inventory (
                inventory_id VARCHAR PRIMARY KEY,
                material_code VARCHAR NOT NULL,
                material_name VARCHAR NOT NULL,
                category VARCHAR,
                unit VARCHAR,
                stock_quantity DOUBLE,
                unit_price DOUBLE,
                supplier_name VARCHAR,
                purchase_date DATE,
                expiry_date DATE,
                store_id VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "cashier_transactions": """
            CREATE TABLE IF NOT EXISTS cashier_transactions (
                transaction_id VARCHAR PRIMARY KEY,
                customer_id VARCHAR NOT NULL,
                store_id VARCHAR NOT NULL,
                order_id VARCHAR NOT NULL,
                transaction_type VARCHAR NOT NULL,
                amount DOUBLE NOT NULL,
                payment_method VARCHAR,
                recharge_card_type VARCHAR,
                recharge_card_value DOUBLE,
                service_name VARCHAR,
                technician_name VARCHAR,
                transaction_date TIMESTAMP NOT NULL,
                remark VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "course_items": """
            CREATE TABLE IF NOT EXISTS course_items (
                course_id VARCHAR PRIMARY KEY,
                customer_id VARCHAR NOT NULL,
                store_id VARCHAR NOT NULL,
                course_name VARCHAR NOT NULL,
                total_sessions INTEGER NOT NULL,
                used_sessions INTEGER DEFAULT 0,
                remaining_sessions INTEGER,
                purchase_date DATE,
                expiry_date DATE,
                unit_price DOUBLE,
                total_amount DOUBLE,
                assigned_technician VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "material_usage": """
            CREATE TABLE IF NOT EXISTS material_usage (
                usage_id VARCHAR PRIMARY KEY,
                store_id VARCHAR NOT NULL,
                order_id VARCHAR NOT NULL,
                service_name VARCHAR,
                material_code VARCHAR NOT NULL,
                material_name VARCHAR NOT NULL,
                usage_quantity DOUBLE NOT NULL,
                standard_usage_quantity DOUBLE,
                usage_ratio DOUBLE,
                unit VARCHAR,
                transaction_date DATE NOT NULL,
                customer_id VARCHAR,
                technician_name VARCHAR,
                is_abnormal BOOLEAN DEFAULT FALSE,
                anomaly_reason VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "risk_alerts": """
            CREATE TABLE IF NOT EXISTS risk_alerts (
                alert_id VARCHAR PRIMARY KEY,
                alert_type VARCHAR NOT NULL,
                alert_level VARCHAR NOT NULL,
                store_id VARCHAR,
                customer_id VARCHAR,
                order_id VARCHAR,
                related_data VARCHAR,
                triggered_value DOUBLE,
                threshold_value DOUBLE,
                alert_message VARCHAR,
                is_resolved BOOLEAN DEFAULT FALSE,
                trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "customer_visit_stats": """
            CREATE TABLE IF NOT EXISTS customer_visit_stats (
                stat_id VARCHAR PRIMARY KEY,
                customer_id VARCHAR NOT NULL,
                store_id VARCHAR NOT NULL,
                stat_period VARCHAR NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                total_visits INTEGER,
                total_spent DOUBLE,
                course_consumption_rate DOUBLE,
                avg_rating DOUBLE,
                negative_review_count INTEGER,
                days_since_last_visit INTEGER,
                is_risk_customer BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
    }

    def __init__(self):
        self._conn: Optional[duckdb.DuckDBPyConnection] = None
        self._initialize_db_directory()

    def _initialize_db_directory(self) -> None:
        """确保数据库目录存在"""
        db_dir = os.path.dirname(config.duckdb.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        if self._conn is None:
            self._connect()
        return self._conn

    def _connect(self) -> None:
        """建立 DuckDB 连接并初始化表结构

        支持被其他进程锁定时的自动重试（最多 5 秒）。
        """
        import time
        max_wait = 5.0
        start = time.time()
        last_err = None
        while True:
            try:
                self._conn = duckdb.connect(config.duckdb.db_path)
                self._create_tables()
                logger.info("DuckDB 连接成功: %s", config.duckdb.db_path)
                return
            except Exception as e:
                last_err = e
                if "lock" not in str(e).lower() or (time.time() - start) > max_wait:
                    break
                logger.debug("DuckDB 被锁定，重试中... (%s)", str(e)[:80])
                time.sleep(0.3)
        logger.error("DuckDB 连接失败: %s", last_err)
        raise

    def _create_tables(self) -> None:
        """创建所有核心业务表，并对已存在的表做 schema 迁移（补齐新列）"""
        for table_name, sql in self.TABLE_SQLS.items():
            try:
                self._conn.execute(sql)
                self._migrate_table_schema(table_name)
                logger.debug("表已就绪: %s", table_name)
            except Exception as e:
                logger.error("建表失败 %s: %s", table_name, e)
                raise

    TABLE_SCHEMA_MIGRATIONS: Dict[str, List[str]] = {
        "material_usage": [
            "ALTER TABLE material_usage ADD COLUMN IF NOT EXISTS usage_ratio DOUBLE",
        ],
    }

    def _migrate_table_schema(self, table_name: str) -> None:
        """对已存在的表执行 schema 迁移，确保新列可用"""
        migrations = self.TABLE_SCHEMA_MIGRATIONS.get(table_name, [])
        if not migrations:
            return
        for sql in migrations:
            try:
                self._conn.execute(sql)
                logger.info("Schema 迁移执行成功: %s", sql)
            except Exception as e:
                logger.debug("Schema 迁移可能已执行，跳过: %s (%s)", sql, e)

    def close(self) -> None:
        """关闭连接"""
        if self._conn:
            self._conn.close()
            self._conn = None
            logger.info("DuckDB 连接已关闭")

    def execute(self, sql: str, params: Optional[list] = None) -> duckdb.DuckDBPyConnection:
        """执行 SQL 语句"""
        try:
            if params:
                return self.conn.execute(sql, params)
            return self.conn.execute(sql)
        except Exception as e:
            logger.error("SQL 执行失败: %s\nSQL: %s", e, sql)
            raise

    def query(self, sql: str, params: Optional[list] = None) -> pl.DataFrame:
        """执行查询并返回 Polars DataFrame"""
        try:
            if params:
                result = self.conn.execute(sql, params)
            else:
                result = self.conn.execute(sql)
            return pl.from_arrow(result.fetch_arrow_table())
        except Exception as e:
            logger.error("查询失败: %s\nSQL: %s", e, sql)
            raise

    def query_one(self, sql: str, params: Optional[list] = None) -> Optional[Dict[str, Any]]:
        """执行查询并返回单行字典"""
        df = self.query(sql, params)
        if df.height == 0:
            return None
        return df.row(0, named=True)

    def insert_dataframe(self, table_name: str, df: pl.DataFrame, if_exists: str = "append") -> int:
        """将 Polars DataFrame 写入指定表

        Args:
            table_name: 目标表名
            df: 待写入的 DataFrame
            if_exists: append / replace / upsert

        Notes:
            - 在写入前自动调用 align_dataframe_to_table：
              * 补齐缺失的业务默认列（如 is_abnormal、is_delayed）
              * 过滤掉数据库有 DEFAULT 约束的列（如 created_at、trigger_date），让数据库自动填充
              * 按表定义列顺序重排，过滤多余列
        """
        try:
            df = self.align_dataframe_to_table(table_name, df)

            if df.height == 0:
                logger.info("DataFrame 为空，跳过写入 %s", table_name)
                return 0

            if if_exists == "replace":
                self.execute(f"DELETE FROM {table_name}")
            elif if_exists == "upsert":
                pk_cols = self._get_primary_key_columns(table_name)
                if pk_cols:
                    temp_table = f"temp_{table_name}"
                    self.conn.register(temp_table, df.to_arrow())
                    delete_cond = " AND ".join(
                        [f"{table_name}.{col} = {temp_table}.{col}" for col in pk_cols]
                    )
                    self.execute(
                        f"DELETE FROM {table_name} USING {temp_table} WHERE {delete_cond}"
                    )
                    columns = ", ".join([f'"{c}"' for c in df.columns])
                    self.execute(f"INSERT INTO {table_name} ({columns}) SELECT {columns} FROM {temp_table}")
                    self.conn.unregister(temp_table)
                    logger.info("Upsert 写入 %d 行到 %s", df.height, table_name)
                    return df.height

            arrow_table = df.to_arrow()
            self.conn.register("__temp_insert_df__", arrow_table)
            columns = ", ".join([f'"{c}"' for c in df.columns])
            self.execute(f"INSERT INTO {table_name} ({columns}) SELECT {columns} FROM __temp_insert_df__")
            self.conn.unregister("__temp_insert_df__")
            logger.info("写入 %d 行到 %s", df.height, table_name)
            return df.height
        except Exception as e:
            logger.error("写入表 %s 失败: %s", table_name, e)
            raise

    def _get_primary_key_columns(self, table_name: str) -> list:
        """获取表的主键列（从创建语句中解析）"""
        sql = self.TABLE_SQLS.get(table_name, "")
        if "PRIMARY KEY" not in sql:
            return []
        import re
        match = re.search(r"PRIMARY KEY \(([^)]+)\)", sql)
        if match:
            return [col.strip().replace('"', "") for col in match.group(1).split(",")]
        single_pk = re.search(r"(\w+)\s+\w+\s+PRIMARY KEY", sql)
        if single_pk:
            return [single_pk.group(1)]
        return []

    def get_table_columns(self, table_name: str) -> list:
        """获取表的列名列表"""
        try:
            result = self.query(
                f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' ORDER BY ordinal_position"
            )
            return result["column_name"].to_list()
        except Exception:
            return []

    TABLE_DEFAULT_COLUMNS: Dict[str, Dict[str, Any]] = {
        "reviews": {
            "is_delayed": False,
            "delay_hours": 0.0,
        },
        "inventory": {},
        "cashier_transactions": {},
        "course_items": {},
        "material_usage": {
            "is_abnormal": False,
            "usage_ratio": None,
        },
        "risk_alerts": {
            "is_resolved": False,
        },
        "customer_visit_stats": {
            "is_risk_customer": False,
        },
    }

    TABLE_HAS_DB_DEFAULT: Dict[str, set] = {
        "reviews": {"created_at"},
        "inventory": {"created_at"},
        "cashier_transactions": {"created_at"},
        "course_items": {"created_at"},
        "material_usage": {"created_at"},
        "risk_alerts": {"trigger_date", "created_at"},
        "customer_visit_stats": {"created_at"},
    }

    def _get_nullable_columns_without_default(self, table_name: str) -> list:
        """获取表中可空且没有 DEFAULT 约束的列名"""
        try:
            result = self.query(
                f"""SELECT column_name FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                      AND is_nullable = 'YES'
                      AND column_default IS NULL"""
            )
            return result["column_name"].to_list()
        except Exception:
            return []

    def align_dataframe_to_table(self, table_name: str, df: pl.DataFrame) -> pl.DataFrame:
        """补齐 DataFrame 中缺失的表默认列，确保与表结构对齐

        策略：
        - 有明确默认值的列（bool/int/float/str）：在 DataFrame 中补齐
        - 有 DuckDB DEFAULT 约束的列（如 created_at）：不添加，由 DB 填充
        - 可空且无 DEFAULT 的列（如 anomaly_reason）：补 null
        """
        defaults = self.TABLE_DEFAULT_COLUMNS.get(table_name, {})
        db_default_cols = self.TABLE_HAS_DB_DEFAULT.get(table_name, set())
        nullable_no_default = self._get_nullable_columns_without_default(table_name)

        for col, default_val in defaults.items():
            if col not in df.columns and default_val is not None:
                if isinstance(default_val, bool):
                    df = df.with_columns(pl.lit(default_val).alias(col))
                elif isinstance(default_val, float):
                    df = df.with_columns(pl.lit(default_val).cast(pl.Float64).alias(col))
                elif isinstance(default_val, int):
                    df = df.with_columns(pl.lit(default_val).cast(pl.Int64).alias(col))
                elif isinstance(default_val, str):
                    df = df.with_columns(pl.lit(default_val).alias(col))

        table_cols = self.get_table_columns(table_name)
        col_types = self._get_column_types(table_name)
        for col in nullable_no_default:
            if col not in df.columns and col not in db_default_cols:
                dtype = col_types.get(col, "VARCHAR")
                if "INT" in dtype.upper():
                    df = df.with_columns(pl.lit(None).cast(pl.Int64).alias(col))
                elif "DOUBLE" in dtype.upper() or "FLOAT" in dtype.upper():
                    df = df.with_columns(pl.lit(None).cast(pl.Float64).alias(col))
                elif "BOOL" in dtype.upper():
                    df = df.with_columns(pl.lit(None).cast(pl.Boolean).alias(col))
                elif "TIMESTAMP" in dtype.upper() or "DATE" in dtype.upper():
                    df = df.with_columns(pl.lit(None).cast(pl.Datetime("us")).alias(col))
                else:
                    df = df.with_columns(pl.lit(None).cast(pl.Utf8).alias(col))

        ordered_cols = [c for c in table_cols if c in df.columns]
        extra_cols = [c for c in df.columns if c not in table_cols]
        if extra_cols:
            logger.warning("DataFrame 包含表 %s 中不存在的列，将忽略: %s", table_name, extra_cols)
        return df.select(ordered_cols)

    def _get_column_types(self, table_name: str) -> Dict[str, str]:
        """获取表的列名→类型映射"""
        try:
            result = self.query(
                f"""SELECT column_name, data_type FROM information_schema.columns
                    WHERE table_name = '{table_name}' ORDER BY ordinal_position"""
            )
            return dict(zip(result["column_name"].to_list(), result["data_type"].to_list()))
        except Exception:
            return {}

    def table_exists(self, table_name: str) -> bool:
        """检查表是否存在"""
        try:
            result = self.query(
                f"SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_name = '{table_name}'"
            )
            return result["cnt"][0] > 0
        except Exception:
            return False

    def get_table_row_count(self, table_name: str) -> int:
        """获取表行数"""
        try:
            result = self.query(f"SELECT COUNT(*) as cnt FROM {table_name}")
            return result["cnt"][0]
        except Exception:
            return 0

    def vacuum(self) -> None:
        """执行数据库清理优化"""
        try:
            self.execute("VACUUM")
            self.execute("CHECKPOINT")
            logger.info("数据库 VACUUM 完成")
        except Exception as e:
            logger.error("VACUUM 失败: %s", e)


duckdb_manager = DuckDBManager()
