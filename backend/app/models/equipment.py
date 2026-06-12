from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_code = Column(String(50), unique=True, index=True, nullable=False)
    store_name = Column(String(200), nullable=False)
    region = Column(String(100))
    city = Column(String(100))
    address = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipments = relationship("Equipment", back_populates="store")

class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(Integer, primary_key=True, index=True)
    equipment_code = Column(String(50), unique=True, index=True, nullable=False)
    equipment_name = Column(String(200), nullable=False)
    equipment_type = Column(String(100), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    model = Column(String(200))
    manufacturer = Column(String(200))
    install_date = Column(DateTime)
    last_maintenance_date = Column(DateTime)
    status = Column(String(50), default="online")
    last_heartbeat = Column(DateTime)
    offline_duration_minutes = Column(Integer, default=0)
    clean_risk_score = Column(Float, default=0.0)
    specs = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="equipments")
    status_logs = relationship("EquipmentStatusLog", back_populates="equipment")
    faults = relationship("FaultRecord", back_populates="equipment")
    tasks = relationship("RectificationTask", back_populates="equipment")
    inspections = relationship("InspectionRecord", back_populates="equipment")

class EquipmentStatusLog(Base):
    __tablename__ = "equipment_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=False)
    status = Column(String(50), nullable=False)
    event_time = Column(DateTime, nullable=False, index=True)
    reason = Column(String(500))
    is_offline_gap = Column(Boolean, default=False)
    gap_start_time = Column(DateTime)
    gap_end_time = Column(DateTime)
    sample_data_ref = Column(String(200))
    metrics = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="status_logs")

class SyncDelayLog(Base):
    __tablename__ = "sync_delay_logs"

    id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String(50), nullable=False)
    source_system = Column(String(100))
    expected_sync_time = Column(DateTime, nullable=False)
    actual_sync_time = Column(DateTime)
    delay_minutes = Column(Integer, default=0)
    affected_date = Column(DateTime, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    description = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
