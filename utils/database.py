from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import db_config

Base = declarative_base()

engine = create_engine(
    db_config.SQLALCHEMY_DATABASE_URI,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    return SessionLocal()
