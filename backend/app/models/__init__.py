from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text, Date, JSON, Enum as SQLEnum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from enum import Enum
import uuid

from ..database import Base


class RoleEnum(str, Enum):
    TOURIST = "tourist"
    TICKET_CLERK = "ticket_clerk"
    PATROL = "patrol"
    OPERATION = "operation"
    ADMIN = "admin"


class RecordStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ExceptionTypeEnum(str, Enum):
    PERFORMANCE_CANCEL = "performance_cancel"
    ROUTE_CHANGE = "route_change"
    EQUIPMENT_FAILURE = "equipment_failure"
    WEATHER_ISSUE = "weather_issue"
    STAFF_ABSENCE = "staff_absence"
    OTHER = "other"


class AuditActionEnum(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    CANCEL = "cancel"
    BATCH_UPDATE = "batch_update"
    VERIFY = "verify"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.TOURIST, nullable=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_records = relationship("AuditLog", foreign_keys="AuditLog.user_id", back_populates="user")
    tickets = relationship("Ticket", back_populates="owner")
    secondary_sales = relationship("SecondarySale", back_populates="salesperson")


class GuideRoute(Base):
    __tablename__ = "guide_routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, default=60)
    distance_meters = Column(Float, default=0)
    cover_image = Column(String(500))
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.DRAFT, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    heat_points = relationship("HeatPoint", back_populates="route", order_by="HeatPoint.sort_order")
    contents = relationship("GuideContent", back_populates="route", order_by="GuideContent.sort_order")
    tickets = relationship("Ticket", back_populates="route")


class HeatPoint(Base):
    __tablename__ = "heat_points"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("guide_routes.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=50)
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    verified_at = Column(DateTime, index=True)
    verified_by = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    route = relationship("GuideRoute", back_populates="heat_points")
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.record_type=='heat_point', foreign(Attachment.record_id)==HeatPoint.id)", viewonly=True)


class GuideContent(Base):
    __tablename__ = "guide_contents"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("guide_routes.id"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    content_type = Column(String(50), default="text", index=True)
    content_text = Column(Text)
    audio_url = Column(String(500))
    video_url = Column(String(500))
    language = Column(String(10), default="zh-CN")
    sort_order = Column(Integer, default=0)
    verified_at = Column(DateTime, index=True)
    verified_by = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    route = relationship("GuideRoute", back_populates="contents")
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.record_type=='guide_content', foreign(Attachment.record_id)==GuideContent.id)", viewonly=True)


class Performance(Base):
    __tablename__ = "performances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    venue = Column(String(200))
    description = Column(Text)
    duration_minutes = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    sessions = relationship("PerformanceSession", back_populates="performance")


class PerformanceSession(Base):
    __tablename__ = "performance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    performance_id = Column(Integer, ForeignKey("performances.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime)
    total_seats = Column(Integer, default=0)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    performance = relationship("Performance", back_populates="sessions")
    seats = relationship("Seat", back_populates="session", cascade="all, delete-orphan")
    exception_records = relationship("ExceptionRecord", primaryjoin="and_(ExceptionRecord.related_type=='performance_session', foreign(ExceptionRecord.related_id)==PerformanceSession.id)", viewonly=True)


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("performance_sessions.id"), nullable=False, index=True)
    row = Column(String(10), nullable=False)
    number = Column(String(10), nullable=False)
    zone = Column(String(50), index=True)
    price = Column(Float, default=0)
    is_available = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    verified_at = Column(DateTime, index=True)
    verified_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("PerformanceSession", back_populates="seats")
    ticket = relationship("Ticket", back_populates="seat", uselist=False)

    __table_args__ = (
        UniqueConstraint("session_id", "row", "number", name="uq_seat_session_row_number"),
    )


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_name = Column(String(100))
    contact_phone = Column(String(20))
    address = Column(String(300))
    category = Column(String(50), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    contracts = relationship("MerchantContract", back_populates="merchant")


class MerchantContract(Base):
    __tablename__ = "merchant_contracts"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    contract_no = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(300), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, index=True)
    amount = Column(Float, default=0)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    verified_at = Column(DateTime, index=True)
    verified_by = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    merchant = relationship("Merchant", back_populates="contracts")
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.record_type=='merchant_contract', foreign(Attachment.record_id)==MerchantContract.id)", viewonly=True)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String(100), unique=True, index=True, nullable=False)
    route_id = Column(Integer, ForeignKey("guide_routes.id"), index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    buyer_name = Column(String(100))
    buyer_phone = Column(String(20))
    ticket_type = Column(String(50), default="adult", index=True)
    price = Column(Float, default=0)
    sold_at = Column(DateTime, index=True)
    sold_by = Column(Integer, ForeignKey("users.id"), index=True)
    used_at = Column(DateTime, index=True)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    route = relationship("GuideRoute", back_populates="tickets")
    seat = relationship("Seat", back_populates="ticket")
    owner = relationship("User", back_populates="tickets")
    secondary_sales = relationship("SecondarySale", back_populates="ticket")


class SecondarySale(Base):
    __tablename__ = "secondary_sales"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    ticket_no = Column(String(100), index=True)
    item_name = Column(String(200), nullable=False)
    item_category = Column(String(50), index=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    salesperson_id = Column(Integer, ForeignKey("users.id"), index=True)
    sale_channel = Column(String(50), index=True)
    sold_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="secondary_sales")
    salesperson = relationship("User", back_populates="secondary_sales")


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(Integer, primary_key=True, index=True)
    exception_type = Column(SQLEnum(ExceptionTypeEnum), nullable=False, index=True)
    related_type = Column(String(50), index=True)
    related_id = Column(Integer, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    root_cause = Column(Text)
    resolution = Column(Text)
    status = Column(SQLEnum(RecordStatusEnum), default=RecordStatusEnum.PENDING, index=True)
    original_record_type = Column(String(50))
    original_record_id = Column(Integer)
    occurred_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, index=True)
    handled_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)

    __table_args__ = (
        Index("ix_exception_related", "related_type", "related_id"),
        Index("ix_exception_original", "original_record_type", "original_record_id"),
    )


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    record_type = Column(String(50), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    file_name = Column(String(300), nullable=False)
    original_name = Column(String(300))
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100))
    uploaded_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_attachment_record", "record_type", "record_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(SQLEnum(AuditActionEnum), nullable=False, index=True)
    record_type = Column(String(50), index=True)
    record_id = Column(Integer, index=True)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    batch_ids = Column(JSON, default=list)
    remarks = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="created_records")

    __table_args__ = (
        Index("ix_audit_record", "record_type", "record_id"),
    )
