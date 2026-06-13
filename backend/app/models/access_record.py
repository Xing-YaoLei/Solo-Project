from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class AccessType(str, enum.Enum):
    ENTRY = "entry"
    EXIT = "exit"


class AccessRecord(Base):
    __tablename__ = "access_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), index=True)
    member_no = Column(String(50), index=True)
    member_name = Column(String(100))
    access_type = Column(Enum(AccessType), default=AccessType.ENTRY)
    access_time = Column(DateTime, nullable=False, index=True)
    access_date = Column(Date, nullable=False, index=True)
    device_id = Column(String(100))
    device_location = Column(String(200))
    verification_method = Column(String(50))
    is_success = Column(Integer, default=1)
    fail_reason = Column(String(200))
    temperature = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member", backref="access_records")
