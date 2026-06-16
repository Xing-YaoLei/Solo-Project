from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False, default="nurse")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="user")
    created_elders = relationship("Elder", back_populates="creator")
    visit_records = relationship("VisitRecord", back_populates="visitor")
    activity_sign_ins = relationship("ActivitySignIn", back_populates="sign_in_by")
    risk_events = relationship("RiskEvent", back_populates="reported_by")
    incident_orders = relationship("IncidentOrder", back_populates="reported_by")
