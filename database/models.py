from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Boolean, Float, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database.connection import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    patient_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    gender = Column(String(10))
    birth_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="patient")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True)
    doctor_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    department = Column(String(100))
    title = Column(String(50))
    is_active = Column(Boolean, default=True)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    appointment_no = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(String(20))
    procedure_type = Column(String(200), nullable=False, index=True)
    procedure_code = Column(String(50), index=True)
    status = Column(String(20), nullable=False, default="scheduled")
    status_changed_at = Column(DateTime)
    is_cleaning = Column(Boolean, default=False, index=True)
    source = Column(String(50), default="HIS")
    his_created_at = Column(DateTime)
    his_updated_at = Column(DateTime)
    synced_at = Column(DateTime)
    sync_delay_minutes = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    review_note = Column(Text)
    anomaly_flag = Column(String(50))

    patient = relationship("Patient", back_populates="appointments")
    treatment_plan = relationship("TreatmentPlan", back_populates="appointment", uselist=False)
    follow_up = relationship("FollowUpTask", back_populates="appointment", uselist=False)
    billing_record = relationship("BillingRecord", back_populates="appointment", uselist=False)
    imaging_records = relationship("ImagingRecord", back_populates="appointment")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True)
    plan_no = Column(String(50), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    plan_date = Column(Date, index=True)
    plan_content = Column(Text)
    estimated_fee = Column(Float)
    actual_fee = Column(Float)
    status = Column(String(20), default="pending")
    has_cleaning = Column(Boolean, default=False)
    cleaning_stage = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="treatment_plan")
    patient = relationship("Patient", back_populates="treatment_plans")


class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    id = Column(Integer, primary_key=True)
    task_no = Column(String(50), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True)
    task_date = Column(Date, index=True)
    task_type = Column(String(50))
    assigned_to = Column(String(100))
    status = Column(String(20), default="pending")
    completed_at = Column(DateTime)
    content = Column(Text)
    result_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="follow_up")


class ImagingRecord(Base):
    __tablename__ = "imaging_records"

    id = Column(Integer, primary_key=True)
    image_no = Column(String(50), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True)
    image_type = Column(String(50))
    image_date = Column(Date, index=True)
    storage_path = Column(String(500))
    file_hash = Column(String(100))
    upload_status = Column(String(20), default="uploaded")
    is_missing = Column(Boolean, default=False)
    missing_note = Column(String(200))
    checksum_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="imaging_records")


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True)
    billing_no = Column(String(50), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True)
    billing_date = Column(Date, index=True)
    total_amount = Column(Float)
    paid_amount = Column(Float)
    payment_method = Column(String(50))
    procedure_codes = Column(String(500))
    data_version = Column(String(20), default="v1")
    caliber_changed = Column(Boolean, default=False)
    caliber_change_note = Column(String(200))
    caliber_effective_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="billing_record")


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True)
    sync_type = Column(String(50), nullable=False, index=True)
    source_system = Column(String(50))
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime)
    records_count = Column(Integer, default=0)
    status = Column(String(20), default="running")
    error_message = Column(Text)
    delay_minutes = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


Index("idx_appt_cleaning_date", Appointment.is_cleaning, Appointment.appointment_date)
Index("idx_appt_status_date", Appointment.status, Appointment.appointment_date)
Index("idx_sync_type_status", SyncLog.sync_type, SyncLog.status)
