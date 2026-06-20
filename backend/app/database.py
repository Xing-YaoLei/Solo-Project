import duckdb
from contextlib import contextmanager
from typing import Generator

_duckdb_conn: duckdb.DuckDBPyConnection | None = None

DDL_SQL = """
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY,
    name VARCHAR,
    phone VARCHAR,
    ticket_type VARCHAR,
    amount DECIMAL(10, 2),
    area_code VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id),
    order_no VARCHAR,
    amount DECIMAL(10, 2),
    channel VARCHAR,
    status VARCHAR,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id),
    ticket_no VARCHAR,
    seat_code VARCHAR,
    checkin_code VARCHAR,
    is_checked BOOLEAN,
    checked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_records (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id),
    gate_no VARCHAR,
    checkin_code VARCHAR,
    pass_time TIMESTAMP,
    status VARCHAR
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    payment_id UUID REFERENCES payments(id),
    registration_id UUID REFERENCES registrations(id),
    refund_amount DECIMAL(10, 2),
    reason VARCHAR,
    is_disputed BOOLEAN,
    dispute_note VARCHAR,
    refunded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY,
    name VARCHAR,
    level VARCHAR,
    contact VARCHAR
);

CREATE TABLE IF NOT EXISTS sponsorship_benefits (
    id UUID PRIMARY KEY,
    sponsor_id UUID REFERENCES sponsors(id),
    benefit_type VARCHAR,
    contract_qty INTEGER,
    fulfilled_qty INTEGER,
    status VARCHAR,
    deadline DATE
);

CREATE TABLE IF NOT EXISTS ticket_rules (
    id UUID PRIMARY KEY,
    rule_name VARCHAR,
    ticket_type VARCHAR,
    price DECIMAL(10, 2),
    max_quantity INTEGER,
    restrictions VARCHAR
);

CREATE TABLE IF NOT EXISTS sync_tasks (
    task_code VARCHAR PRIMARY KEY,
    task_name VARCHAR,
    source_type VARCHAR,
    last_sync_time TIMESTAMP,
    last_sync_count INTEGER,
    status VARCHAR
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGINT PRIMARY KEY,
    task_code VARCHAR REFERENCES sync_tasks(task_code),
    level VARCHAR,
    message VARCHAR,
    detail VARCHAR,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seat_areas (
    area_code VARCHAR PRIMARY KEY,
    area_name VARCHAR,
    total_seats INTEGER,
    polygon_geom VARCHAR
);
"""


def get_duckdb_connection() -> duckdb.DuckDBPyConnection:
    global _duckdb_conn
    if _duckdb_conn is None:
        _duckdb_conn = duckdb.connect(database=":memory:")
        _duckdb_conn.execute(DDL_SQL)
    return _duckdb_conn


@contextmanager
def get_duckdb() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    conn = get_duckdb_connection()
    try:
        yield conn
    finally:
        pass
