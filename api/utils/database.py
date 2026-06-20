import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./ticket_dashboard.db",
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sponsors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_info TEXT DEFAULT '{}',
                benefits TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS areas (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                name TEXT NOT NULL,
                total_seats INTEGER NOT NULL DEFAULT 0,
                config TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS refund_disputes (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                remark TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                resolved_at TEXT
            )
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS caliber_versions (
                version TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                formula TEXT NOT NULL,
                description TEXT,
                change_reason TEXT,
                effective_date TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.execute(text("""
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
        """))

        await conn.commit()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
