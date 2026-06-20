from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.order import OrderResponse
from app.schemas.ticket_type import TicketTypeResponse
from app.schemas.seat import SeatResponse


class VerificationTicketCreate(BaseModel):
    ticket_no: str = Field(..., max_length=64)
    event_id: UUID
    order_id: UUID
    seat_id: UUID | None = None
    ticket_type_id: UUID
    assignee: str | None = Field(None, max_length=128)
    source: str | None = Field(None, max_length=64)
    source_reference: str | None = Field(None, max_length=128)
    verification_code: str | None = Field(None, max_length=64)


class VerificationTicketUpdate(BaseModel):
    assignee: str | None = Field(None, max_length=128)
    source: str | None = Field(None, max_length=64)
    source_reference: str | None = Field(None, max_length=128)
    verification_code: str | None = Field(None, max_length=64)
    conclusion: str | None = Field(None, max_length=255)
    dispute_reason: str | None = None
    supplement_note: str | None = None
    escalation_target: str | None = Field(None, max_length=128)


class VerificationActionResponse(BaseModel):
    id: UUID
    verification_id: UUID
    from_status: str
    to_status: str
    action: str
    operator: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VerificationTransitionRequest(BaseModel):
    to_status: str
    operator: str = Field(..., max_length=128)
    note: str | None = None
    dispute_reason: str | None = None
    supplement_note: str | None = None
    escalation_target: str | None = Field(None, max_length=128)


class VerificationTicketResponse(BaseModel):
    id: UUID
    ticket_no: str
    event_id: UUID
    order_id: UUID
    seat_id: UUID | None
    ticket_type_id: UUID
    status: str
    assignee: str | None
    source: str | None
    source_reference: str | None
    verification_code: str | None
    verified_at: datetime | None
    closed_at: datetime | None
    conclusion: str | None
    dispute_reason: str | None
    supplement_note: str | None
    escalation_target: str | None
    created_at: datetime
    updated_at: datetime
    actions: list[VerificationActionResponse] = []

    model_config = {"from_attributes": True}


class VerificationTicketDetailResponse(VerificationTicketResponse):
    order: OrderResponse | None = None
    ticket_type: TicketTypeResponse | None = None
    seat: SeatResponse | None = None
