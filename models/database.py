from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from contextlib import contextmanager
from config import Config

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=Config.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
