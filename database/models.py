import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Numeric,
    Text,
    Boolean,
    ForeignKey,
    Enum,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from .connection import Base


class AppointmentStatus(str, enum.Enum):
    BOOKED = "已预约"
    CONFIRMED = "已确认"
    ARRIVED = "已到院"
    COMPLETED = "已完成"
    NO_SHOW = "爽约"
    CANCELLED = "已取消"


class AnomalyType(str, enum.Enum):
    APPOINTMENT_DELAY = "预约表延迟"
    MISSING_PAYMENT = "收费记录缺失"
    HIS_CALIBER_CHANGE = "HIS口径变化"
    DATA_INCONSISTENCY = "数据不一致"
    ABNORMAL_AMOUNT = "金额异常"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    patient_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(64), nullable=False)
    gender = Column(String(16))
    birth_date = Column(Date)
    age = Column(Integer)
    phone = Column(String(32))
    id_card = Column(String(32))
    address = Column(Text)
    first_visit_date = Column(Date)
    last_visit_date = Column(Date)
    total_visits = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    appointments = relationship("Appointment", back_populates="patient")
    payments = relationship("PaymentDetail", back_populates="patient")
    images = relationship("ImageAttachment", back_populates="patient")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    appointment_no = Column(String(64), unique=True, index=True, nullable=False)
    patient_id = Column(String(64), ForeignKey("patients.patient_id"), index=True, nullable=False)
    appointment_date = Column(Date, index=True, nullable=False)
    appointment_time = Column(String(16))
    department = Column(String(64))
    doctor = Column(String(64))
    treatment_type = Column(String(64), index=True, nullable=False)
    service_item = Column(String(128))
    status = Column(Enum(AppointmentStatus), index=True, nullable=False)
    source = Column(String(64))
    channel = Column(String(64))
    is_cleaning = Column(Boolean, default=False, index=True)
    amount = Column(Numeric(10, 2), default=0)
    paid_amount = Column(Numeric(10, 2), default=0)
    arrival_time = Column(DateTime)
    completion_time = Column(DateTime)
    cancel_time = Column(DateTime)
    cancel_reason = Column(Text)
    no_show_reason = Column(Text)
    remark = Column(Text)
    his_sync_time = Column(DateTime, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    patient = relationship("Patient", back_populates="appointments")
    payments = relationship("PaymentDetail", back_populates="appointment")
    anomalies = relationship("AnomalyMarker", back_populates="appointment")

    __table_args__ = (
        Index("idx_appt_date_type_status", "appointment_date", "treatment_type", "status"),
    )


class PaymentDetail(Base):
    __tablename__ = "payment_details"

    id = Column(Integer, primary_key=True)
    payment_no = Column(String(64), unique=True, index=True, nullable=False)
    appointment_no = Column(String(64), ForeignKey("appointments.appointment_no"), index=True)
    patient_id = Column(String(64), ForeignKey("patients.patient_id"), index=True)
    payment_date = Column(Date, index=True, nullable=False)
    payment_time = Column(DateTime)
    item_code = Column(String(64))
    item_name = Column(String(128), nullable=False)
    item_type = Column(String(64))
    quantity = Column(Numeric(10, 2), default=1)
    unit_price = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    actual_amount = Column(Numeric(10, 2), default=0)
    payment_method = Column(String(32))
    invoice_no = Column(String(64))
    operator = Column(String(64))
    is_cleaning_related = Column(Boolean, default=False, index=True)
    remark = Column(Text)
    his_sync_time = Column(DateTime, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    patient = relationship("Patient", back_populates="payments")
    appointment = relationship("Appointment", back_populates="payments")
    remarks = relationship("Remark", back_populates="payment")
    anomalies = relationship("AnomalyMarker", back_populates="payment")


class ImageAttachment(Base):
    __tablename__ = "image_attachments"

    id = Column(Integer, primary_key=True)
    image_no = Column(String(64), unique=True, index=True, nullable=False)
    patient_id = Column(String(64), ForeignKey("patients.patient_id"), index=True)
    appointment_no = Column(String(64), ForeignKey("appointments.appointment_no"), index=True)
    image_type = Column(String(64))
    image_category = Column(String(64))
    file_path = Column(String(512))
    file_name = Column(String(256))
    file_size = Column(Integer)
    upload_date = Column(DateTime)
    description = Column(Text)
    is_cleaning_related = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", back_populates="images")


class AnomalyMarker(Base):
    __tablename__ = "anomaly_markers"

    id = Column(Integer, primary_key=True)
    anomaly_type = Column(Enum(AnomalyType), index=True, nullable=False)
    severity = Column(String(16), default="warning")
    appointment_no = Column(String(64), ForeignKey("appointments.appointment_no"), index=True)
    payment_id = Column(Integer, ForeignKey("payment_details.id"), index=True)
    detected_at = Column(DateTime, default=datetime.now, index=True)
    description = Column(Text, nullable=False)
    data_snapshot = Column(JSONB)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(String(64))
    resolution_note = Column(Text)
    review_context = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    appointment = relationship("Appointment", back_populates="anomalies")
    payment = relationship("PaymentDetail", back_populates="anomalies")
    remarks = relationship("Remark", back_populates="anomaly")


class Remark(Base):
    __tablename__ = "remarks"

    id = Column(Integer, primary_key=True)
    anomaly_id = Column(Integer, ForeignKey("anomaly_markers.id"), index=True)
    payment_id = Column(Integer, ForeignKey("payment_details.id"), index=True)
    author = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    is_review_note = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    anomaly = relationship("AnomalyMarker", back_populates="remarks")
    payment = relationship("PaymentDetail", back_populates="remarks")


class HisCaliberChange(Base):
    __tablename__ = "his_caliber_changes"

    id = Column(Integer, primary_key=True)
    change_date = Column(Date, index=True, nullable=False)
    field_name = Column(String(64), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    description = Column(Text)
    affected_count = Column(Integer)
    operator = Column(String(64))
    created_at = Column(DateTime, default=datetime.now)


class RefreshLog(Base):
    __tablename__ = "refresh_logs"

    id = Column(Integer, primary_key=True)
    refresh_type = Column(String(64), index=True)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime)
    status = Column(String(32), default="running")
    records_processed = Column(Integer, default=0)
    anomalies_detected = Column(Integer, default=0)
    error_message = Column(Text)
    data_source = Column(String(64))
    created_at = Column(DateTime, default=datetime.now)
