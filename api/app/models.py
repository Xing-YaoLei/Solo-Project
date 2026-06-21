import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'rider'")
    city_code: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'operator', 'finance', 'rider')", name="ck_users_role"),
    )

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="rider", foreign_keys="Order.rider_id")
    handled_appeals: Mapped[list["AppealTicket"]] = relationship("AppealTicket", back_populates="handler", foreign_keys="AppealTicket.handler_id")
    created_rules: Mapped[list["SubsidyRule"]] = relationship("SubsidyRule", back_populates="creator", foreign_keys="SubsidyRule.created_by")
    approved_rules: Mapped[list["SubsidyRule"]] = relationship("SubsidyRule", back_populates="approver", foreign_keys="SubsidyRule.approved_by")
    assigned_todos: Mapped[list["TodoTicket"]] = relationship("TodoTicket", back_populates="assignee", foreign_keys="TodoTicket.assignee_id")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_no: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    pickup_address: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_lat: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    pickup_lng: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    delivery_lat: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    delivery_lng: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    distance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text("0"))
    route_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'normal'")
    city_code: Mapped[str] = mapped_column(String(10), nullable=False)
    order_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    subsidy_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'completed'")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("route_type IN ('normal', 'cross_city', 'remote', 'bad_weather')", name="ck_orders_route_type"),
        CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'cancelled')", name="ck_orders_status"),
        CheckConstraint("distance >= 0", name="ck_orders_distance"),
        CheckConstraint("order_amount >= 0", name="ck_orders_order_amount"),
        CheckConstraint("subsidy_amount >= 0", name="ck_orders_subsidy_amount"),
    )

    rider: Mapped["User"] = relationship("User", back_populates="orders", foreign_keys=[rider_id])
    appeals: Mapped[list["AppealTicket"]] = relationship("AppealTicket", back_populates="order")
    settlement_details: Mapped[list["SettlementDetail"]] = relationship("SettlementDetail", back_populates="order")
    compensation_records: Mapped[list["CompensationRecord"]] = relationship("CompensationRecord", back_populates="order")
    verification_photos: Mapped[list["VerificationPhoto"]] = relationship("VerificationPhoto", back_populates="order")


class SubsidyRule(Base):
    __tablename__ = "subsidy_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    city_code: Mapped[str] = mapped_column(String(10), nullable=False)
    route_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'normal'")
    min_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text("0"))
    max_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subsidy_per_km: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    max_subsidy: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'draft'")
    effective_start: Mapped[date] = mapped_column(Date, nullable=False)
    effective_end: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("route_type IN ('normal', 'cross_city', 'remote', 'bad_weather')", name="ck_subsidy_rules_route_type"),
        CheckConstraint("status IN ('draft', 'pending_approval', 'approved', 'rejected', 'disabled')", name="ck_subsidy_rules_status"),
        CheckConstraint("min_distance >= 0", name="ck_subsidy_rules_min_distance"),
        CheckConstraint("max_distance > min_distance", name="ck_subsidy_rules_max_distance"),
        CheckConstraint("subsidy_per_km > 0", name="ck_subsidy_rules_subsidy_per_km"),
        CheckConstraint("max_subsidy > 0", name="ck_subsidy_rules_max_subsidy"),
        CheckConstraint("effective_end > effective_start", name="ck_subsidy_rules_effective_range"),
        Index("ix_subsidy_rules_city_route", "city_code", "route_type"),
    )

    creator: Mapped["User"] = relationship("User", back_populates="created_rules", foreign_keys=[created_by])
    approver: Mapped["User"] = relationship("User", back_populates="approved_rules", foreign_keys=[approved_by])


class AppealTicket(Base):
    __tablename__ = "appeal_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    appeal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'pending'")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    handler_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transfer_from: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transfer_reason: Mapped[str] = mapped_column(Text, nullable=True)
    escalation_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("appeal_type IN ('subsidy_missing', 'amount_wrong', 'route_wrong', 'other')", name="ck_appeal_tickets_appeal_type"),
        CheckConstraint("status IN ('pending', 'in_review', 'supplement_requested', 'approved', 'rejected', 'transferred', 'escalated')", name="ck_appeal_tickets_status"),
        Index("ix_appeal_tickets_status", "status"),
        Index("ix_appeal_tickets_rider", "rider_id"),
    )

    order: Mapped["Order"] = relationship("Order", back_populates="appeals")
    rider: Mapped["User"] = relationship("User", foreign_keys=[rider_id])
    handler: Mapped["User"] = relationship("User", back_populates="handled_appeals", foreign_keys=[handler_id])
    transfer_from_user: Mapped["User"] = relationship("User", foreign_keys=[transfer_from])
    photos: Mapped[list["AppealPhoto"]] = relationship("AppealPhoto", back_populates="appeal", cascade="all, delete-orphan")


class AppealPhoto(Base):
    __tablename__ = "appeal_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    appeal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appeal_tickets.id", ondelete="CASCADE"), nullable=False)
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    photo_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'evidence'")
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        CheckConstraint("photo_type IN ('evidence', 'supplement')", name="ck_appeal_photos_photo_type"),
        Index("ix_appeal_photos_appeal", "appeal_id"),
    )

    appeal: Mapped["AppealTicket"] = relationship("AppealTicket", back_populates="photos")
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by])


class FlowLog(Base):
    __tablename__ = "flow_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    ticket_type: Mapped[str] = mapped_column(String(20), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    operator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    operator_role: Mapped[str] = mapped_column(String(20), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        CheckConstraint("ticket_type IN ('appeal', 'todo', 'compensation')", name="ck_flow_logs_ticket_type"),
        Index("ix_flow_logs_ticket", "ticket_id", "ticket_type"),
    )

    operator: Mapped["User"] = relationship("User", foreign_keys=[operator_id])


class SettlementBatch(Base):
    __tablename__ = "settlement_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    batch_no: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'draft'")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, server_default=text("0"))
    total_count: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    settled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'pending_review', 'approved', 'settled')", name="ck_settlement_batches_status"),
        CheckConstraint("period_end >= period_start", name="ck_settlement_batches_period"),
        CheckConstraint("total_amount >= 0", name="ck_settlement_batches_total_amount"),
        CheckConstraint("total_count >= 0", name="ck_settlement_batches_total_count"),
    )

    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewed_by])
    approver_user: Mapped["User"] = relationship("User", foreign_keys=[approved_by])
    details: Mapped[list["SettlementDetail"]] = relationship("SettlementDetail", back_populates="batch", cascade="all, delete-orphan")


class SettlementDetail(Base):
    __tablename__ = "settlement_details"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    batch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("settlement_batches.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subsidy_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    compensation_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'pending'")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'settled', 'failed')", name="ck_settlement_details_status"),
        CheckConstraint("subsidy_amount >= 0", name="ck_settlement_details_subsidy"),
        CheckConstraint("compensation_amount >= 0", name="ck_settlement_details_compensation"),
        CheckConstraint("total_amount >= 0", name="ck_settlement_details_total"),
        Index("ix_settlement_details_batch", "batch_id"),
        Index("ix_settlement_details_rider", "rider_id"),
    )

    batch: Mapped["SettlementBatch"] = relationship("SettlementBatch", back_populates="details")
    order: Mapped["Order"] = relationship("Order", back_populates="settlement_details")
    rider: Mapped["User"] = relationship("User", foreign_keys=[rider_id])


class CompensationType(Base):
    __tablename__ = "compensation_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, server_default="'damage'")
    description: Mapped[str] = mapped_column(Text, nullable=True)
    standard_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    max_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    default_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    requires_photo: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    approval_required: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("category IN ('damage', 'loss', 'delay', 'service_failure')", name="ck_compensation_types_category"),
        CheckConstraint("standard_amount >= 0", name="ck_compensation_types_standard_amount"),
        CheckConstraint("max_amount >= standard_amount", name="ck_compensation_types_max_amount"),
        CheckConstraint("default_amount >= 0", name="ck_compensation_types_default_amount"),
    )

    records: Mapped[list["CompensationRecord"]] = relationship("CompensationRecord", back_populates="compensation_type")


class CompensationRecord(Base):
    __tablename__ = "compensation_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("compensation_types.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'pending'")
    approved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_compensation_records_status"),
        CheckConstraint("amount > 0", name="ck_compensation_records_amount"),
        Index("ix_compensation_records_rider", "rider_id"),
        Index("ix_compensation_records_status", "status"),
    )

    order: Mapped["Order"] = relationship("Order", back_populates="compensation_records")
    rider: Mapped["User"] = relationship("User", foreign_keys=[rider_id])
    compensation_type: Mapped["CompensationType"] = relationship("CompensationType", back_populates="records")
    approver_user: Mapped["User"] = relationship("User", foreign_keys=[approved_by])


class VerificationPhoto(Base):
    __tablename__ = "verification_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    photo_type: Mapped[str] = mapped_column(String(20), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        CheckConstraint("photo_type IN ('pickup', 'delivery', 'damage')", name="ck_verification_photos_photo_type"),
        Index("ix_verification_photos_order", "order_id"),
    )

    order: Mapped["Order"] = relationship("Order", back_populates="verification_photos")
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by])


class TodoTicket(Base):
    __tablename__ = "todo_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="'pending'")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, server_default="'medium'")
    assignee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transfer_from: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transfer_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"), onupdate=datetime.now)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("source_type IN ('damage_report', 'appeal', 'compensation', 'other')", name="ck_todo_tickets_source_type"),
        CheckConstraint("status IN ('pending', 'claimed', 'in_progress', 'supplement_requested', 'resolved', 'rejected', 'transferred', 'closed')", name="ck_todo_tickets_status"),
        CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name="ck_todo_tickets_priority"),
        Index("ix_todo_tickets_status", "status"),
        Index("ix_todo_tickets_assignee", "assignee_id"),
        Index("ix_todo_tickets_source", "source_type", "source_id"),
    )

    assignee: Mapped["User"] = relationship("User", back_populates="assigned_todos", foreign_keys=[assignee_id])
    transfer_from_user: Mapped["User"] = relationship("User", foreign_keys=[transfer_from])
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    resolver: Mapped["User"] = relationship("User", foreign_keys=[resolved_by])
