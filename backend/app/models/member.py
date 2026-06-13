from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Float, Text, Boolean
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class MemberStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    FROZEN = "frozen"
    CANCELLED = "cancelled"


class MemberLevel(str, enum.Enum):
    NORMAL = "normal"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    member_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True)
    gender = Column(String(10))
    birthday = Column(Date)
    level = Column(Enum(MemberLevel), default=MemberLevel.NORMAL)
    status = Column(Enum(MemberStatus), default=MemberStatus.ACTIVE)
    join_date = Column(Date, nullable=False)
    coach_id = Column(Integer, index=True)
    coach_name = Column(String(100))
    total_purchased_amount = Column(Float, default=0.0)
    total_used_sessions = Column(Integer, default=0)
    remaining_sessions = Column(Integer, default=0)
    last_visit_date = Column(Date)
    next_expiry_date = Column(Date, index=True)
    renewal_warning_days = Column(Integer, default=30)
    address = Column(Text)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
