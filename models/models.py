from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Time, Boolean,
    Float, ForeignKey, Index, Text, Numeric
)
from sqlalchemy.orm import relationship
from utils.database import Base


class SyncBatch(Base):
    __tablename__ = "sync_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(64), unique=True, nullable=False, index=True)
    source_type = Column(String(32), nullable=False, index=True)
    status = Column(String(16), nullable=False, default="pending")
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    data_range_start = Column(Date, nullable=True)
    data_range_end = Column(Date, nullable=True)
    created_by = Column(String(64), default="system")

    __table_args__ = (
        Index("idx_sync_batch_status", "status"),
        Index("idx_sync_batch_type_time", "source_type", "start_time"),
    )


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    region_code = Column(String(32), unique=True, nullable=False, index=True)
    region_name = Column(String(64), nullable=False)
    city = Column(String(32))
    address = Column(String(256))
    capacity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coach_no = Column(String(32), unique=True, nullable=False, index=True)
    coach_name = Column(String(64), nullable=False)
    gender = Column(String(8))
    phone = Column(String(32))
    region_id = Column(Integer, ForeignKey("regions.id"))
    specialty = Column(String(128))
    level = Column(String(16))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    region = relationship("Region")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_no = Column(String(32), unique=True, nullable=False, index=True)
    member_name = Column(String(64), nullable=False)
    gender = Column(String(8))
    phone = Column(String(32))
    region_id = Column(Integer, ForeignKey("regions.id"))
    member_level = Column(String(16))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    region = relationship("Region")


class CourseSchedule(Base):
    __tablename__ = "course_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_no = Column(String(64), unique=True, nullable=False, index=True)
    course_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
    course_type = Column(String(32))
    course_name = Column(String(128))
    max_capacity = Column(Integer, default=1)
    actual_capacity = Column(Integer, default=0)
    status = Column(String(16), default="scheduled")
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    coach = relationship("Coach")
    region = relationship("Region")

    __table_args__ = (
        Index("idx_schedule_coach_date", "coach_id", "course_date"),
        Index("idx_schedule_region_date", "region_id", "course_date"),
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_no = Column(String(64), unique=True, nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("course_schedules.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(16), default="booked")
    booked_at = Column(DateTime, default=datetime.now)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(String(256), nullable=True)
    is_rescheduled = Column(Boolean, default=False)
    original_appointment_no = Column(String(64), nullable=True, index=True)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    schedule = relationship("CourseSchedule")
    member = relationship("Member")
    coach = relationship("Coach")
    region = relationship("Region")

    __table_args__ = (
        Index("idx_appt_member_date", "member_id", "appointment_date"),
        Index("idx_appt_coach_date", "coach_id", "appointment_date"),
        Index("idx_appt_status_date", "status", "appointment_date"),
    )


class RescheduleRecord(Base):
    __tablename__ = "reschedule_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_no = Column(String(64), unique=True, nullable=False, index=True)
    appointment_no = Column(String(64), ForeignKey("appointments.appointment_no"), nullable=False, index=True)
    old_schedule_id = Column(Integer, ForeignKey("course_schedules.id"))
    new_schedule_id = Column(Integer, ForeignKey("course_schedules.id"))
    old_date = Column(Date, nullable=False)
    old_start_time = Column(Time, nullable=False)
    old_end_time = Column(Time, nullable=False)
    new_date = Column(Date, nullable=False)
    new_start_time = Column(Time, nullable=False)
    new_end_time = Column(Time, nullable=False)
    reschedule_reason = Column(String(256))
    reschedule_type = Column(String(16))
    operator = Column(String(64))
    rescheduled_at = Column(DateTime, default=datetime.now)
    batch_no = Column(String(64), index=True)

    __table_args__ = (
        Index("idx_resched_old_date", "old_date"),
        Index("idx_resched_new_date", "new_date"),
    )


class AccessRecord(Base):
    __tablename__ = "access_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_no = Column(String(64), unique=True, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    member_no = Column(String(32), index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
    access_type = Column(String(16), nullable=False)
    access_time = Column(DateTime, nullable=False, index=True)
    access_date = Column(Date, nullable=False, index=True)
    device_no = Column(String(32))
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.now)

    member = relationship("Member")
    region = relationship("Region")

    __table_args__ = (
        Index("idx_access_member_date", "member_id", "access_date"),
    )


class BodyTestRecord(Base):
    __tablename__ = "body_test_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    test_no = Column(String(64), unique=True, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    member_no = Column(String(32), index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
    test_date = Column(Date, nullable=False, index=True)
    test_time = Column(DateTime, default=datetime.now)
    height = Column(Numeric(5, 2))
    weight = Column(Numeric(5, 2))
    bmi = Column(Numeric(4, 1))
    body_fat_rate = Column(Numeric(4, 1))
    muscle_mass = Column(Numeric(5, 2))
    basal_metabolism = Column(Integer)
    visceral_fat_level = Column(Integer)
    moisture_rate = Column(Numeric(4, 1))
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.now)

    member = relationship("Member")
    region = relationship("Region")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False, index=True)
    appointment_no = Column(String(64), index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    region_id = Column(Integer, ForeignKey("regions.id"), index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    is_attended = Column(Boolean, default=False)
    attendance_status = Column(String(16), default="pending")
    late_minutes = Column(Integer, default=0)
    early_leave_minutes = Column(Integer, default=0)
    matched_access_id = Column(Integer, ForeignKey("access_records.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    appointment = relationship("Appointment")
    member = relationship("Member")
    coach = relationship("Coach")
    region = relationship("Region")
    access_record = relationship("AccessRecord")


class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conflict_no = Column(String(64), unique=True, nullable=False, index=True)
    conflict_type = Column(String(32), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), index=True)
    member_id = Column(Integer, ForeignKey("members.id"), index=True)
    conflict_date = Column(Date, nullable=False, index=True)
    conflict_start_time = Column(Time, nullable=False)
    conflict_end_time = Column(Time, nullable=False)
    appointment_no_1 = Column(String(64))
    appointment_no_2 = Column(String(64))
    schedule_no_1 = Column(String(64))
    schedule_no_2 = Column(String(64))
    description = Column(Text)
    severity = Column(String(16), default="warning")
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_conflict_date_type", "conflict_date", "conflict_type"),
    )
