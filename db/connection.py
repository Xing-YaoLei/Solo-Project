from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, **Config.SQLALCHEMY_ENGINE_OPTIONS)
session_factory = sessionmaker(bind=engine)
db_session = scoped_session(session_factory)


def init_db():
    from db.models import Base
    Base.metadata.create_all(bind=engine)


def drop_db():
    from db.models import Base
    Base.metadata.drop_all(bind=engine)
