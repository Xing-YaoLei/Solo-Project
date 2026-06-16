from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship

from app.database import Base


class IncidentOrder(Base):
    __tablename__ = "incident_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    risk_event_id = Column(Integer, ForeignKey("risk_events.id"), nullable=True, unique=True)
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="serious")
    incident_date = Column(Date, nullable=False)
    incident_time = Column(Time, nullable=False)
    location = Column(String(200), nullable=True)

    impact_scope = Column(Text, nullable=False)
    responsibility = Column(Text, nullable=False)
    responsible_person = Column(String(100), nullable=True)
    handling_result = Column(Text, nullable=False)
    preventive_measures = Column(Text, nullable=True)

    description = Column(Text, nullable=False)
    immediate_actions = Column(Text, nullable=True)
    medical_treatment = Column(Text, nullable=True)
    family_notified = Column(String(10), nullable=False, default="unknown")
    family_notification_time = Column(DateTime, nullable=True)
    family_response = Column(Text, nullable=True)

    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    handled_by = Column(String(100), nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    closure_date = Column(Date, nullable=True)

    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    elder = relationship("Elder", back_populates="incident_orders")
    risk_event = relationship("RiskEvent", back_populates="incident_order")
    reported_by = relationship("User", back_populates="incident_orders")
