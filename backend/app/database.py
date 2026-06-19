from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import duckdb
import os

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_duckdb_conn():
    os.makedirs(os.path.dirname(settings.duckdb_path), exist_ok=True)
    conn = duckdb.connect(settings.duckdb_path)
    try:
        yield conn
    finally:
        conn.close()
