import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Time, Boolean,
    ForeignKey, Enum, Float, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    CLEANER = "cleaner"


class CleaningStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class AttendanceStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    CHECKED_OUT = "checked_out"


class RescheduleReason(str, enum.Enum):
    CUSTOMER_REQUEST = "customer_request"
    STAFF_UNAVAILABLE = "staff_unavailable"
    CONFLICT = "conflict"
    APARTMENT_UNAVAILABLE = "apartment_unavailable"
    OTHER = "other"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CLEANER)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(255))
    skills = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_cleanings = relationship(
        "CleaningSchedule",
        foreign_keys="CleaningSchedule.cleaner_id",
        back_populates="cleaner"
    )
    supervised_cleanings = relationship(
        "CleaningSchedule",
        foreign_keys="CleaningSchedule.supervisor_id",
        back_populates="supervisor"
    )
    created_schedules = relationship(
        "CleaningSchedule",
        foreign_keys="CleaningSchedule.created_by_id",
        back_populates="created_by"
    )
    communication_records = relationship(
        "CommunicationRecord",
        back_populates="sender"
    )
    review_opinions = relationship(
        "ReviewOpinion",
        back_populates="reviewer"
    )


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)
    apartment_code = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    room_number = Column(String(20))
    floor = Column(Integer)
    area_sqm = Column(Float)
    apartment_type = Column(String(50))
    resident_name = Column(String(100))
    resident_phone = Column(String(20))
    door_lock_info = Column(String(255))
    special_instructions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cleanings = relationship("CleaningSchedule", back_populates="apartment")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_name = Column(String(50), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_peak = Column(Boolean, default=False)
    capacity = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CleaningSchedule(Base):
    __tablename__ = "cleaning_schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_code = Column(String(50), unique=True, index=True, nullable=False)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    cleaner_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))

    scheduled_date = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"))
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=120)

    status = Column(Enum(CleaningStatus), nullable=False, default=CleaningStatus.PENDING)
    attendance_status = Column(Enum(AttendanceStatus), default=AttendanceStatus.NOT_STARTED)
    priority = Column(Integer, default=0)

    cleaning_type = Column(String(50), default="routine")
    estimated_cost = Column(Float)
    actual_cost = Column(Float)

    has_conflict = Column(Boolean, default=False)
    risk_level = Column(Enum(RiskLevel))
    conflict_details = Column(JSON)

    customer_notes = Column(Text)
    internal_notes = Column(Text)

    check_in_time = Column(DateTime(timezone=True))
    check_out_time = Column(DateTime(timezone=True))
    completion_time = Column(DateTime(timezone=True))

    quality_score = Column(Integer)
    feedback = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    apartment = relationship("Apartment", back_populates="cleanings")
    cleaner = relationship(
        "User",
        foreign_keys=[cleaner_id],
        back_populates="assigned_cleanings"
    )
    supervisor = relationship(
        "User",
        foreign_keys=[supervisor_id],
        back_populates="supervised_cleanings"
    )
    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_schedules"
    )
    time_slot = relationship("TimeSlot")
    reschedule_records = relationship(
        "RescheduleRecord",
        back_populates="cleaning_schedule",
        cascade="all, delete-orphan"
    )
    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="cleaning_schedule",
        cascade="all, delete-orphan"
    )
    conflict_records = relationship(
        "ConflictRecord",
        back_populates="cleaning_schedule",
        cascade="all, delete-orphan"
    )
    communication_records = relationship(
        "CommunicationRecord",
        back_populates="cleaning_schedule",
        cascade="all, delete-orphan"
    )
    review_opinions = relationship(
        "ReviewOpinion",
        back_populates="cleaning_schedule",
        cascade="all, delete-orphan"
    )


class RescheduleRecord(Base):
    __tablename__ = "reschedule_records"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"), nullable=False)

    old_start_time = Column(DateTime(timezone=True), nullable=False)
    old_end_time = Column(DateTime(timezone=True), nullable=False)
    old_cleaner_id = Column(Integer, ForeignKey("users.id"))
    new_start_time = Column(DateTime(timezone=True), nullable=False)
    new_end_time = Column(DateTime(timezone=True), nullable=False)
    new_cleaner_id = Column(Integer, ForeignKey("users.id"))

    reason = Column(Enum(RescheduleReason), nullable=False)
    reason_detail = Column(Text)
    requested_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cleaning_schedule = relationship("CleaningSchedule", back_populates="reschedule_records")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"), nullable=False)

    status = Column(Enum(AttendanceStatus), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    location_lat = Column(Float)
    location_lng = Column(Float)
    photo_url = Column(String(255))
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cleaning_schedule = relationship("CleaningSchedule", back_populates="attendance_records")


class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"), nullable=False)
    conflicting_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"))

    conflict_type = Column(String(50), nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    description = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolution_notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cleaning_schedule = relationship(
        "CleaningSchedule",
        foreign_keys=[cleaning_schedule_id],
        back_populates="conflict_records"
    )
    conflicting_schedule = relationship(
        "CleaningSchedule",
        foreign_keys=[conflicting_schedule_id]
    )


class CommunicationRecord(Base):
    __tablename__ = "communication_records"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    message_type = Column(String(50), default="note")
    content = Column(Text, nullable=False)
    attachments = Column(JSON, default=list)
    is_internal = Column(Boolean, default=True)
    recipient = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cleaning_schedule = relationship("CleaningSchedule", back_populates="communication_records")
    sender = relationship("User", back_populates="communication_records")


class ReviewOpinion(Base):
    __tablename__ = "review_opinions"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_schedule_id = Column(Integer, ForeignKey("cleaning_schedules.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    review_type = Column(String(50), nullable=False)
    opinion = Column(Text, nullable=False)
    decision = Column(String(50))
    is_approved = Column(Boolean)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cleaning_schedule = relationship("CleaningSchedule", back_populates="review_opinions")
    reviewer = relationship("User", back_populates="review_opinions")


class CapacityRule(Base):
    __tablename__ = "capacity_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)

    apply_day_of_week = Column(JSON, default=list)
    apply_date_start = Column(Date)
    apply_date_end = Column(Date)

    time_slot_id = Column(Integer, ForeignKey("time_slots.id"))
    max_cleanings = Column(Integer, nullable=False)
    max_cleanings_per_staff = Column(Integer)
    min_gap_minutes = Column(Integer)

    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    description = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
