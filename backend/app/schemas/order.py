from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    order_no: str = Field(..., max_length=64)
    event_id: UUID
    ticket_type_id: UUID
    buyer_name: str = Field(..., max_length=255)
    buyer_phone: str = Field(..., max_length=32)
    buyer_email: str | None = Field(None, max_length=255)
    quantity: int = Field(..., gt=0)
    total_amount: Decimal = Field(..., decimal_places=2)
    status: str = Field(default="pending_payment")
    source: str | None = Field(None, max_length=64)
    source_reference: str | None = Field(None, max_length=128)


class OrderUpdate(BaseModel):
    buyer_name: str | None = Field(None, max_length=255)
    buyer_phone: str | None = Field(None, max_length=32)
    buyer_email: str | None = Field(None, max_length=255)
    quantity: int | None = Field(None, gt=0)
    total_amount: Decimal | None = Field(None, decimal_places=2)
    status: str | None = None
    source: str | None = Field(None, max_length=64)
    source_reference: str | None = Field(None, max_length=128)


class OrderResponse(BaseModel):
    id: UUID
    order_no: str
    event_id: UUID
    ticket_type_id: UUID
    buyer_name: str
    buyer_phone: str
    buyer_email: str | None
    quantity: int
    total_amount: Decimal
    status: str
    source: str | None
    source_reference: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
