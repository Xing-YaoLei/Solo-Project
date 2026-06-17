from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text,
    Boolean, ForeignKey, UniqueConstraint, Index, Numeric
)
from sqlalchemy.orm import relationship
from app.utils.database import Base


class ElderProfile(Base):
    __tablename__ = "elder_profiles"

    id = Column(Integer, primary_key=True)
    elder_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    birth_date = Column(Date, nullable=False)
    id_card = Column(String(18), unique=True)
    phone = Column(String(20))
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(20))
    admission_date = Column(Date, nullable=False, index=True)
    discharge_date = Column(Date)
    room_number = Column(String(20))
    current_status = Column(String(20), default="在住", index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    assessments = relationship("AdmissionAssessment", back_populates="elder")
    medications = relationship("Medication", back_populates="elder")
    fall_incidents = relationship("FallIncident", back_populates="elder")
    review_notes = relationship("ReviewNote", back_populates="elder")


class AdmissionAssessment(Base):
    __tablename__ = "admission_assessments"
    __table_args__ = (
        Index("idx_elder_assessment_date", "elder_id", "assessment_date"),
    )

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elder_profiles.id"), nullable=False, index=True)
    assessment_date = Column(Date, nullable=False, index=True)
    care_level = Column(String(20), nullable=False, index=True)
    care_score = Column(Numeric(5, 2), nullable=False)
    physical_condition = Column(String(50))
    cognitive_status = Column(String(50))
    mobility_level = Column(String(50))
    self_care_ability = Column(String(50))
    nutritional_status = Column(String(50))
    assessor = Column(String(50))
    assessment_source = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    elder = relationship("ElderProfile", back_populates="assessments")


class AccessRecord(Base):
    __tablename__ = "access_records"
    __table_args__ = (
        Index("idx_elder_access_time", "elder_code", "access_time"),
    )

    id = Column(Integer, primary_key=True)
    elder_code = Column(String(50), nullable=False, index=True)
    access_time = Column(DateTime, nullable=False, index=True)
    access_type = Column(String(20), nullable=False)
    device_id = Column(String(50))
    location = Column(String(100))
    record_source = Column(String(50), default="门禁系统")
    sync_delay_seconds = Column(Integer, default=0)
    is_delayed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.now)


class CareTerminalRecord(Base):
    __tablename__ = "care_terminal_records"
    __table_args__ = (
        Index("idx_elder_terminal_date", "elder_code", "record_date"),
    )

    id = Column(Integer, primary_key=True)
    elder_code = Column(String(50), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    terminal_id = Column(String(50))
    care_item = Column(String(100))
    care_time = Column(DateTime)
    caregiver = Column(String(50))
    care_status = Column(String(20), default="已完成")
    record_source = Column(String(50), default="护理终端")
    is_missing = Column(Boolean, default=False, index=True)
    missing_reason = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)


class BillingRecord(Base):
    __tablename__ = "billing_records"
    __table_args__ = (
        Index("idx_elder_billing_date", "elder_code", "billing_date"),
        UniqueConstraint("elder_code", "billing_date", "billing_type", name="uq_elder_billing"),
    )

    id = Column(Integer, primary_key=True)
    elder_code = Column(String(50), nullable=False, index=True)
    billing_date = Column(Date, nullable=False, index=True)
    billing_type = Column(String(50), nullable=False)
    care_level_billed = Column(String(20), index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    billing_caliber_version = Column(String(20), default="v1.0", index=True)
    caliber_changed = Column(Boolean, default=False, index=True)
    change_note = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class FallIncident(Base):
    __tablename__ = "fall_incidents"
    __table_args__ = (
        Index("idx_elder_fall_date", "elder_id", "fall_time"),
    )

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elder_profiles.id"), nullable=False, index=True)
    fall_time = Column(DateTime, nullable=False, index=True)
    fall_location = Column(String(100))
    fall_cause = Column(String(200))
    injury_level = Column(String(50))
    injury_description = Column(Text)
    handled_by = Column(String(50))
    handle_measures = Column(Text)
    impact_scope_start = Column(DateTime)
    impact_scope_end = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)

    elder = relationship("ElderProfile", back_populates="fall_incidents")


class Medication(Base):
    __tablename__ = "medications"
    __table_args__ = (
        Index("idx_elder_medication", "elder_id", "medication_name"),
    )

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elder_profiles.id"), nullable=False, index=True)
    medication_name = Column(String(100), nullable=False)
    dosage = Column(String(50))
    frequency = Column(String(50))
    administration_route = Column(String(50))
    start_date = Column(Date)
    end_date = Column(Date)
    prescribing_doctor = Column(String(50))
    notes = Column(String(200))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    elder = relationship("ElderProfile", back_populates="medications")


class ReviewNote(Base):
    __tablename__ = "review_notes"
    __table_args__ = (
        Index("idx_elder_review_date", "elder_id", "note_date"),
    )

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elder_profiles.id"), nullable=False, index=True)
    note_date = Column(Date, nullable=False, index=True)
    note_type = Column(String(50))
    content = Column(Text, nullable=False)
    note_author = Column(String(50))
    related_incident_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    elder = relationship("ElderProfile", back_populates="review_notes")


class DataSyncStatus(Base):
    __tablename__ = "data_sync_status"

    id = Column(Integer, primary_key=True)
    system_name = Column(String(50), unique=True, nullable=False, index=True)
    last_sync_time = Column(DateTime)
    sync_status = Column(String(20), default="待同步")
    sync_count = Column(Integer, default=0)
    error_message = Column(Text)
    delay_threshold_seconds = Column(Integer, default=3600)
    current_delay_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class CaliberConflict(Base):
    __tablename__ = "caliber_conflicts"
    __table_args__ = (
        Index("idx_conflict_elder_date", "elder_code", "conflict_date"),
    )

    id = Column(Integer, primary_key=True)
    elder_code = Column(String(50), nullable=False, index=True)
    conflict_date = Column(Date, nullable=False, index=True)
    conflict_type = Column(String(50), nullable=False)
    care_terminal_value = Column(String(200))
    billing_system_value = Column(String(200))
    care_terminal_caliber = Column(String(50))
    billing_caliber = Column(String(50))
    difference_description = Column(Text)
    resolved = Column(Boolean, default=False, index=True)
    resolution_note = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
