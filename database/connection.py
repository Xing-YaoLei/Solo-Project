from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.settings import Config

_db_url = Config.DATABASE_URL

if _db_url.startswith("postgresql://") and "+" not in _db_url.split("://")[1].split("/")[0]:
    try:
        import psycopg
        _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    except ImportError:
        pass

engine = create_engine(_db_url, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    return SessionLocal()
