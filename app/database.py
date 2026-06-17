from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import config

Base = declarative_base()
engine = create_engine(config.DATABASE_URL, **config.SQLALCHEMY_ENGINE_OPTIONS)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    return SessionLocal()


def init_db():
    Base.metadata.create_all(bind=engine)
