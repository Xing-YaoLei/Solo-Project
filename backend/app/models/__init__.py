from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class PointStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class CleaningStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    SUPPLEMENT_INFO = "supplement_info"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    CLOSED = "closed"


class SourceChannel(str, enum.Enum):
    ROUTINE_INSPECTION = "routine_inspection"
    DEVICE_ALERT = "device_alert"
    MANUAL_REPORT = "manual_report"
    STORE_REQUEST = "store_request"


class CloseReason(str, enum.Enum):
    QUALIFIED = "qualified"
    DEVICE_REPLACED = "device_replaced"
    POINT_CLOSED = "point_closed"
    OTHER = "other"


class StorePoint(Base):
    __tablename__ = "store_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    store_code = Column(String(50), unique=True, index=True)
    region = Column(String(50))
    status = Column(Enum(PointStatus, values_callable=lambda x: [e.value for e in x]), default=PointStatus.ACTIVE)
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    devices = relationship("Device", back_populates="store_point")
    cleaning_records = relationship("CleaningRecord", back_populates="store_point")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_code = Column(String(50), unique=True, index=True, nullable=False)
    device_name = Column(String(100), nullable=False)
    device_type = Column(String(50))
    store_point_id = Column(Integer, ForeignKey("store_points.id"))
    status = Column(Enum(DeviceStatus, values_callable=lambda x: [e.value for e in x]), default=DeviceStatus.UNKNOWN)
    last_heartbeat = Column(DateTime(timezone=True))
    installation_date = Column(DateTime(timezone=True))
    last_maintenance_date = Column(DateTime(timezone=True))
    specifications = Column(JSON, default=dict)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store_point = relationship("StorePoint", back_populates="devices")
    cleaning_records = relationship("CleaningRecord", back_populates="device")


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    employee_id = Column(String(50), unique=True, index=True)
    role = Column(String(50))
    phone = Column(String(20))
    email = Column(String(100))
    department = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CleaningRecord(Base):
    __tablename__ = "cleaning_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    store_point_id = Column(Integer, ForeignKey("store_points.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    source_channel = Column(Enum(SourceChannel, values_callable=lambda x: [e.value for e in x]), default=SourceChannel.ROUTINE_INSPECTION)
    status = Column(Enum(CleaningStatus, values_callable=lambda x: [e.value for e in x]), default=CleaningStatus.DRAFT)

    cleaning_date = Column(DateTime(timezone=True))
    cleaning_person_id = Column(Integer, ForeignKey("persons.id"))
    cleaning_items = Column(JSON, default=list)
    cleaning_photos = Column(JSON, default=list)
    cleaning_remarks = Column(Text)

    reviewer_id = Column(Integer, ForeignKey("persons.id"))
    review_date = Column(DateTime(timezone=True))
    review_result = Column(String(20))
    review_remarks = Column(Text)
    review_photos = Column(JSON, default=list)

    inspection_result = Column(String(20))
    qualified_rate = Column(Float)

    close_reason = Column(Enum(CloseReason, values_callable=lambda x: [e.value for e in x]))
    close_remarks = Column(Text)
    closed_at = Column(DateTime(timezone=True))
    closed_by_id = Column(Integer, ForeignKey("persons.id"))

    is_device_offline = Column(Boolean, default=False)
    offline_handled = Column(Boolean, default=False)
    offline_remarks = Column(Text)

    supplement_notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store_point = relationship("StorePoint", back_populates="cleaning_records")
    device = relationship("Device", back_populates="cleaning_records")
    cleaning_person = relationship("Person", foreign_keys=[cleaning_person_id])
    reviewer = relationship("Person", foreign_keys=[reviewer_id])
    closed_by = relationship("Person", foreign_keys=[closed_by_id])

    status_logs = relationship("StatusLog", back_populates="cleaning_record", cascade="all, delete-orphan")


class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_record_id = Column(Integer, ForeignKey("cleaning_records.id"), nullable=False)
    from_status = Column(Enum(CleaningStatus, values_callable=lambda x: [e.value for e in x]))
    to_status = Column(Enum(CleaningStatus, values_callable=lambda x: [e.value for e in x]), nullable=False)
    operator_id = Column(Integer, ForeignKey("persons.id"))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cleaning_record = relationship("CleaningRecord", back_populates="status_logs")
    operator = relationship("Person", foreign_keys=[operator_id])
