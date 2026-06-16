from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Date, Float
from sqlalchemy.orm import relationship

from app.database import Base


class Elder(Base):
    __tablename__ = "elders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    birth_date = Column(Date, nullable=False)
    id_card = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    address = Column(String(300), nullable=True)
    health_status = Column(String(50), nullable=False, default="stable")
    care_level = Column(String(50), nullable=False, default="basic")
    room_number = Column(String(20), nullable=True)
    bed_number = Column(String(20), nullable=True)
    admission_date = Column(Date, nullable=True)
    medical_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    dietary_restrictions = Column(Text, nullable=True)
    mobility_level = Column(String(50), nullable=True)
    cognitive_level = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="active")
    avatar_url = Column(String(500), nullable=True)
    remark = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="created_elders")
    medications = relationship("Medication", back_populates="elder", cascade="all, delete-orphan")
    visit_records = relationship("VisitRecord", back_populates="elder", cascade="all, delete-orphan")
    activity_sign_ins = relationship("ActivitySignIn", back_populates="elder", cascade="all, delete-orphan")
    risk_events = relationship("RiskEvent", back_populates="elder", cascade="all, delete-orphan")
    incident_orders = relationship("IncidentOrder", back_populates="elder", cascade="all, delete-orphan")
