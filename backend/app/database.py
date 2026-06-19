import asyncio
import subprocess
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session


def _run_alembic_upgrade() -> None:
    project_root = Path(__file__).resolve().parent.parent
    try:
        subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=project_root,
            check=True,
            capture_output=True,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass


async def init_db():
    try:
        await asyncio.to_thread(_run_alembic_upgrade)
    except Exception:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
