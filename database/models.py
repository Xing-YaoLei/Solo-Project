from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    gender = Column(String(10))
    age = Column(Integer)
    admission_date = Column(Date)
    discharge_date = Column(Date, nullable=True)
    primary_diagnosis = Column(String(200))
    attending_physician = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assessments = relationship("RehabAssessment", back_populates="patient")
    treatments = relationship("TreatmentRecord", back_populates="patient")
    plans = relationship("TreatmentPlan", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    payments = relationship("PaymentRecord", back_populates="patient")
    attendances = relationship("AttendanceRecord", back_populates="patient")
    claims = relationship("InsuranceClaim", back_populates="patient")


class RehabAssessment(Base):
    __tablename__ = "rehab_assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    assessment_date = Column(Date)
    assessment_type = Column(String(100))
    assessor = Column(String(100))
    pain_score = Column(Float)
    mobility_score = Column(Float)
    adl_score = Column(Float)
    cognitive_score = Column(Float)
    overall_score = Column(Float)
    risk_level = Column(String(20))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="assessments")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    plan_date = Column(Date)
    treatment_type = Column(String(100))
    planned_sessions = Column(Integer)
    completed_sessions = Column(Integer, default=0)
    therapist = Column(String(100))
    frequency = Column(String(50))
    duration_per_session = Column(Integer)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="plans")


class TreatmentRecord(Base):
    __tablename__ = "treatment_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    treatment_date = Column(Date)
    treatment_type = Column(String(100))
    therapist = Column(String(100))
    duration = Column(Integer)
    equipment_used = Column(String(200), nullable=True)
    pain_before = Column(Float)
    pain_after = Column(Float)
    progress_notes = Column(Text)
    is_completed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="treatments")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    record_date = Column(Date)
    record_type = Column(String(100))
    content = Column(Text)
    is_complete = Column(Boolean, default=False)
    missing_fields = Column(JSON, nullable=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_records")


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    payment_date = Column(Date)
    due_date = Column(Date)
    amount = Column(Float)
    payment_type = Column(String(50))
    status = Column(String(20))
    is_delayed = Column(Boolean, default=False)
    delay_days = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="payments")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    attendance_date = Column(Date)
    punch_in = Column(DateTime, nullable=True)
    punch_out = Column(DateTime, nullable=True)
    is_present = Column(Boolean, default=False)
    caliber_version = Column(String(20), default="v1")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="attendances")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    type = Column(String(50))
    location = Column(String(100))
    status = Column(String(20))
    last_maintenance = Column(Date, nullable=True)
    next_maintenance = Column(Date, nullable=True)
    utilization_rate = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NursingLog(Base):
    __tablename__ = "nursing_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50))
    log_date = Column(Date)
    log_time = Column(String(20))
    nurse = Column(String(100))
    vital_signs = Column(JSON, nullable=True)
    nursing_measures = Column(Text)
    patient_response = Column(Text)
    abnormalities = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"))
    claim_date = Column(Date)
    claim_amount = Column(Float)
    approved_amount = Column(Float, nullable=True)
    rejected_amount = Column(Float, default=0)
    status = Column(String(20))
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="claims")


class AnomalyMarker(Base):
    __tablename__ = "anomaly_markers"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_type = Column(String(50))
    marker_date = Column(Date)
    severity = Column(String(20))
    description = Column(Text)
    affected_records = Column(JSON, nullable=True)
    related_claim_id = Column(Integer, ForeignKey("insurance_claims.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("InsuranceClaim")


class ReviewNote(Base):
    __tablename__ = "review_notes"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_marker_id = Column(Integer, ForeignKey("anomaly_markers.id"))
    review_date = Column(Date)
    reviewer = Column(String(100))
    content = Column(Text)
    action_items = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    anomaly_marker = relationship("AnomalyMarker")


class DailyMetrics(Base):
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_date = Column(Date, unique=True, index=True)
    treatment_completion_rate = Column(Float)
    payment_delay_rate = Column(Float)
    medical_record_completeness = Column(Float)
    punch_card_consistency = Column(Float)
    insurance_rejection_rate = Column(Float)
    overall_risk_score = Column(Float)
    anomaly_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
