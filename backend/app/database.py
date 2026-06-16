from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import duckdb
import os

from .config import settings

os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_duckdb_conn():
    conn = duckdb.connect(settings.DUCKDB_PATH)
    try:
        yield conn
    finally:
        conn.close()
