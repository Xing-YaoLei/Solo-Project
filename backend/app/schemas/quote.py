import enum
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel


class ItemType(str, enum.Enum):
    labor = "labor"
    part = "part"
    other = "other"


class QuoteStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class QuoteItemCreate(BaseModel):
    item_type: ItemType
    description: str
    quantity: int
    unit_price: float


class QuoteItemResponse(BaseModel):
    id: UUID
    quote_id: UUID
    item_type: str
    description: str
    quantity: int
    unit_price: float
    amount: float

    model_config = {"from_attributes": True}


class QuoteCreate(BaseModel):
    work_order_id: UUID
    items: list[QuoteItemCreate]
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    status: Optional[QuoteStatus] = None
    notes: Optional[str] = None
    items: Optional[list[QuoteItemCreate]] = None


class QuoteResponse(BaseModel):
    id: UUID
    quote_no: str
    work_order_id: UUID
    total_amount: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[QuoteItemResponse] = []

    model_config = {"from_attributes": True}
