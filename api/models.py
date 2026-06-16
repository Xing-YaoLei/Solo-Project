import uuid
from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey, Integer, Float, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.database import Base


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    floor: Mapped[int] = mapped_column(Integer, nullable=False)
    room_number: Mapped[str] = mapped_column(String(10), nullable=False)
    bed_number: Mapped[str] = mapped_column(String(10), nullable=False)

    elder: Mapped["Elder | None"] = relationship(back_populates="bed")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="bed")
    risk_annotations: Mapped[list["RiskAnnotation"]] = relationship(back_populates="bed")


class Nurse(Base):
    __tablename__ = "nurses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    schedules: Mapped[list["Schedule"]] = relationship(back_populates="nurse")


class Elder(Base):
    __tablename__ = "elders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    bed_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("beds.id"), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)

    bed: Mapped["Bed"] = relationship(back_populates="elder")
    medication_records: Mapped[list["MedicationRecord"]] = relationship(back_populates="elder")
    visit_records: Mapped[list["VisitRecord"]] = relationship(back_populates="elder")
    activity_records: Mapped[list["ActivityRecord"]] = relationship(back_populates="elder")
    fall_events: Mapped[list["FallEvent"]] = relationship(back_populates="elder")


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bed_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("beds.id"), nullable=False)
    nurse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("nurses.id"), nullable=False)
    shift_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift_type: Mapped[str] = mapped_column(String(20), nullable=False)

    bed: Mapped["Bed"] = relationship(back_populates="schedules")
    nurse: Mapped["Nurse"] = relationship(back_populates="schedules")


class RiskAnnotation(Base):
    __tablename__ = "risk_annotations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    bed_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("beds.id"), nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    bed: Mapped["Bed"] = relationship(back_populates="risk_annotations")
    review_notes: Mapped[list["ReviewNote"]] = relationship(back_populates="annotation", cascade="all, delete-orphan")


class ReviewNote(Base):
    __tablename__ = "review_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    annotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("risk_annotations.id"), nullable=False)
    author: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    annotation: Mapped["RiskAnnotation"] = relationship(back_populates="review_notes")


class MedicationRecord(Base):
    __tablename__ = "medication_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("elders.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(100), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actual_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)

    elder: Mapped["Elder"] = relationship(back_populates="medication_records")


class VisitRecord(Base):
    __tablename__ = "visit_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("elders.id"), nullable=False)
    visitor_name: Mapped[str] = mapped_column(String(50), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actual_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    access_record_exists: Mapped[bool] = mapped_column(default=False)

    elder: Mapped["Elder"] = relationship(back_populates="visit_records")


class ActivityRecord(Base):
    __tablename__ = "activity_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("elders.id"), nullable=False)
    activity_name: Mapped[str] = mapped_column(String(100), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    checked_in: Mapped[bool] = mapped_column(default=False)
    check_in_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    elder: Mapped["Elder"] = relationship(back_populates="activity_records")


class FallEvent(Base):
    __tablename__ = "fall_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("elders.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)

    elder: Mapped["Elder"] = relationship(back_populates="fall_events")


class BillingCaliberChange(Base):
    __tablename__ = "billing_caliber_changes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    change_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    old_caliber: Mapped[str] = mapped_column(String(100), nullable=False)
    new_caliber: Mapped[str] = mapped_column(String(100), nullable=False)
