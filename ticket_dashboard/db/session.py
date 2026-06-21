from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ticket_dashboard.config import config

engine = create_engine(config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
