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
        """建立 DuckDB 连接并初始化表结构"""
        try:
            self._conn = duckdb.connect(config.duckdb.db_path)
            self._create_tables()
            logger.info("DuckDB 连接成功: %s", config.duckdb.db_path)
        except Exception as e:
            logger.error("DuckDB 连接失败: %s", e)
            raise

    def _create_tables(self) -> None:
        """创建所有核心业务表"""
        for table_name, sql in self.TABLE_SQLS.items():
            try:
                self._conn.execute(sql)
                logger.debug("表已就绪: %s", table_name)
            except Exception as e:
                logger.error("建表失败 %s: %s", table_name, e)
                raise

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
        """将 Polars DataFrame 写入指定表"""
        try:
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
                    self.execute(f"INSERT INTO {table_name} SELECT * FROM {temp_table}")
                    self.conn.unregister(temp_table)
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
