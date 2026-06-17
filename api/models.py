from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, Boolean,
)
from sqlalchemy.orm import relationship
from api.database import Base


class Department(Base):
    __tablename__ = "department"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)

    therapists = relationship("Therapist", back_populates="department")
    patients = relationship("Patient", back_populates="department")


class Therapist(Base):
    __tablename__ = "therapist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    title = Column(String(50))
    specialty = Column(String(100))

    department = relationship("Department", back_populates="therapists")
    sessions = relationship("TreatmentSession", back_populates="therapist")


class Patient(Base):
    __tablename__ = "patient"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    age = Column(Integer)
    diagnosis = Column(String(200))
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    admission_date = Column(Date)
    insurance_type = Column(String(50))

    department = relationship("Department", back_populates="patients")
    assessments = relationship("AssessmentScale", back_populates="patient")
    prescriptions = relationship("TrainingPrescription", back_populates="patient")
    sessions = relationship("TreatmentSession", back_populates="patient")
    check_ins = relationship("CheckInRecord", back_populates="patient")
    settlements = relationship("Settlement", back_populates="patient")


class AssessmentScale(Base):
    __tablename__ = "assessment_scale"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    scale_name = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    assessed_at = Column(Date, nullable=False)

    patient = relationship("Patient", back_populates="assessments")


class TrainingPrescription(Base):
    __tablename__ = "training_prescription"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    content = Column(Text, nullable=False)
    frequency = Column(String(100))
    prescribed_at = Column(Date, nullable=False)

    patient = relationship("Patient", back_populates="prescriptions")


class TreatmentSession(Base):
    __tablename__ = "treatment_session"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapist.id"), nullable=False)
    treatment_date = Column(Date, nullable=False)
    duration_minutes = Column(Integer)
    status = Column(String(50), default="completed")

    patient = relationship("Patient", back_populates="sessions")
    therapist = relationship("Therapist", back_populates="sessions")


class CheckInRecord(Base):
    __tablename__ = "check_in_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_in_time = Column(String(20))

    patient = relationship("Patient", back_populates="check_ins")


class EquipmentRecord(Base):
    __tablename__ = "equipment_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_name = Column(String(200), nullable=False)
    usage_count = Column(Integer, default=0)
    record_date = Column(Date, nullable=False)
    department_id = Column(Integer, ForeignKey("department.id"))


class Settlement(Base):
    __tablename__ = "settlement"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    settlement_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    insurance_amount = Column(Float, nullable=False)
    self_paid_amount = Column(Float, nullable=False)
    settlement_type = Column(String(50))
    status = Column(String(50), default="settled")

    patient = relationship("Patient", back_populates="settlements")


class RejectionRecord(Base):
    __tablename__ = "rejection_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    rejection_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    remark = Column(Text)
    conclusion = Column(String(100))

    patient = relationship("Patient")


class RemarkTask(Base):
    __tablename__ = "remark_task"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rejection_id = Column(Integer, ForeignKey("rejection_record.id"), nullable=False)
    assigned_to = Column(String(100))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    completed = Column(Boolean, default=False)

    rejection = relationship("RejectionRecord")


class SavedView(Base):
    __tablename__ = "saved_view"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    config = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
