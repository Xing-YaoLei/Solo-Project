from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SeatCreate(BaseModel):
    event_id: UUID
    section: str = Field(..., max_length=64)
    row: str = Field(..., max_length=16)
    number: str = Field(..., max_length=16)
    seat_label: str = Field(..., max_length=128)
    status: str = Field(default="available")
    order_id: UUID | None = None
    ticket_type_id: UUID | None = None


class SeatUpdate(BaseModel):
    section: str | None = Field(None, max_length=64)
    row: str | None = Field(None, max_length=16)
    number: str | None = Field(None, max_length=16)
    seat_label: str | None = Field(None, max_length=128)
    status: str | None = None
    order_id: UUID | None = None
    ticket_type_id: UUID | None = None


class SeatResponse(BaseModel):
    id: UUID
    event_id: UUID
    section: str
    row: str
    number: str
    seat_label: str
    status: str
    order_id: UUID | None
    ticket_type_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
