from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    phone = Column(String(20))
    id_card = Column(String(20), unique=True)
    first_visit_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="patient")
    billing_records = relationship("BillingRecord", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    images = relationship("ImageRecord", back_populates="patient")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    department = Column(String(100))
    doctor = Column(String(100))
    treatment_type = Column(String(100))
    status = Column(String(20), default="scheduled")
    is_no_show = Column(Boolean, default=False)
    no_show_count = Column(Integer, default=0)
    source_system = Column(String(50), default="appointment_system")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)
    billing_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    billing_date = Column(DateTime, nullable=False)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_method = Column(String(50))
    treatment_items = Column(JSON)
    source_system = Column(String(50), default="billing_system")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="billing_records")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    doctor = Column(String(100))
    department = Column(String(100))
    chief_complaint = Column(Text)
    diagnosis = Column(Text)
    treatment_summary = Column(Text)
    prescription = Column(Text)
    source_system = Column(String(50), default="clinical_system")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_records")
    treatment_plans = relationship("TreatmentPlan", back_populates="medical_record")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(50), unique=True, index=True, nullable=False)
    record_id = Column(String(50), ForeignKey("medical_records.record_id"), nullable=False)
    plan_name = Column(String(200), nullable=False)
    plan_description = Column(Text)
    estimated_cost = Column(Float, default=0.0)
    priority = Column(String(20), default="normal")
    status = Column(String(20), default="pending")
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    medical_record = relationship("MedicalRecord", back_populates="treatment_plans")


class ImageRecord(Base):
    __tablename__ = "image_records"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    study_date = Column(DateTime, nullable=False)
    image_type = Column(String(50))
    body_part = Column(String(50))
    study_description = Column(String(200))
    study_instance_uid = Column(String(100))
    series_count = Column(Integer, default=0)
    image_count = Column(Integer, default=0)
    file_size_mb = Column(Float, default=0.0)
    storage_path = Column(String(500))
    source_system = Column(String(50), default="imaging_system")
    archive_status = Column(String(20), default="archived")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="images")


class WarningThreshold(Base):
    __tablename__ = "warning_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), unique=True, nullable=False)
    metric_code = Column(String(50), unique=True, nullable=False)
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float)
    operator = Column(String(10), default=">=")
    unit = Column(String(20))
    description = Column(Text)
    category = Column(String(50))
    is_enabled = Column(Boolean, default=True)
    created_by = Column(String(50))
    updated_by = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CaliberConflict(Base):
    __tablename__ = "caliber_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    conflict_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50))
    source_system_a = Column(String(50), nullable=False)
    source_system_b = Column(String(50), nullable=False)
    conflict_field = Column(String(100), nullable=False)
    value_a = Column(Text)
    value_b = Column(Text)
    conflict_date = Column(DateTime, default=datetime.utcnow)
    resolution_status = Column(String(20), default="pending")
    resolved_by = Column(String(50))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class NoShowReview(Base):
    __tablename__ = "no_show_reviews"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(50), nullable=False)
    appointment_id = Column(String(50))
    no_show_date = Column(DateTime, nullable=False)
    follow_up_rate = Column(Float, default=0.0)
    historical_no_show_count = Column(Integer, default=0)
    review_materials = Column(JSON)
    review_status = Column(String(20), default="pending")
    reviewer = Column(String(50))
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
