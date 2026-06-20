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
    source_file VARCHAR,
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
    source_file VARCHAR,
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
        self._run_migrations()

    def _run_migrations(self):
        migrations = [
            "ALTER TABLE tickets ADD COLUMN source_file VARCHAR",
            "ALTER TABLE payments ADD COLUMN source_file VARCHAR",
        ]
        for sql in migrations:
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

    def write_df(self, df: pl.DataFrame, table_name: str, if_exists: str = "append") -> int:
        if df.height == 0:
            return 0
        schema_sql = f"DESCRIBE {table_name}"
        try:
            table_schema = self.query_to_df(schema_sql)
        except Exception:
            raise ValueError(f"Table {table_name} does not exist")

        schema_map = {}
        for row in table_schema.iter_rows(named=True):
            col_name = row["column_name"] if "column_name" in table_schema.columns else row.get("Field", row.get("name", ""))
            col_type = row["column_type"] if "column_type" in table_schema.columns else row.get("Type", row.get("type", ""))
            schema_map[col_name] = col_type

        common_cols = [c for c in df.columns if c in schema_map]
        if not common_cols:
            raise ValueError(
                f"No matching columns between DataFrame {df.columns} and table {table_name} {list(schema_map.keys())}"
            )

        aligned_df = df.select(common_cols)

        cast_exprs = []
        for col in common_cols:
            target_type = schema_map[col].upper()
            expr = pl.col(col)
            try:
                if "DECIMAL" in target_type or "NUMERIC" in target_type or "FLOAT" in target_type or "DOUBLE" in target_type:
                    expr = expr.cast(pl.Float64, strict=False)
                elif "INT" in target_type or "BIGINT" in target_type or "SMALLINT" in target_type:
                    expr = expr.cast(pl.Int64, strict=False)
                elif "BOOLEAN" in target_type or "BOOL" in target_type:
                    expr = expr.cast(pl.Boolean, strict=False)
                elif "TIMESTAMP" in target_type or "DATETIME" in target_type:
                    expr = pl.col(col).cast(pl.Utf8, strict=False).str.to_datetime(strict=False)
                elif "DATE" in target_type:
                    expr = pl.col(col).cast(pl.Utf8, strict=False).str.to_date(strict=False)
                elif "JSON" in target_type:
                    expr = pl.col(col).cast(pl.Utf8, strict=False)
                else:
                    expr = expr.cast(pl.Utf8, strict=False)
            except Exception:
                expr = pl.col(col).cast(pl.Utf8, strict=False)
            cast_exprs.append(expr.alias(col))

        if cast_exprs:
            aligned_df = aligned_df.with_columns(cast_exprs)

        tmp_name = f"tmp_import_{table_name}_{abs(hash(table_name)) % 10000}"
        self.conn.register(tmp_name, aligned_df)
        inserted = 0
        try:
            if if_exists == "replace":
                self.conn.execute(f"DELETE FROM {table_name}")
            col_sql = ", ".join(common_cols)
            insert_sql = f"INSERT INTO {table_name} ({col_sql}) SELECT {col_sql} FROM {tmp_name}"
            result = self.conn.execute(insert_sql)
            inserted = aligned_df.height
        except Exception as e:
            raise RuntimeError(f"Failed to insert into {table_name}: {str(e)}")
        finally:
            try:
                self.conn.unregister(tmp_name)
            except Exception:
                pass
        return inserted

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
