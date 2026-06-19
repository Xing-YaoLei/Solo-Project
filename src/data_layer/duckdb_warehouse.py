import os
from typing import Optional, Dict, Any, List
import duckdb
import polars as pl
from src.utils.config import DuckDBConfig


class DuckDBWarehouse:
    def __init__(self, config: DuckDBConfig):
        self.config = config
        self._ensure_db_path()
        self.conn = duckdb.connect(config.db_path)
        self._init_tables()

    def _ensure_db_path(self) -> None:
        db_dir = os.path.dirname(self.config.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    def _init_tables(self) -> None:
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS ota_orders (
                order_id VARCHAR PRIMARY KEY,
                package_id VARCHAR,
                channel VARCHAR,
                order_date DATE,
                checkin_date DATE,
                checkout_date DATE,
                nights INTEGER,
                rooms INTEGER,
                guests INTEGER,
                order_amount DECIMAL(10,2),
                paid_amount DECIMAL(10,2),
                order_status VARCHAR,
                payment_status VARCHAR,
                customer_name VARCHAR,
                customer_phone VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS door_lock_records (
                record_id VARCHAR PRIMARY KEY,
                order_id VARCHAR,
                room_id VARCHAR,
                checkin_time TIMESTAMP,
                checkout_time TIMESTAMP,
                guest_name VARCHAR,
                id_card VARCHAR,
                operation_type VARCHAR,
                operator VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                transaction_id VARCHAR PRIMARY KEY,
                order_id VARCHAR,
                transaction_date TIMESTAMP,
                amount DECIMAL(10,2),
                payment_method VARCHAR,
                transaction_status VARCHAR,
                channel_fee DECIMAL(10,2),
                net_amount DECIMAL(10,2),
                remark VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS package_inventory (
                inventory_id VARCHAR PRIMARY KEY,
                package_id VARCHAR,
                date DATE,
                total_rooms INTEGER,
                booked_rooms INTEGER,
                reserved_rooms INTEGER,
                available_rooms INTEGER,
                unit_price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(package_id, date)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS pricing_rules (
                rule_id VARCHAR PRIMARY KEY,
                package_id VARCHAR,
                rule_name VARCHAR,
                rule_type VARCHAR,
                start_date DATE,
                end_date DATE,
                min_nights INTEGER,
                max_nights INTEGER,
                base_price DECIMAL(10,2),
                weekend_surcharge DECIMAL(10,2),
                holiday_surcharge DECIMAL(10,2),
                early_bird_discount DECIMAL(5,2),
                last_minute_discount DECIMAL(5,2),
                long_stay_discount DECIMAL(5,2),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS oversell_records (
                oversell_id VARCHAR PRIMARY KEY,
                package_id VARCHAR,
                order_id VARCHAR,
                oversell_date DATE,
                oversell_rooms INTEGER,
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR DEFAULT 'pending',
                handler VARCHAR,
                handled_at TIMESTAMP,
                handling_result VARCHAR,
                remark VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS conversion_rate_versions (
                version_id VARCHAR PRIMARY KEY,
                version_name VARCHAR,
                version_code VARCHAR,
                description TEXT,
                numerator_formula TEXT,
                denominator_formula TEXT,
                time_range VARCHAR,
                filters TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_by VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                effective_date DATE,
                expiry_date DATE
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS analysis_notes (
                note_id VARCHAR PRIMARY KEY,
                record_type VARCHAR,
                record_id VARCHAR,
                analysis_date DATE,
                analyst VARCHAR,
                content TEXT,
                conclusion TEXT,
                action_items TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> pl.DataFrame:
        if params:
            return self.conn.execute(query, params).pl()
        return self.conn.execute(query).pl()

    def execute_update(self, query: str, params: Optional[Dict[str, Any]] = None) -> int:
        if params:
            result = self.conn.execute(query, params)
        else:
            result = self.conn.execute(query)
        return result.fetchone()[0] if result.description else 0

    def insert_dataframe(self, table_name: str, df: pl.DataFrame) -> None:
        self.conn.register("temp_df", df)
        columns = ", ".join(df.columns)
        self.conn.execute(f"INSERT INTO {table_name} ({columns}) SELECT {columns} FROM temp_df")
        self.conn.unregister("temp_df")

    def upsert_dataframe(self, table_name: str, df: pl.DataFrame, conflict_columns: List[str]) -> None:
        temp_table = f"temp_{table_name}"
        self.conn.register(temp_table, df)

        conflict_cols = ", ".join(conflict_columns)
        update_cols = [col for col in df.columns if col not in conflict_columns]
        update_set = ", ".join([f"{col} = excluded.{col}" for col in update_cols])

        query = f"""
            INSERT INTO {table_name} SELECT * FROM {temp_table}
            ON CONFLICT ({conflict_cols}) DO UPDATE SET {update_set}
        """
        self.conn.execute(query)
        self.conn.unregister(temp_table)

    def close(self) -> None:
        self.conn.close()
