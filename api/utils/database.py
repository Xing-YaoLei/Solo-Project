import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./ticket_dashboard.db",
)

PG_DATABASE_URL = os.getenv(
    "PG_DATABASE_URL",
    "postgresql+asyncpg://user:pass@localhost:5432/ticket_db",
)

def get_db_engine():
    if DATABASE_URL.startswith("postgresql+asyncpg://"):
        return pg_engine
    return engine

def is_postgresql():
    return DATABASE_URL.startswith("postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

pg_engine = create_async_engine(PG_DATABASE_URL, echo=False, future=True)
pg_async_session = sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

TABLES_SQL = {
    "events": """
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            venue TEXT NOT NULL,
            config TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "sponsors": """
        CREATE TABLE IF NOT EXISTS sponsors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_info TEXT DEFAULT '{}',
            benefits TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "ticket_types": """
        CREATE TABLE IF NOT EXISTS ticket_types (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            total_quantity INTEGER NOT NULL,
            description TEXT,
            rules TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "ticket_benefits": """
        CREATE TABLE IF NOT EXISTS ticket_benefits (
            id TEXT PRIMARY KEY,
            ticket_type_id TEXT NOT NULL,
            sponsor_id TEXT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "areas": """
        CREATE TABLE IF NOT EXISTS areas (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            name TEXT NOT NULL,
            total_seats INTEGER NOT NULL DEFAULT 0,
            config TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "seats": """
        CREATE TABLE IF NOT EXISTS seats (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            area_id TEXT NOT NULL,
            seat_code TEXT NOT NULL,
            row_label TEXT NOT NULL,
            col_number INTEGER NOT NULL,
            price REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'available',
            order_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "orders": """
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            ticket_type_id TEXT NOT NULL,
            seat_id TEXT,
            order_no TEXT NOT NULL UNIQUE,
            buyer_name TEXT NOT NULL,
            buyer_phone TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            paid_at TEXT,
            verified_at TEXT,
            sync_batch_id TEXT,
            check_in_code TEXT
        )
    """,
    "payment_records": """
        CREATE TABLE IF NOT EXISTS payment_records (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            transaction_id TEXT NOT NULL,
            amount REAL NOT NULL,
            pay_method TEXT NOT NULL,
            status TEXT NOT NULL,
            pay_time TEXT NOT NULL,
            sync_batch_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "check_in_records": """
        CREATE TABLE IF NOT EXISTS check_in_records (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            check_in_code TEXT NOT NULL,
            scanner TEXT,
            location TEXT,
            status TEXT NOT NULL,
            scan_time TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "gate_records": """
        CREATE TABLE IF NOT EXISTS gate_records (
            id TEXT PRIMARY KEY,
            order_id TEXT,
            gate_code TEXT NOT NULL,
            device_id TEXT NOT NULL,
            direction TEXT NOT NULL,
            pass_time TEXT NOT NULL,
            sync_batch_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "refund_disputes": """
        CREATE TABLE IF NOT EXISTS refund_disputes (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            remark TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT
        )
    """,
    "caliber_versions": """
        CREATE TABLE IF NOT EXISTS caliber_versions (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            formula TEXT NOT NULL,
            description TEXT,
            change_reason TEXT,
            effective_date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "verification_reports": """
        CREATE TABLE IF NOT EXISTS verification_reports (
            id TEXT PRIMARY KEY,
            dimension TEXT NOT NULL,
            dimension_value TEXT NOT NULL,
            total_tickets INTEGER NOT NULL,
            verified_tickets INTEGER NOT NULL,
            verification_rate REAL NOT NULL,
            avg_verify_time REAL,
            caliber_version TEXT NOT NULL,
            report_date TEXT NOT NULL,
            details TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "sync_tasks": """
        CREATE TABLE IF NOT EXISTS sync_tasks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source TEXT NOT NULL,
            cron_expression TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            last_run_time TEXT,
            next_run_time TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "sync_batches": """
        CREATE TABLE IF NOT EXISTS sync_batches (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            source TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            total_records INTEGER NOT NULL DEFAULT 0,
            processed_records INTEGER NOT NULL DEFAULT 0,
            start_time TEXT,
            end_time TEXT,
            error_message TEXT,
            sync_date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """,
}

TABLE_COLUMNS = {
    "events": ["id", "name", "start_date", "end_date", "venue", "config", "created_at", "updated_at"],
    "sponsors": ["id", "name", "contact_info", "benefits", "created_at", "updated_at"],
    "ticket_types": ["id", "event_id", "name", "price", "total_quantity", "description", "rules", "created_at", "updated_at"],
    "ticket_benefits": ["id", "ticket_type_id", "sponsor_id", "name", "category", "quantity", "description", "created_at"],
    "areas": ["id", "event_id", "name", "total_seats", "config", "created_at"],
    "seats": ["id", "event_id", "area_id", "seat_code", "row_label", "col_number", "price", "status", "order_id", "created_at", "updated_at"],
    "orders": ["id", "ticket_type_id", "seat_id", "order_no", "buyer_name", "buyer_phone", "amount", "status", "created_at", "paid_at", "verified_at", "sync_batch_id", "check_in_code"],
    "payment_records": ["id", "order_id", "transaction_id", "amount", "pay_method", "status", "pay_time", "sync_batch_id", "created_at"],
    "check_in_records": ["id", "order_id", "check_in_code", "scanner", "location", "status", "scan_time", "created_at"],
    "gate_records": ["id", "order_id", "gate_code", "device_id", "direction", "pass_time", "sync_batch_id", "created_at"],
    "refund_disputes": ["id", "order_id", "reason", "status", "remark", "created_at", "resolved_at"],
    "caliber_versions": ["version", "name", "formula", "description", "change_reason", "effective_date", "created_at"],
    "verification_reports": ["id", "dimension", "dimension_value", "total_tickets", "verified_tickets", "verification_rate", "avg_verify_time", "caliber_version", "report_date", "details", "created_at"],
    "sync_tasks": ["id", "name", "source", "cron_expression", "status", "last_run_time", "next_run_time", "created_at", "updated_at"],
    "sync_batches": ["id", "task_id", "source", "status", "total_records", "processed_records", "start_time", "end_time", "error_message", "sync_date", "created_at"],
}


async def init_db():
    async with engine.begin() as conn:
        for table_sql in TABLES_SQL.values():
            await conn.execute(text(table_sql))
        await conn.commit()

    if is_postgresql():
        async with pg_engine.begin() as conn:
            for table_sql in TABLES_SQL.values():
                pg_sql = table_sql.replace("TEXT DEFAULT CURRENT_TIMESTAMP", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                pg_sql = pg_sql.replace("TEXT PRIMARY KEY", "VARCHAR(255) PRIMARY KEY")
                pg_sql = pg_sql.replace("TEXT NOT NULL", "VARCHAR(255) NOT NULL")
                pg_sql = pg_sql.replace("TEXT DEFAULT '{}'", "TEXT DEFAULT '{}'")
                pg_sql = pg_sql.replace("TEXT,", "VARCHAR(255),")
                await conn.execute(text(pg_sql))
            await conn.commit()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
