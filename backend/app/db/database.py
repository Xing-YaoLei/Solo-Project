from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import duckdb
import os

from app.core.config import settings

os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
if settings.USE_POSTGRES:
    os.makedirs("./data", exist_ok=True)

if settings.USE_POSTGRES:
    SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
else:
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

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
