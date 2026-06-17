import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import duckdb
import logging

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DUCKDB_PATH = DATA_DIR / "elder_care_analytics.db"

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "postgres")
PG_DB = os.getenv("PG_DB", "elder_care")

PG_URL = f"postgresql+psycopg2://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"

SQLITE_FALLBACK_PATH = DATA_DIR / "elder_care_biz.db"
SQLITE_URL = f"sqlite:///{SQLITE_FALLBACK_PATH}"

_pg_engine = None
_pg_session_local = None
_use_pg = False

Base = declarative_base()


def get_pg_engine():
    global _pg_engine, _use_pg
    if _pg_engine is None:
        try:
            _pg_engine = create_engine(
                PG_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False,
            )
            with _pg_engine.connect() as conn:
                conn.execute("SELECT 1")
            _use_pg = True
            logger.info("PostgreSQL 连接成功")
        except Exception as e:
            logger.warning(f"PostgreSQL 连接失败，使用 SQLite 作为业务库降级方案: {e}")
            _pg_engine = create_engine(
                SQLITE_URL,
                connect_args={"check_same_thread": False} if SQLITE_URL.startswith("sqlite") else {},
                echo=False,
            )
            _use_pg = False
    return _pg_engine


def is_pg_available() -> bool:
    global _use_pg
    return _use_pg


def get_pg_session():
    global _pg_session_local
    if _pg_session_local is None:
        engine = get_pg_engine()
        _pg_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _pg_session_local()


def get_db():
    db = get_pg_session()
    try:
        yield db
    finally:
        db.close()


_duckdb_conn = None


def get_duckdb():
    global _duckdb_conn
    if _duckdb_conn is None:
        _duckdb_conn = duckdb.connect(str(DUCKDB_PATH))
    return _duckdb_conn


def close_duckdb():
    global _duckdb_conn
    if _duckdb_conn is not None:
        _duckdb_conn.close()
        _duckdb_conn = None
