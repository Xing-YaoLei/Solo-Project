from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    VIEWER = "viewer"


class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    CONFLICT = "conflict"


class TimelineEventType(str, enum.Enum):
    CREATED = "created"
    STATUS_CHANGED = "status_changed"
    NOTE_ADDED = "note_added"
    ATTACHMENT_ADDED = "attachment_added"
    RESCHEDULED = "rescheduled"
    CONFLICT_DETECTED = "conflict_detected"
    CONFLICT_RESOLVED = "conflict_resolved"
    HANDOVER = "handover"
    REMARK = "remark"


class ConflictStatus(str, enum.Enum):
    DETECTED = "detected"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    full_name = Column(String(100))
    hashed_password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.OPERATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    timeline_events = relationship("TimelineRecord", back_populates="operator")
    handled_conflicts = relationship("ConflictRecord", foreign_keys="ConflictRecord.assigned_to", back_populates="assignee")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), index=True, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    capacity = Column(Integer, nullable=False, default=100)
    remaining_capacity = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, default=True)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    capacity_rules = relationship("CapacityRule", back_populates="time_slot")
    reservations = relationship("Reservation", back_populates="time_slot")


class CapacityRule(Base):
    __tablename__ = "capacity_rules"

    id = Column(Integer, primary_key=True, index=True)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    rule_type = Column(String(50), nullable=False)
    rule_value = Column(JSON)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    time_slot = relationship("TimeSlot", back_populates="capacity_rules")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_no = Column(String(50), unique=True, index=True, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    visitor_name = Column(String(100), nullable=False)
    visitor_phone = Column(String(20), nullable=False)
    visitor_count = Column(Integer, nullable=False, default=1)
    ticket_type = Column(String(50))
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING)
    check_in_time = Column(DateTime(timezone=True))
    source = Column(String(50))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    time_slot = relationship("TimeSlot", back_populates="reservations")
    timeline_events = relationship("TimelineRecord", back_populates="reservation")
    reschedule_records = relationship("RescheduleRecord", foreign_keys="RescheduleRecord.original_reservation_id", back_populates="original_reservation")
    reschedule_targets = relationship("RescheduleRecord", foreign_keys="RescheduleRecord.new_reservation_id", back_populates="new_reservation")
    conflicts = relationship("ConflictAffectedObject", back_populates="reservation")


class RescheduleRecord(Base):
    __tablename__ = "reschedule_records"

    id = Column(Integer, primary_key=True, index=True)
    original_reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    new_reservation_id = Column(Integer, ForeignKey("reservations.id"))
    original_time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    new_time_slot_id = Column(Integer, ForeignKey("time_slots.id"))
    reason = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    reschedule_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="completed")

    original_reservation = relationship("Reservation", foreign_keys=[original_reservation_id], back_populates="reschedule_records")
    new_reservation = relationship("Reservation", foreign_keys=[new_reservation_id], back_populates="reschedule_targets")


class TimelineRecord(Base):
    __tablename__ = "timeline_records"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    event_type = Column(Enum(TimelineEventType), nullable=False)
    description = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reservation = relationship("Reservation", back_populates="timeline_events")
    operator = relationship("User", back_populates="timeline_events")
    attachments = relationship("Attachment", back_populates="timeline_record")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    timeline_record_id = Column(Integer, ForeignKey("timeline_records.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(50))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    timeline_record = relationship("TimelineRecord", back_populates="attachments")


class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id = Column(Integer, primary_key=True, index=True)
    conflict_no = Column(String(50), unique=True, index=True, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    conflict_type = Column(String(50), nullable=False)
    description = Column(Text)
    status = Column(Enum(ConflictStatus), default=ConflictStatus.DETECTED)
    severity = Column(String(20), default="medium")
    assigned_to = Column(Integer, ForeignKey("users.id"))
    resolution = Column(Text)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    assignee = relationship("User", back_populates="handled_conflicts")
    affected_objects = relationship("ConflictAffectedObject", back_populates="conflict")


class ConflictAffectedObject(Base):
    __tablename__ = "conflict_affected_objects"

    id = Column(Integer, primary_key=True, index=True)
    conflict_id = Column(Integer, ForeignKey("conflict_records.id"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    impact_type = Column(String(50))
    impact_description = Column(Text)

    conflict = relationship("ConflictRecord", back_populates="affected_objects")
    reservation = relationship("Reservation", back_populates="conflicts")
