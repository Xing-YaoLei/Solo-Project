from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from typing import AsyncGenerator
import duckdb

PG_URL = "sqlite+aiosqlite:///./complaints.db"

pg_engine = create_async_engine(PG_URL, echo=False)
pg_session_factory = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)

duckdb_engine = duckdb.connect(":memory:")


async def get_pg_session() -> AsyncGenerator[AsyncSession, None]:
    async with pg_session_factory() as session:
        yield session


def get_duckdb_conn():
    return duckdb_engine
