from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date, Time, JSON, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from ticket_dashboard.db.session import Base


class TicketReservation(Base):
    __tablename__ = "ticket_reservation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    scenic_area_name = Column(String(128), nullable=False)
    ticket_type = Column(String(64), nullable=False)
    reservation_date = Column(Date, nullable=False, index=True)
    time_slot_start = Column(Time, nullable=False)
    time_slot_end = Column(Time, nullable=False)
    reserved_count = Column(Integer, default=0)
    checked_in_count = Column(Integer, default=0)
    cancelled_count = Column(Integer, default=0)
    channel = Column(String(64), default="online")
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, server_default="now()", onupdate="now()")

    __table_args__ = (
        Index("ix_reservation_date_area", "reservation_date", "scenic_area_id"),
    )


class TimeSlotCapacity(Base):
    __tablename__ = "time_slot_capacity"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    effective_date = Column(Date, nullable=False)
    time_slot_start = Column(Time, nullable=False)
    time_slot_end = Column(Time, nullable=False)
    max_capacity = Column(Integer, nullable=False)
    overflow_capacity = Column(Integer, default=0)
    capacity_rule_name = Column(String(128))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        UniqueConstraint("scenic_area_id", "effective_date", "time_slot_start", "time_slot_end", name="uq_slot_capacity"),
        Index("ix_capacity_date_area", "effective_date", "scenic_area_id"),
    )


class SlotConflict(Base):
    __tablename__ = "slot_conflict"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    conflict_date = Column(Date, nullable=False, index=True)
    conflict_time_start = Column(Time, nullable=False)
    conflict_time_end = Column(Time, nullable=False)
    conflict_type = Column(String(64), nullable=False)
    affected_reservation_ids = Column(JSONB, default=list)
    description = Column(Text)
    severity = Column(String(16), default="warning")
    resolved = Column(Boolean, default=False)
    review_note = Column(Text)
    created_at = Column(DateTime, server_default="now()")
    resolved_at = Column(DateTime)


class DataQualityFlag(Base):
    __tablename__ = "data_quality_flag"

    id = Column(Integer, primary_key=True, autoincrement=True)
    flag_date = Column(Date, nullable=False, index=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    flag_type = Column(String(64), nullable=False)
    flag_detail = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True)
    detected_at = Column(DateTime, server_default="now()")
    cleared_at = Column(DateTime)

    __table_args__ = (
        Index("ix_quality_date_type", "flag_date", "flag_type"),
    )


class CameraStatisticsDelay(DataQualityFlag):
    __mapper_args__ = {"polymorphic_identity": "camera_delay"}


class MerchantTransactionGap(DataQualityFlag):
    __mapper_args__ = {"polymorphic_identity": "merchant_gap"}


class GateCaliberChange(DataQualityFlag):
    __mapper_args__ = {"polymorphic_identity": "gate_caliber_change"}


class AttendanceRateRule(Base):
    __tablename__ = "attendance_rate_rule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    rule_name = Column(String(128), nullable=False)
    numerator_source = Column(String(64), nullable=False)
    denominator_source = Column(String(64), nullable=False)
    adjustment_factor = Column(Float, default=1.0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    effective_from = Column(Date)
    effective_to = Column(Date)
    created_at = Column(DateTime, server_default="now()")


class SavedView(Base):
    __tablename__ = "saved_view"

    id = Column(Integer, primary_key=True, autoincrement=True)
    view_name = Column(String(128), nullable=False)
    owner = Column(String(64), nullable=False, index=True)
    view_type = Column(String(64), nullable=False)
    filter_config = Column(JSONB, nullable=False)
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, server_default="now()", onupdate="now()")

    __table_args__ = (
        UniqueConstraint("view_name", "owner", name="uq_view_name_owner"),
    )


class ReviewNote(Base):
    __tablename__ = "review_note"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenic_area_id = Column(String(32), nullable=False, index=True)
    note_date = Column(Date, nullable=False, index=True)
    time_slot_start = Column(Time)
    time_slot_end = Column(Time)
    anomaly_flag_id = Column(Integer, nullable=True)
    note_content = Column(Text, nullable=False)
    author = Column(String(64), nullable=False)
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_review_note_date_area", "note_date", "scenic_area_id"),
    )


class RefreshLog(Base):
    __tablename__ = "refresh_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    refresh_type = Column(String(64), nullable=False)
    triggered_by = Column(String(64), nullable=False)
    status = Column(String(16), nullable=False)
    quality_flags_summary = Column(JSONB, default=dict)
    rows_affected = Column(Integer, default=0)
    started_at = Column(DateTime, server_default="now()")
    finished_at = Column(DateTime)
    error_message = Column(Text)
