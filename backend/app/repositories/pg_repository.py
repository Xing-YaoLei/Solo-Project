import uuid
from datetime import datetime, date
from typing import Optional, List, Generator
from contextlib import contextmanager

from ..config import settings
from ..utils.logger import logger

_sqlalchemy_available = False
try:
    from sqlalchemy import (
        create_engine, Column, String, Integer, BigInteger,
        Numeric, Boolean, DateTime, Date, Text, ForeignKey
    )
    from sqlalchemy.orm import declarative_base, sessionmaker, Session
    _sqlalchemy_available = True
except ImportError:
    logger.warning("SQLAlchemy not available. PostgreSQL support disabled.")


_pg_engine = None
_PgSessionLocal = None
Base = None


def _init_pg():
    global _pg_engine, _PgSessionLocal, Base
    if not settings.DATABASE_URL:
        logger.info("DATABASE_URL not set. PostgreSQL repository disabled.")
        return False
    if not _sqlalchemy_available:
        logger.warning("SQLAlchemy not installed. PostgreSQL repository disabled.")
        return False
    if _pg_engine is not None:
        return True

    try:
        _pg_engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        _PgSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_pg_engine)
        Base = declarative_base()
        logger.info(f"PostgreSQL engine initialized: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL[:50]}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL: {e}")
        return False


def is_pg_enabled() -> bool:
    return settings.DATABASE_URL is not None and _sqlalchemy_available and _init_pg()


@contextmanager
def get_pg_session() -> Generator[Optional[Session], None, None]:
    if not is_pg_enabled():
        yield None
        return
    session = _PgSessionLocal()
    try:
        yield session
    finally:
        session.close()


if _sqlalchemy_available:
    from sqlalchemy import (
        create_engine, Column, String, Integer, BigInteger,
        Numeric, Boolean, DateTime, Date, Text, ForeignKey
    )
    from sqlalchemy.orm import declarative_base

    Base = declarative_base()

    class Registration(Base):
        __tablename__ = "registrations"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        name = Column(String)
        phone = Column(String)
        ticket_type = Column(String)
        amount = Column(Numeric(10, 2))
        area_code = Column(String)
        status = Column(String)
        created_at = Column(DateTime)

    class Payment(Base):
        __tablename__ = "payments"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        registration_id = Column(String, ForeignKey("registrations.id"))
        order_no = Column(String)
        amount = Column(Numeric(10, 2))
        channel = Column(String)
        status = Column(String)
        paid_at = Column(DateTime)

    class Ticket(Base):
        __tablename__ = "tickets"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        registration_id = Column(String, ForeignKey("registrations.id"))
        ticket_no = Column(String)
        seat_code = Column(String)
        checkin_code = Column(String)
        is_checked = Column(Boolean)
        checked_at = Column(DateTime)

    class GateRecord(Base):
        __tablename__ = "gate_records"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        ticket_id = Column(String, ForeignKey("tickets.id"))
        gate_no = Column(String)
        checkin_code = Column(String)
        pass_time = Column(DateTime)
        status = Column(String)

    class Refund(Base):
        __tablename__ = "refunds"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        payment_id = Column(String, ForeignKey("payments.id"))
        registration_id = Column(String, ForeignKey("registrations.id"))
        refund_amount = Column(Numeric(10, 2))
        reason = Column(String)
        is_disputed = Column(Boolean, default=False)
        dispute_note = Column(Text)
        refunded_at = Column(DateTime)

    class Sponsor(Base):
        __tablename__ = "sponsors"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        name = Column(String)
        level = Column(String)
        contact = Column(String)

    class SponsorshipBenefit(Base):
        __tablename__ = "sponsorship_benefits"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        sponsor_id = Column(String, ForeignKey("sponsors.id"))
        benefit_type = Column(String)
        contract_qty = Column(Integer)
        fulfilled_qty = Column(Integer)
        status = Column(String)
        deadline = Column(Date)

    class TicketRule(Base):
        __tablename__ = "ticket_rules"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        rule_name = Column(String)
        ticket_type = Column(String)
        price = Column(Numeric(10, 2))
        max_quantity = Column(Integer)
        restrictions = Column(String)

    class SyncTask(Base):
        __tablename__ = "sync_tasks"

        task_code = Column(String, primary_key=True)
        task_name = Column(String)
        source_type = Column(String)
        last_sync_time = Column(DateTime)
        last_sync_count = Column(Integer)
        status = Column(String)

    class SyncLog(Base):
        __tablename__ = "sync_logs"

        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        task_code = Column(String, ForeignKey("sync_tasks.task_code"))
        level = Column(String)
        message = Column(String)
        detail = Column(Text)
        created_at = Column(DateTime)

    class SeatArea(Base):
        __tablename__ = "seat_areas"

        area_code = Column(String, primary_key=True)
        area_name = Column(String)
        total_seats = Column(Integer)
        polygon_geom = Column(Text)


def create_tables_if_not_exists() -> bool:
    if not is_pg_enabled() or Base is None:
        return False
    try:
        Base.metadata.create_all(bind=_pg_engine)
        logger.info("PostgreSQL tables created/verified.")
        return True
    except Exception as e:
        logger.error(f"Failed to create PostgreSQL tables: {e}")
        return False
