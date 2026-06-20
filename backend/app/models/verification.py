import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VerificationTicket(Base):
    __tablename__ = "verification_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    seat_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("seats.id"), nullable=True)
    ticket_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ticket_types.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "in_progress", "disputed", "supplementing",
            "escalated", "closed_normal", "closed_dispute",
            name="verification_status",
        ),
        default="pending",
        nullable=False,
    )
    assignee: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    verification_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    conclusion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dispute_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    supplement_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    escalation_target: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    event = relationship("Event", lazy="selectin")
    order = relationship("Order", lazy="selectin")
    seat = relationship("Seat", lazy="selectin")
    ticket_type = relationship("TicketType", lazy="selectin")
    actions = relationship("VerificationAction", back_populates="verification", lazy="selectin", order_by="VerificationAction.created_at")


class VerificationAction(Base):
    __tablename__ = "verification_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("verification_tickets.id"), nullable=False)
    from_status: Mapped[str] = mapped_column(String(32), nullable=False)
    to_status: Mapped[str] = mapped_column(String(32), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    operator: Mapped[str] = mapped_column(String(128), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    verification = relationship("VerificationTicket", back_populates="actions")
