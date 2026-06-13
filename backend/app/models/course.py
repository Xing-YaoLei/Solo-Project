from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class CourseStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), index=True)
    coach_id = Column(Integer, index=True)
    coach_name = Column(String(100))
    course_type = Column(String(100))
    course_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(Enum(CourseStatus), default=CourseStatus.SCHEDULED)
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    is_verified = Column(Integer, default=0)
    verify_time = Column(DateTime)
    consume_sessions = Column(Integer, default=1)
    remark = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    member = relationship("Member", backref="courses")
    membership = relationship("Membership", backref="courses")
