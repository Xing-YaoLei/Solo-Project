import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
import duckdb

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/elderly_care",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "analytics.duckdb")


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


def get_duckdb_conn():
    return duckdb.connect(DUCKDB_PATH)


def init_duckdb():
    conn = get_duckdb_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_risk_scores (
            date DATE,
            bed_id VARCHAR,
            risk_score DOUBLE,
            occupancy_rate DOUBLE
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS terminal_delay_events (
            date DATE,
            bed_id VARCHAR,
            delay_minutes INTEGER,
            timestamp TIMESTAMP
        )
    """)
    conn.close()
