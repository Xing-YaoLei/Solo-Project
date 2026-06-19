from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from typing import AsyncGenerator
import os
import duckdb

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./complaints.db")

_is_postgres = DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres")

if _is_postgres and not DATABASE_URL.startswith("postgresql+asyncpg"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

pg_engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=_is_postgres)
pg_session_factory = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)

_sync_url = DATABASE_URL
if _is_postgres:
    _sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
else:
    _sync_url = DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite://", 1)

pg_sync_engine = create_engine(_sync_url, echo=False)

duckdb_engine = duckdb.connect(":memory:")


async def get_pg_session() -> AsyncGenerator[AsyncSession, None]:
    async with pg_session_factory() as session:
        yield session


def get_duckdb_conn():
    return duckdb_engine


def is_postgres() -> bool:
    return _is_postgres
