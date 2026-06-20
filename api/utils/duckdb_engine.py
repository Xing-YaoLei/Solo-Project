import os
import duckdb
from datetime import datetime
from typing import Optional, List, Dict, Any

from api.utils.database import (
    async_session,
    pg_async_session,
    is_postgresql,
    TABLE_COLUMNS,
    TABLES_SQL,
)

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "./analytics.duckdb")

_duckdb_conn = None


def get_duckdb_conn() -> duckdb.DuckDBPyConnection:
    global _duckdb_conn
    if _duckdb_conn is None:
        _duckdb_conn = duckdb.connect(DUCKDB_PATH)
    return _duckdb_conn


def close_duckdb_conn():
    global _duckdb_conn
    if _duckdb_conn is not None:
        _duckdb_conn.close()
        _duckdb_conn = None


ANALYTICAL_TABLES_SQL = {
    "orders_agg": """
        CREATE TABLE IF NOT EXISTS orders_agg (
            date DATE,
            ticket_type_id VARCHAR,
            status VARCHAR,
            total_orders INTEGER,
            total_amount DOUBLE,
            verified_orders INTEGER,
            PRIMARY KEY (date, ticket_type_id, status)
        )
    """,
    "verification_agg": """
        CREATE TABLE IF NOT EXISTS verification_agg (
            date DATE,
            dimension VARCHAR,
            dimension_value VARCHAR,
            caliber_version VARCHAR,
            total_tickets INTEGER,
            verified_tickets INTEGER,
            verification_rate DOUBLE,
            avg_verify_time DOUBLE,
            PRIMARY KEY (date, dimension, dimension_value, caliber_version)
        )
    """,
    "daily_sales_agg": """
        CREATE TABLE IF NOT EXISTS daily_sales_agg (
            date DATE PRIMARY KEY,
            orders_count INTEGER,
            revenue DOUBLE,
            avg_order_value DOUBLE,
            unique_buyers INTEGER
        )
    """,
    "benefit_usage_agg": """
        CREATE TABLE IF NOT EXISTS benefit_usage_agg (
            date DATE,
            benefit_category VARCHAR,
            sponsor_id VARCHAR,
            total_used INTEGER,
            total_available INTEGER,
            usage_rate DOUBLE,
            PRIMARY KEY (date, benefit_category, sponsor_id)
        )
    """,
    "funnel_agg": """
        CREATE TABLE IF NOT EXISTS funnel_agg (
            stage VARCHAR PRIMARY KEY,
            count INTEGER,
            conversion_rate DOUBLE
        )
    """,
}


def init_duckdb():
    conn = get_duckdb_conn()

    for table_name, columns in TABLE_COLUMNS.items():
        pk_col = None
        if "id" in columns:
            pk_col = "id"
        elif "version" in columns:
            pk_col = "version"
        elif columns:
            pk_col = columns[0]

        col_defs = []
        for col in columns:
            if col == pk_col:
                col_defs.append(f"{col} VARCHAR PRIMARY KEY")
            elif col in ["amount", "price", "verification_rate", "avg_verify_time", "total_amount", "avg_order_value", "usage_rate", "conversion_rate"]:
                col_defs.append(f"{col} DOUBLE")
            elif col in ["total_quantity", "col_number", "total_seats", "quantity", "total_tickets", "verified_tickets", "total_records", "processed_records", "total_orders", "verified_orders", "orders_count", "unique_buyers", "total_used", "total_available", "count"]:
                col_defs.append(f"{col} INTEGER")
            elif col in ["created_at", "updated_at", "start_date", "end_date", "paid_at", "verified_at", "pay_time", "scan_time", "pass_time", "resolved_at", "effective_date", "report_date", "sync_date", "start_time", "end_time", "last_run_time", "next_run_time"]:
                col_defs.append(f"{col} TIMESTAMP")
            elif col == "date":
                col_defs.append(f"{col} DATE")
            else:
                col_defs.append(f"{col} VARCHAR")

        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(col_defs)})"
        conn.execute(create_sql)

    for agg_sql in ANALYTICAL_TABLES_SQL.values():
        conn.execute(agg_sql)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS sync_metadata (
            table_name VARCHAR PRIMARY KEY,
            last_sync_at TIMESTAMP,
            last_sync_batch_id VARCHAR,
            row_count INTEGER
        )
    """)

    conn.commit()


async def _fetch_source_data(table_name: str, sync_batch_id: Optional[str] = None) -> List[tuple]:
    columns = TABLE_COLUMNS.get(table_name)
    if not columns:
        return []

    col_str = ", ".join(columns)
    query = f"SELECT {col_str} FROM {table_name}"
    params = {}

    if sync_batch_id and table_name in ["orders", "payment_records", "gate_records"]:
        columns = TABLE_COLUMNS.get(table_name, [])
        if "sync_batch_id" in columns:
            query += " WHERE sync_batch_id = :batch_id"
            params["batch_id"] = sync_batch_id

    session = pg_async_session if is_postgresql() else async_session

    async with session() as sess:
        from sqlalchemy import text
        result = await sess.execute(text(query), params)
        return result.fetchall()


async def sync_postgres_to_duckdb(table_name: str, sync_batch_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_duckdb_conn()
    columns = TABLE_COLUMNS.get(table_name)
    if not columns:
        return {"table": table_name, "status": "error", "message": f"Unknown table: {table_name}"}

    try:
        rows = await _fetch_source_data(table_name, sync_batch_id)
        row_count = len(rows)

        if row_count == 0:
            return {"table": table_name, "status": "success", "rows_synced": 0}

        col_str = ", ".join(columns)
        placeholders = ", ".join(["?" for _ in columns])

        if sync_batch_id and "sync_batch_id" in columns:
            conn.execute(f"DELETE FROM {table_name} WHERE sync_batch_id = ?", (sync_batch_id,))

        conn.executemany(
            f"INSERT OR REPLACE INTO {table_name} ({col_str}) VALUES ({placeholders})",
            rows
        )

        conn.execute("""
            INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at, last_sync_batch_id, row_count)
            VALUES (?, ?, ?, ?)
        """, (table_name, datetime.now().isoformat(), sync_batch_id, row_count))

        conn.commit()

        await _refresh_aggregates(conn, table_name)

        return {
            "table": table_name,
            "status": "success",
            "rows_synced": row_count,
            "sync_batch_id": sync_batch_id
        }
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return {"table": table_name, "status": "error", "message": str(e)}


async def _refresh_aggregates(conn: duckdb.DuckDBPyConnection, source_table: str):
    if source_table == "orders":
        conn.execute("DELETE FROM orders_agg")
        conn.execute("""
            INSERT INTO orders_agg
            SELECT
                DATE(created_at) AS date,
                ticket_type_id,
                status,
                COUNT(*) AS total_orders,
                SUM(amount) AS total_amount,
                SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) AS verified_orders
            FROM orders
            GROUP BY DATE(created_at), ticket_type_id, status
        """)

        conn.execute("DELETE FROM daily_sales_agg")
        conn.execute("""
            INSERT INTO daily_sales_agg
            SELECT
                DATE(created_at) AS date,
                COUNT(*) AS orders_count,
                SUM(amount) AS revenue,
                AVG(amount) AS avg_order_value,
                COUNT(DISTINCT buyer_phone) AS unique_buyers
            FROM orders
            WHERE status IN ('paid', 'used')
            GROUP BY DATE(created_at)
        """)

        conn.execute("DELETE FROM funnel_agg")
        conn.execute("""
            INSERT INTO funnel_agg (stage, count, conversion_rate)
            WITH funnel AS (
                SELECT 'browse' AS stage, COUNT(*) AS count FROM orders
                UNION ALL
                SELECT 'order' AS stage, COUNT(*) FROM orders WHERE status != 'pending'
                UNION ALL
                SELECT 'pay' AS stage, COUNT(*) FROM orders WHERE status IN ('paid', 'used')
                UNION ALL
                SELECT 'verify' AS stage, COUNT(*) FROM orders WHERE status = 'used'
            )
            SELECT
                stage,
                count,
                CASE
                    WHEN stage = 'browse' THEN 100.0
                    ELSE ROUND(count * 100.0 / LAG(count) OVER (ORDER BY
                        CASE stage
                            WHEN 'browse' THEN 1
                            WHEN 'order' THEN 2
                            WHEN 'pay' THEN 3
                            WHEN 'verify' THEN 4
                        END), 2)
                END AS conversion_rate
            FROM funnel
        """)

    elif source_table == "check_in_records":
        conn.execute("DELETE FROM verification_agg")
        conn.execute("""
            INSERT INTO verification_agg
            SELECT
                DATE(cr.scan_time) AS date,
                'date' AS dimension,
                CAST(DATE(cr.scan_time) AS VARCHAR) AS dimension_value,
                'v2.0' AS caliber_version,
                COUNT(DISTINCT o.id) AS total_tickets,
                COUNT(DISTINCT CASE WHEN o.status = 'used' THEN o.id END) AS verified_tickets,
                ROUND(COUNT(DISTINCT CASE WHEN o.status = 'used' THEN o.id END) * 100.0 / NULLIF(COUNT(DISTINCT o.id), 0), 2) AS verification_rate,
                AVG(EXTRACT(EPOCH FROM (o.verified_at - o.created_at)) / 3600) AS avg_verify_time
            FROM orders o
            LEFT JOIN check_in_records cr ON o.id = cr.order_id
            GROUP BY DATE(cr.scan_time)
        """)

    conn.commit()


async def sync_all_tables_to_duckdb(sync_batch_id: Optional[str] = None) -> List[Dict[str, Any]]:
    tables = list(TABLE_COLUMNS.keys())
    results = []
    for table in tables:
        result = await sync_postgres_to_duckdb(table, sync_batch_id)
        results.append(result)
    return results


def get_duckdb_sync_status() -> List[Dict[str, Any]]:
    conn = get_duckdb_conn()
    result = conn.execute("""
        SELECT table_name, last_sync_at, last_sync_batch_id, row_count
        FROM sync_metadata
        ORDER BY table_name
    """).fetchall()

    return [
        {
            "table_name": row[0],
            "last_sync_at": row[1],
            "last_sync_batch_id": row[2],
            "row_count": row[3]
        }
        for row in result
    ]
