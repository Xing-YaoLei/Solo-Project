import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL.startswith("postgresql"):
    engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10)
else:
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), "rehab_demo.db")
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{SQLITE_PATH}",
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
        await conn.run_sync(Base.metadata.create_all)
