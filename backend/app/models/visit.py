from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship

from app.database import Base


class VisitRecord(Base):
    __tablename__ = "visit_records"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    visitor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    visit_date = Column(Date, nullable=False)
    visit_time = Column(Time, nullable=False)
    visit_duration = Column(Integer, nullable=True)
    visit_type = Column(String(50), nullable=False, default="routine")
    visitor_name = Column(String(100), nullable=True)
    visitor_relation = Column(String(50), nullable=True)
    physical_condition = Column(String(200), nullable=True)
    mental_condition = Column(String(200), nullable=True)
    conversation_content = Column(Text, nullable=True)
    needs_follow_up = Column(String(300), nullable=True)
    elder_mood = Column(String(50), nullable=True)
    remark = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    elder = relationship("Elder", back_populates="visit_records")
    visitor = relationship("User", back_populates="visit_records")
