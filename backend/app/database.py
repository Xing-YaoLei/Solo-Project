from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from app.config import settings

db_url = settings.DATABASE_URL
try:
    import psycopg  # noqa: F401
except ImportError:
    if "postgresql" in db_url:
        print(f"⚠️  PostgreSQL 驱动未安装，回退到 SQLite: {settings.DATABASE_URL_SQLITE}")
        db_url = settings.DATABASE_URL_SQLITE

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
