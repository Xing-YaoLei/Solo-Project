from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship

from app.database import Base


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    event_level = Column(String(20), nullable=False, default="general")
    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=False)
    location = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    causes = Column(Text, nullable=True)
    injuries = Column(String(300), nullable=True)
    immediate_measures = Column(Text, nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    witnesses = Column(String(300), nullable=True)
    status = Column(String(20), nullable=False, default="reported")
    handling_result = Column(Text, nullable=True)
    follow_up_plan = Column(Text, nullable=True)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    elder = relationship("Elder", back_populates="risk_events")
    reported_by = relationship("User", back_populates="risk_events")
    incident_order = relationship("IncidentOrder", back_populates="risk_event", uselist=False)
