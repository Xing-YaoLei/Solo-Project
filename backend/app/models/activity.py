from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    activity_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    activity_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_participants = Column(Integer, nullable=True)
    instructor = Column(String(100), nullable=True)
    equipment_needed = Column(Text, nullable=True)
    risk_level = Column(String(20), nullable=False, default="low")
    status = Column(String(20), nullable=False, default="scheduled")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sign_ins = relationship("ActivitySignIn", back_populates="activity", cascade="all, delete-orphan")


class ActivitySignIn(Base):
    __tablename__ = "activity_sign_ins"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    sign_in_time = Column(DateTime, nullable=True)
    sign_out_time = Column(DateTime, nullable=True)
    sign_in_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    participation_status = Column(String(20), nullable=False, default="signed_in")
    health_before = Column(String(200), nullable=True)
    health_after = Column(String(200), nullable=True)
    performance_rating = Column(Integer, nullable=True)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activity = relationship("Activity", back_populates="sign_ins")
    elder = relationship("Elder", back_populates="activity_sign_ins")
    sign_in_by = relationship("User", back_populates="activity_sign_ins")
