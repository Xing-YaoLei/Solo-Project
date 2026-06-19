from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

db_url = settings.FINAL_DATABASE_URL
is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(db_url, pool_pre_ping=True, pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
