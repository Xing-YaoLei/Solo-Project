import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, date

import duckdb
import polars as pl

from .config import DuckDBConfig

logger = logging.getLogger(__name__)


class DuckDBManager:
    def __init__(self, config: DuckDBConfig):
        self.config = config
        self.conn: Optional[duckdb.DuckDBPyConnection] = None
        self._connect()
        self._init_tables()

    def _connect(self):
        db_path = str(self.config.db_path)
        logger.info(f"Connecting to DuckDB at {db_path}")
        self.conn = duckdb.connect(db_path)

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("DuckDB connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def _init_tables(self):
        init_sql = """
        CREATE TABLE IF NOT EXISTS etl_batches (
            batch_id VARCHAR PRIMARY KEY,
            data_type VARCHAR NOT NULL,
            source_file VARCHAR,
            row_count INTEGER,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_time TIMESTAMP,
            status VARCHAR DEFAULT 'uploaded',
            metadata JSON,
            UNIQUE(batch_id, data_type)
        );

        CREATE TABLE IF NOT EXISTS inventory (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            product_code VARCHAR,
            product_name VARCHAR,
            category VARCHAR,
            stock_quantity INTEGER,
            unit_price DECIMAL(10, 2),
            cost_price DECIMAL(10, 2),
            supplier VARCHAR,
            expiry_date DATE,
            store VARCHAR,
            is_consumable BOOLEAN DEFAULT FALSE,
            anomaly_flag BOOLEAN DEFAULT FALSE,
            anomaly_note VARCHAR,
            updated_at TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            customer_id VARCHAR,
            customer_name VARCHAR,
            order_id VARCHAR,
            rating INTEGER,
            review_tags VARCHAR[],
            review_text VARCHAR,
            technician VARCHAR,
            service_item VARCHAR,
            store VARCHAR,
            review_date DATE,
            sentiment_score DECIMAL(5, 4),
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            customer_id VARCHAR,
            customer_name VARCHAR,
            phone VARCHAR,
            appointment_date DATE,
            appointment_time TIME,
            service_item VARCHAR,
            category VARCHAR,
            technician VARCHAR,
            store VARCHAR,
            status VARCHAR,
            check_in_time TIMESTAMP,
            check_out_time TIMESTAMP,
            actual_amount DECIMAL(10, 2),
            card_used VARCHAR,
            is_member BOOLEAN,
            attended BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS recharge_transactions (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            customer_id VARCHAR,
            customer_name VARCHAR,
            phone VARCHAR,
            recharge_date DATE,
            recharge_amount DECIMAL(10, 2),
            gift_amount DECIMAL(10, 2),
            payment_method VARCHAR,
            store VARCHAR,
            sales_staff VARCHAR,
            card_type VARCHAR,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS service_cards (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            card_code VARCHAR,
            card_name VARCHAR,
            category VARCHAR,
            total_sessions INTEGER,
            used_sessions INTEGER DEFAULT 0,
            remaining_sessions INTEGER,
            original_price DECIMAL(10, 2),
            sale_price DECIMAL(10, 2),
            customer_id VARCHAR,
            purchase_date DATE,
            expiry_date DATE,
            store VARCHAR,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS technician_schedules (
            id BIGINT PRIMARY KEY,
            batch_id VARCHAR,
            technician VARCHAR,
            schedule_date DATE,
            shift_type VARCHAR,
            start_time TIME,
            end_time TIME,
            store VARCHAR,
            is_leave BOOLEAN DEFAULT FALSE,
            leave_reason VARCHAR,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS inventory_anomaly_notes (
            id BIGINT PRIMARY KEY,
            inventory_id BIGINT,
            batch_id VARCHAR,
            product_code VARCHAR,
            product_name VARCHAR,
            anomaly_type VARCHAR,
            note_text VARCHAR,
            created_by VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved BOOLEAN DEFAULT FALSE,
            resolved_at TIMESTAMP,
            resolved_note VARCHAR,
            FOREIGN KEY (inventory_id) REFERENCES inventory(id),
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE TABLE IF NOT EXISTS attendance_rate_metrics (
            id BIGINT PRIMARY KEY,
            metric_date DATE,
            technician VARCHAR,
            store VARCHAR,
            total_appointments INTEGER,
            attended_count INTEGER,
            attendance_rate DECIMAL(6, 4),
            target_rate DECIMAL(6, 4),
            yoy_rate DECIMAL(6, 4),
            mom_rate DECIMAL(6, 4),
            batch_id VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES etl_batches(batch_id)
        );

        CREATE SEQUENCE IF NOT EXISTS seq_inventory_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_reviews_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_appointments_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_recharge_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_service_cards_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_schedules_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_anomaly_notes_id START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_attendance_metrics_id START 1;
        """
        self.conn.execute(init_sql)
        logger.info("Database tables initialized")

    def register_batch(self, batch_id: str, data_type: str, source_file: str,
                       row_count: int, metadata: Optional[Dict[str, Any]] = None) -> None:
        import json
        meta_json = json.dumps(metadata, ensure_ascii=False) if metadata else None
        self.conn.execute("""
            INSERT INTO etl_batches (batch_id, data_type, source_file, row_count, metadata)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (batch_id, data_type) DO UPDATE SET
                row_count = EXCLUDED.row_count,
                upload_time = CURRENT_TIMESTAMP,
                status = 'uploaded',
                metadata = EXCLUDED.metadata
        """, [batch_id, data_type, source_file, row_count, meta_json])
        logger.info(f"Registered batch: {batch_id} ({data_type})")

    def mark_batch_processed(self, batch_id: str, data_type: str) -> None:
        self.conn.execute("""
            UPDATE etl_batches
            SET status = 'processed', processed_time = CURRENT_TIMESTAMP
            WHERE batch_id = ? AND data_type = ?
        """, [batch_id, data_type])

    def list_batches(self, data_type: Optional[str] = None, status: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM etl_batches"
        conditions = []
        params = []
        if data_type:
            conditions.append("data_type = ?")
            params.append(data_type)
        if status:
            conditions.append("status = ?")
            params.append(status)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY upload_time DESC"
        return self.conn.execute(sql, params).pl()

    def get_batch_data(self, batch_id: str, data_type: str) -> Optional[pl.DataFrame]:
        table_map = {
            "inventory": "inventory",
            "reviews": "reviews",
            "appointments": "appointments",
            "recharge": "recharge_transactions",
            "service_cards": "service_cards",
            "schedules": "technician_schedules",
        }
        table = table_map.get(data_type)
        if not table:
            return None
        return self.conn.execute(
            f"SELECT * FROM {table} WHERE batch_id = ?",
            [batch_id]
        ).pl()

    def insert_inventory(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns([
            pl.lit(batch_id).alias("batch_id"),
            pl.lit(datetime.now()).alias("updated_at"),
        ])
        self.conn.execute("""
            INSERT OR REPLACE INTO inventory
            SELECT * FROM df
        """)
        return len(df)

    def insert_reviews(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns(pl.lit(batch_id).alias("batch_id"))
        self.conn.execute("""
            INSERT OR REPLACE INTO reviews
            SELECT * FROM df
        """)
        return len(df)

    def insert_appointments(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns(pl.lit(batch_id).alias("batch_id"))
        self.conn.execute("""
            INSERT OR REPLACE INTO appointments
            SELECT * FROM df
        """)
        return len(df)

    def insert_recharge(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns(pl.lit(batch_id).alias("batch_id"))
        self.conn.execute("""
            INSERT OR REPLACE INTO recharge_transactions
            SELECT * FROM df
        """)
        return len(df)

    def insert_service_cards(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns(pl.lit(batch_id).alias("batch_id"))
        self.conn.execute("""
            INSERT OR REPLACE INTO service_cards
            SELECT * FROM df
        """)
        return len(df)

    def insert_schedules(self, df: pl.DataFrame, batch_id: str) -> int:
        df = df.with_columns(pl.lit(batch_id).alias("batch_id"))
        self.conn.execute("""
            INSERT OR REPLACE INTO technician_schedules
            SELECT * FROM df
        """)
        return len(df)

    def add_inventory_anomaly_note(self, inventory_id: int, product_code: str,
                                    product_name: str, anomaly_type: str,
                                    note_text: str, created_by: str,
                                    batch_id: Optional[str] = None) -> int:
        next_id = self.conn.execute(
            "SELECT nextval('seq_anomaly_notes_id')"
        ).fetchone()[0]
        self.conn.execute("""
            INSERT INTO inventory_anomaly_notes
            (id, inventory_id, batch_id, product_code, product_name,
             anomaly_type, note_text, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [next_id, inventory_id, batch_id, product_code, product_name,
              anomaly_type, note_text, created_by])
        self.conn.execute("""
            UPDATE inventory SET anomaly_flag = TRUE, anomaly_note = ?
            WHERE id = ?
        """, [note_text, inventory_id])
        return next_id

    def get_inventory_anomalies(self, store: Optional[str] = None,
                                unresolved_only: bool = True) -> pl.DataFrame:
        sql = """
            SELECT n.*, i.stock_quantity, i.category, i.store,
                   i.expiry_date
            FROM inventory_anomaly_notes n
            LEFT JOIN inventory i ON n.inventory_id = i.id
        """
        conditions = []
        params = []
        if store:
            conditions.append("i.store = ?")
            params.append(store)
        if unresolved_only:
            conditions.append("n.resolved = FALSE")
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY n.created_at DESC"
        return self.conn.execute(sql, params).pl()

    def resolve_anomaly(self, note_id: int, resolved_note: str) -> None:
        self.conn.execute("""
            UPDATE inventory_anomaly_notes
            SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP, resolved_note = ?
            WHERE id = ?
        """, [resolved_note, note_id])

    def insert_attendance_metrics(self, df: pl.DataFrame) -> int:
        self.conn.execute("""
            INSERT OR REPLACE INTO attendance_rate_metrics
            SELECT * FROM df
        """)
        return len(df)

    def get_attendance_metrics(self, technician: Optional[str] = None,
                               store: Optional[str] = None,
                               start_date: Optional[date] = None,
                               end_date: Optional[date] = None) -> pl.DataFrame:
        sql = "SELECT * FROM attendance_rate_metrics"
        conditions = []
        params = []
        if technician:
            conditions.append("technician = ?")
            params.append(technician)
        if store:
            conditions.append("store = ?")
            params.append(store)
        if start_date:
            conditions.append("metric_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("metric_date <= ?")
            params.append(end_date)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY metric_date DESC"
        return self.conn.execute(sql, params).pl()

    def get_recharge_distribution(self, start_date: Optional[date] = None,
                                  end_date: Optional[date] = None,
                                  store: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                store,
                card_type,
                DATE_TRUNC('month', recharge_date) AS recharge_month,
                COUNT(*) AS transaction_count,
                SUM(recharge_amount) AS total_recharge,
                SUM(gift_amount) AS total_gift,
                AVG(recharge_amount) AS avg_recharge
            FROM recharge_transactions
        """
        conditions = []
        params = []
        if start_date:
            conditions.append("recharge_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("recharge_date <= ?")
            params.append(end_date)
        if store:
            conditions.append("store = ?")
            params.append(store)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += """
            GROUP BY store, card_type, DATE_TRUNC('month', recharge_date)
            ORDER BY recharge_month DESC, total_recharge DESC
        """
        return self.conn.execute(sql, params).pl()

    def get_review_tag_funnel(self, start_date: Optional[date] = None,
                              end_date: Optional[date] = None,
                              store: Optional[str] = None) -> pl.DataFrame:
        sql = """
            WITH tag_counts AS (
                SELECT
                    UNNEST(review_tags) AS tag,
                    COUNT(*) AS tag_count,
                    AVG(rating) AS avg_rating
                FROM reviews
        """
        conditions = []
        params = []
        if start_date:
            conditions.append("review_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("review_date <= ?")
            params.append(end_date)
        if store:
            conditions.append("store = ?")
            params.append(store)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += """
                GROUP BY tag
            )
            SELECT
                tag,
                tag_count,
                avg_rating,
                tag_count * 100.0 / (SELECT MAX(tag_count) FROM tag_counts) AS percentage_of_max
            FROM tag_counts
            ORDER BY tag_count DESC
        """
        return self.conn.execute(sql, params).pl()

    def get_service_card_ranking(self, start_date: Optional[date] = None,
                                 end_date: Optional[date] = None,
                                 store: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                category,
                card_name,
                COUNT(*) AS cards_sold,
                SUM(sale_price) AS total_revenue,
                AVG(sale_price) AS avg_price,
                SUM(used_sessions) AS total_sessions_used,
                SUM(remaining_sessions) AS total_sessions_remaining
            FROM service_cards
        """
        conditions = []
        params = []
        if start_date:
            conditions.append("purchase_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("purchase_date <= ?")
            params.append(end_date)
        if store:
            conditions.append("store = ?")
            params.append(store)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += """
            GROUP BY category, card_name
            ORDER BY total_revenue DESC
        """
        return self.conn.execute(sql, params).pl()

    def get_technician_schedule_changes(self, start_date: Optional[date] = None,
                                        end_date: Optional[date] = None,
                                        store: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                technician,
                schedule_date,
                shift_type,
                store,
                is_leave,
                leave_reason,
                COUNT(*) OVER (PARTITION BY technician, DATE_TRUNC('week', schedule_date)) AS shifts_this_week
            FROM technician_schedules
        """
        conditions = []
        params = []
        if start_date:
            conditions.append("schedule_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("schedule_date <= ?")
            params.append(end_date)
        if store:
            conditions.append("store = ?")
            params.append(store)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY schedule_date DESC, technician"
        return self.conn.execute(sql, params).pl()

    def execute_query(self, sql: str, params: Optional[List[Any]] = None) -> pl.DataFrame:
        return self.conn.execute(sql, params or []).pl()

    def get_summary_stats(self) -> Dict[str, Any]:
        stats = {}
        for table in ["inventory", "reviews", "appointments", "recharge_transactions",
                      "service_cards", "technician_schedules"]:
            try:
                count = self.conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                stats[table] = count
            except Exception:
                stats[table] = 0
        return stats

    def query_to_df(self, sql: str) -> pl.DataFrame:
        return self.conn.execute(sql).pl()
