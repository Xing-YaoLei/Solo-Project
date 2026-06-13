from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class VerificationType(str, enum.Enum):
    COURSE = "course"
    ACCESS = "access"
    MANUAL = "manual"


class CourseRecord(Base):
    __tablename__ = "course_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    verification_type = Column(Enum(VerificationType), default=VerificationType.COURSE)
    consume_sessions = Column(Integer, default=1)
    consume_before = Column(Integer, default=0)
    consume_after = Column(Integer, default=0)
    operator_id = Column(Integer)
    operator_name = Column(String(100))
    verify_time = Column(DateTime, index=True)
    device_id = Column(String(100))
    device_location = Column(String(200))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member", backref="course_records")
    membership = relationship("Membership", backref="course_records")
    course = relationship("Course", backref="records")
