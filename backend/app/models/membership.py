from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class MembershipType(str, enum.Enum):
    PRIVATE_COACHING = "private_coaching"
    GROUP_CLASS = "group_class"
    COMBO = "combo"


class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    USED_UP = "used_up"
    EXPIRED = "expired"
    FROZEN = "frozen"


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_no = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(MembershipType), default=MembershipType.PRIVATE_COACHING)
    name = Column(String(200), nullable=False)
    total_sessions = Column(Integer, nullable=False, default=0)
    used_sessions = Column(Integer, default=0)
    remaining_sessions = Column(Integer, default=0)
    total_amount = Column(Float, nullable=False, default=0.0)
    unit_price = Column(Float, default=0.0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.ACTIVE)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    source_membership_id = Column(Integer, ForeignKey("memberships.id"))
    is_renewal = Column(Integer, default=0)
    remark = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    member = relationship("Member", backref="memberships")
