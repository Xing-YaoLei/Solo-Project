from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base
import enum
from sqlalchemy import Enum as SAEnum


class RoleEnum(enum.Enum):
    ADMIN = "admin"
    OPERATION_MANAGER = "operation_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(SAEnum(RoleEnum), default=RoleEnum.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PerformanceSchedule(Base):
    __tablename__ = "performance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    performance_name = Column(String(200), nullable=False)
    venue = Column(String(100))
    performance_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_seats = Column(Integer, default=0)
    status = Column(String(50), default="scheduled")
    risk_level = Column(String(20), default="normal")
    risk_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    seat_allocations = relationship("SeatAllocation", back_populates="schedule")
    orders = relationship("Order", back_populates="schedule")
    checkins = relationship("CheckinRecord", back_populates="schedule")
    sponsors = relationship("Sponsor", back_populates="schedule")


class SeatAllocation(Base):
    __tablename__ = "seat_allocations"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("performance_schedules.id"), nullable=False)
    seat_zone = Column(String(50))
    seat_number = Column(String(20))
    seat_type = Column(String(50))
    price = Column(Numeric(10, 2))
    status = Column(String(30), default="available")
    order_id = Column(Integer, ForeignKey("orders.id"))
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    schedule = relationship("PerformanceSchedule", back_populates="seat_allocations")
    order = relationship("Order", back_populates="seats")


class OrderSourceEnum(enum.Enum):
    MINIAPP = "miniapp"
    MERCHANT = "merchant"
    ONSITE = "onsite"
    SPONSOR = "sponsor"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("performance_schedules.id"), nullable=False)
    order_no = Column(String(100), unique=True, index=True, nullable=False)
    source = Column(SAEnum(OrderSourceEnum), default=OrderSourceEnum.MINIAPP)
    user_id = Column(String(100))
    user_name = Column(String(100))
    user_phone = Column(String(20))
    total_amount = Column(Numeric(10, 2), default=0)
    ticket_count = Column(Integer, default=0)
    status = Column(String(30), default="pending")
    paid_at = Column(DateTime(timezone=True))
    merchant_id = Column(String(50))
    merchant_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedule = relationship("PerformanceSchedule", back_populates="orders")
    seats = relationship("SeatAllocation", back_populates="order")
    checkins = relationship("CheckinRecord", back_populates="order")
    sign_codes = relationship("SignCode", back_populates="order")


class SignCodeTypeEnum(enum.Enum):
    QR = "qr"
    BARCODE = "barcode"
    NFC = "nfc"
    MANUAL = "manual"


class SignCode(Base):
    __tablename__ = "sign_codes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    code = Column(String(200), unique=True, index=True, nullable=False)
    code_type = Column(SAEnum(SignCodeTypeEnum), default=SignCodeTypeEnum.QR)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True))
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="sign_codes")


class CheckinRecord(Base):
    __tablename__ = "checkin_records"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("performance_schedules.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"))
    sign_code_id = Column(Integer, ForeignKey("sign_codes.id"))
    user_identifier = Column(String(100))
    checkin_time = Column(DateTime(timezone=True), server_default=func.now())
    checkin_channel = Column(String(50), default="staff")
    camera_verified = Column(Boolean, default=False)
    camera_snapshot_id = Column(String(100))
    is_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String(100))
    anomaly_description = Column(Text)
    staff_id = Column(String(50))
    staff_name = Column(String(100))
    extra_data = Column(JSON)

    schedule = relationship("PerformanceSchedule", back_populates="checkins")
    order = relationship("Order", back_populates="checkins")


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("performance_schedules.id"), nullable=False)
    sponsor_name = Column(String(200), nullable=False)
    sponsor_type = Column(String(50))
    sponsorship_level = Column(String(50))
    contribution_amount = Column(Numeric(12, 2), default=0)
    in_kind_items = Column(Text)
    ticket_allocation = Column(Integer, default=0)
    contact_person = Column(String(100))
    contact_phone = Column(String(20))
    contract_no = Column(String(100))
    status = Column(String(30), default="confirmed")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedule = relationship("PerformanceSchedule", back_populates="sponsors")


class CameraStatistic(Base):
    __tablename__ = "camera_statistics"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("performance_schedules.id"))
    camera_id = Column(String(100))
    camera_location = Column(String(200))
    timestamp = Column(DateTime(timezone=True), nullable=False)
    people_count = Column(Integer, default=0)
    in_count = Column(Integer, default=0)
    out_count = Column(Integer, default=0)
    snapshot_url = Column(String(500))
    raw_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MetricDefinition(Base):
    __tablename__ = "metric_definitions"

    id = Column(Integer, primary_key=True, index=True)
    metric_code = Column(String(100), unique=True, index=True, nullable=False)
    metric_name = Column(String(200), nullable=False)
    category = Column(String(100))
    definition = Column(Text, nullable=False)
    calculation_formula = Column(Text)
    unit = Column(String(50))
    data_source = Column(String(200))
    refresh_frequency = Column(String(50))
    version = Column(String(20), default="1.0")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DataRefreshLog(Base):
    __tablename__ = "data_refresh_logs"

    id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String(100), nullable=False)
    source = Column(String(100))
    records_processed = Column(Integer, default=0)
    status = Column(String(30), default="success")
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShareToken(Base):
    __tablename__ = "share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(200), unique=True, index=True, nullable=False)
    view_name = Column(String(200), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    allowed_role = Column(SAEnum(RoleEnum))
    expires_at = Column(DateTime(timezone=True))
    filters = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
