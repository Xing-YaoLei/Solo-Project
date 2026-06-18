import compat  # noqa: F401  — must load before any SQLAlchemy model
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

USE_POSTGRES = DATABASE_URL.startswith("postgresql")

if USE_POSTGRES:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, pool_size=10, max_overflow=20)
else:
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), "dev.db")
    ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH}"
    engine = create_async_engine(
        ASYNC_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        if USE_POSTGRES:
            from sqlalchemy import text
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.run_sync(Base.metadata.create_all)
