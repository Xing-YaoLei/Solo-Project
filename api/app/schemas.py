import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    role: str
    city_code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_no: str
    rider_id: Optional[uuid.UUID] = None
    pickup_address: str
    delivery_address: str
    pickup_lat: Decimal
    pickup_lng: Decimal
    delivery_lat: Decimal
    delivery_lng: Decimal
    distance: Decimal
    route_type: str
    city_code: str
    order_amount: Decimal
    subsidy_amount: Decimal
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SubsidyRuleCreate(BaseModel):
    name: str
    city_code: str
    route_type: str = "normal"
    min_distance: Decimal = Decimal("0")
    max_distance: Decimal
    subsidy_per_km: Decimal
    max_subsidy: Decimal
    effective_start: date
    effective_end: date


class SubsidyRuleUpdate(BaseModel):
    name: Optional[str] = None
    city_code: Optional[str] = None
    route_type: Optional[str] = None
    min_distance: Optional[Decimal] = None
    max_distance: Optional[Decimal] = None
    subsidy_per_km: Optional[Decimal] = None
    max_subsidy: Optional[Decimal] = None
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None
    status: Optional[str] = None


class SubsidyRuleResponse(BaseModel):
    id: uuid.UUID
    name: str
    city_code: str
    route_type: str
    min_distance: Decimal
    max_distance: Decimal
    subsidy_per_km: Decimal
    max_subsidy: Decimal
    status: str
    effective_start: date
    effective_end: date
    created_by: Optional[uuid.UUID] = None
    approved_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppealTicketCreate(BaseModel):
    order_id: uuid.UUID
    rider_id: uuid.UUID
    appeal_type: str
    description: str


class AppealTicketResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    rider_id: Optional[uuid.UUID] = None
    appeal_type: str
    status: str
    description: str
    handler_id: Optional[uuid.UUID] = None
    transfer_from: Optional[uuid.UUID] = None
    transfer_reason: Optional[str] = None
    escalation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    photos: Optional[List["AppealPhotoResponse"]] = None

    model_config = {"from_attributes": True}


class AppealPhotoResponse(BaseModel):
    id: uuid.UUID
    appeal_id: uuid.UUID
    photo_url: str
    photo_type: str
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FlowLogCreate(BaseModel):
    ticket_id: uuid.UUID
    ticket_type: str
    action: str
    operator_id: Optional[uuid.UUID] = None
    operator_role: Optional[str] = None
    comment: Optional[str] = None


class FlowLogResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    ticket_type: str
    action: str
    operator_id: Optional[uuid.UUID] = None
    operator_role: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SettlementBatchResponse(BaseModel):
    id: uuid.UUID
    batch_no: str
    period_start: date
    period_end: date
    status: str
    total_amount: Decimal
    total_count: int
    created_by: Optional[uuid.UUID] = None
    reviewed_by: Optional[uuid.UUID] = None
    approved_by: Optional[uuid.UUID] = None
    created_at: datetime
    settled_at: Optional[datetime] = None
    details: Optional[List["SettlementDetailResponse"]] = None

    model_config = {"from_attributes": True}


class SettlementDetailResponse(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    order_id: uuid.UUID
    rider_id: Optional[uuid.UUID] = None
    subsidy_amount: Decimal
    compensation_amount: Decimal
    total_amount: Decimal
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CompensationTypeCreate(BaseModel):
    name: str
    code: str
    category: str = "damage"
    description: Optional[str] = None
    standard_amount: Decimal = Decimal("0")
    max_amount: Decimal = Decimal("0")
    default_amount: Decimal = Decimal("0")
    requires_photo: bool = False
    approval_required: bool = True


class CompensationTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    standard_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    default_amount: Optional[Decimal] = None
    requires_photo: Optional[bool] = None
    approval_required: Optional[bool] = None
    is_active: Optional[bool] = None


class CompensationTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    category: str
    description: Optional[str] = None
    standard_amount: Decimal
    max_amount: Decimal
    default_amount: Decimal
    requires_photo: bool
    approval_required: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompensationRecordCreate(BaseModel):
    order_id: uuid.UUID
    rider_id: uuid.UUID
    type_id: uuid.UUID
    amount: Decimal
    reason: str


class CompensationRecordResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    rider_id: Optional[uuid.UUID] = None
    type_id: Optional[uuid.UUID] = None
    amount: Decimal
    reason: str
    status: str
    approved_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VerificationPhotoCreate(BaseModel):
    order_id: uuid.UUID
    photo_url: str
    photo_type: str
    uploaded_by: Optional[uuid.UUID] = None


class VerificationPhotoResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    photo_url: str
    photo_type: str
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TodoTicketCreate(BaseModel):
    source_type: str
    source_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    created_by: Optional[uuid.UUID] = None


class TodoTicketResponse(BaseModel):
    id: uuid.UUID
    source_type: str
    source_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assignee_id: Optional[uuid.UUID] = None
    transfer_from: Optional[uuid.UUID] = None
    transfer_reason: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    resolved_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TransferRequest(BaseModel):
    transfer_to: uuid.UUID
    reason: str


class RejectRequest(BaseModel):
    reason: str


class SupplementRequest(BaseModel):
    description: str


class ReportFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    city_code: Optional[str] = None
    route_type: Optional[str] = None
    rider_id: Optional[uuid.UUID] = None


class DispatchDurationReport(BaseModel):
    city_code: str
    route_type: str
    avg_dispatch_minutes: Decimal
    total_orders: int
    period_start: date
    period_end: date


class PerformanceReport(BaseModel):
    operator_id: uuid.UUID
    operator_name: str
    total_handled: int
    avg_resolution_hours: Decimal
    approval_rate: Decimal
    period_start: date
    period_end: date


class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    page_size: int


AppealTicketResponse.model_rebuild()
SettlementBatchResponse.model_rebuild()
