import os
import duckdb
import polars as pl
from typing import Optional, List, Dict, Any
from src.config import db_config


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR PRIMARY KEY,
    event_name VARCHAR NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    venue VARCHAR,
    organizer VARCHAR,
    total_capacity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
    sponsor_id VARCHAR PRIMARY KEY,
    sponsor_name VARCHAR NOT NULL,
    contact_person VARCHAR,
    contact_phone VARCHAR,
    sponsor_level VARCHAR,
    event_id VARCHAR NOT NULL,
    allocated_tickets INTEGER DEFAULT 0,
    used_tickets INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    staff_id VARCHAR PRIMARY KEY,
    staff_name VARCHAR NOT NULL,
    staff_role VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    event_id VARCHAR NOT NULL,
    assigned_gate VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    user_role VARCHAR NOT NULL,
    display_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    event_access JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_types (
    ticket_type_id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL,
    type_name VARCHAR NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_quantity INTEGER DEFAULT 0,
    max_per_order INTEGER DEFAULT 10,
    sale_start_time TIMESTAMP,
    sale_end_time TIMESTAMP,
    sponsor_id VARCHAR,
    validation_rules JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL,
    buyer_name VARCHAR,
    buyer_phone VARCHAR,
    buyer_email VARCHAR,
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    ticket_count INTEGER DEFAULT 0,
    order_status VARCHAR DEFAULT 'pending',
    order_source VARCHAR,
    sales_channel VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id VARCHAR PRIMARY KEY,
    order_id VARCHAR NOT NULL,
    event_id VARCHAR NOT NULL,
    ticket_type_id VARCHAR NOT NULL,
    sponsor_id VARCHAR,
    ticket_code VARCHAR UNIQUE NOT NULL,
    buyer_name VARCHAR,
    buyer_phone VARCHAR,
    buyer_email VARCHAR,
    attendee_name VARCHAR,
    seat_info VARCHAR,
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2),
    ticket_status VARCHAR DEFAULT 'created',
    purchase_time TIMESTAMP,
    payment_status VARCHAR DEFAULT 'unpaid',
    refund_status VARCHAR DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR PRIMARY KEY,
    order_id VARCHAR NOT NULL,
    event_id VARCHAR NOT NULL,
    payment_method VARCHAR,
    transaction_id VARCHAR UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR DEFAULT 'pending',
    payment_time TIMESTAMP,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_time TIMESTAMP,
    refund_reason TEXT,
    gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_records (
    record_id VARCHAR PRIMARY KEY,
    ticket_id VARCHAR NOT NULL,
    event_id VARCHAR NOT NULL,
    ticket_code VARCHAR NOT NULL,
    gate_id VARCHAR,
    gate_name VARCHAR,
    staff_id VARCHAR,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    check_status VARCHAR DEFAULT 'success',
    fail_reason VARCHAR,
    device_info JSON,
    raw_payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refund_disputes (
    dispute_id VARCHAR PRIMARY KEY,
    ticket_id VARCHAR NOT NULL,
    order_id VARCHAR NOT NULL,
    event_id VARCHAR NOT NULL,
    dispute_type VARCHAR,
    dispute_reason TEXT,
    applicant_name VARCHAR,
    applicant_contact VARCHAR,
    dispute_status VARCHAR DEFAULT 'pending',
    filed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR,
    deadline TIMESTAMP,
    resolution TEXT,
    resolution_time TIMESTAMP,
    conclusion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes_tasks (
    task_id VARCHAR PRIMARY KEY,
    dispute_id VARCHAR,
    ticket_id VARCHAR,
    event_id VARCHAR NOT NULL,
    task_type VARCHAR,
    task_content TEXT NOT NULL,
    priority VARCHAR DEFAULT 'normal',
    assigned_to VARCHAR,
    task_status VARCHAR DEFAULT 'pending',
    due_date TIMESTAMP,
    created_by VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processing_conclusions (
    conclusion_id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL,
    related_type VARCHAR,
    related_id VARCHAR,
    conclusion_title VARCHAR,
    conclusion_content TEXT,
    chart_reference VARCHAR,
    conclusion_type VARCHAR DEFAULT 'analysis',
    author VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS share_links (
    link_id VARCHAR PRIMARY KEY,
    link_token VARCHAR UNIQUE NOT NULL,
    event_id VARCHAR,
    view_scope VARCHAR NOT NULL,
    allowed_roles JSON,
    expires_at TIMESTAMP,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    created_by VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_gate_event ON gate_records(event_id);
CREATE INDEX IF NOT EXISTS idx_gate_time ON gate_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_event ON refund_disputes(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id);
"""


class DatabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        os.makedirs(os.path.dirname(db_config.duckdb_path), exist_ok=True)
        self.conn = duckdb.connect(db_config.duckdb_path)
        self._init_tables()
        self._initialized = True

    def _init_tables(self):
        statements = [s.strip() for s in CREATE_TABLES_SQL.split(";") if s.strip()]
        for sql in statements:
            try:
                self.conn.execute(sql)
            except Exception:
                pass

    def close(self):
        self.conn.close()

    def execute(self, sql: str, params: Optional[tuple] = None) -> duckdb.DuckDBPyConnection:
        if params:
            return self.conn.execute(sql, params)
        return self.conn.execute(sql)

    def query_to_df(self, sql: str, params: Optional[tuple] = None) -> pl.DataFrame:
        if params:
            result = self.conn.execute(sql, params).fetch_arrow_table()
        else:
            result = self.conn.execute(sql).fetch_arrow_table()
        return pl.from_arrow(result)

    def write_df(self, df: pl.DataFrame, table_name: str, if_exists: str = "append"):
        self.conn.register("tmp_df_view", df)
        try:
            if if_exists == "replace":
                self.conn.execute(f"DELETE FROM {table_name}")
            self.conn.execute(f"INSERT INTO {table_name} SELECT * FROM tmp_df_view")
        finally:
            self.conn.unregister("tmp_df_view")

    def write_dfs(self, dfs: Dict[str, pl.DataFrame], if_exists: str = "append"):
        for table_name, df in dfs.items():
            self.write_df(df, table_name, if_exists)

    def get_table_names(self) -> List[str]:
        result = self.query_to_df(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='main'"
        )
        return result["table_name"].to_list()

    def table_row_count(self, table_name: str) -> int:
        result = self.query_to_df(f"SELECT COUNT(*) as cnt FROM {table_name}")
        return result["cnt"][0]


db = DatabaseManager()
