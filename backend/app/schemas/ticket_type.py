from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TicketTypeCreate(BaseModel):
    event_id: UUID
    name: str = Field(..., max_length=100)
    price: Decimal = Field(..., decimal_places=2)
    quota: int = Field(..., gt=0)
    sold_count: int = Field(default=0)
    rules: dict | None = None
    status: str = Field(default="active")


class TicketTypeUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    price: Decimal | None = Field(None, decimal_places=2)
    quota: int | None = Field(None, gt=0)
    sold_count: int | None = None
    rules: dict | None = None
    status: str | None = None


class TicketTypeResponse(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    price: Decimal
    quota: int
    sold_count: int
    rules: dict | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
