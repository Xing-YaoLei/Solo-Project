from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from app.config import Config

DB_TYPE = os.getenv('DB_TYPE', 'postgresql')

if DB_TYPE == 'sqlite':
    engine = create_engine('sqlite:///audit_compliance.db', echo=False)
else:
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
