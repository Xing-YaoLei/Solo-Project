from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from ..models.quote import QuoteStatus
from .base import BaseSchema, PaginatedResponse


class InvoiceItemBase(BaseModel):
    item_name: str = Field(..., max_length=200)
    fee_type: str = "other"
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_rate: float = 100.0
    amount: float = 0.0
    actual_amount: float = 0.0
    sort_order: int = 0


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemUpdate(BaseModel):
    id: Optional[str] = None
    item_name: Optional[str] = None
    fee_type: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    discount_rate: Optional[float] = None
    amount: Optional[float] = None
    actual_amount: Optional[float] = None
    sort_order: Optional[int] = None
    _destroy: Optional[bool] = None


class InvoiceItemResponse(BaseSchema, InvoiceItemBase):
    quote_id: str


class QuoteBase(BaseModel):
    title: str = Field(..., max_length=200)
    client_name: str = Field(..., max_length=200)
    client_contact: Optional[str] = Field(None, max_length=100)
    client_phone: Optional[str] = Field(None, max_length=20)
    case_description: Optional[str] = None
    case_type: Optional[str] = Field(None, max_length=100)
    total_amount: float = 0.0
    discounted_amount: float = 0.0
    currency: str = "CNY"
    priority: str = "normal"
    assigned_to: Optional[str] = None
    expected_payment_date: Optional[date] = None
    payment_deadline: Optional[date] = None
    remarks: Optional[str] = None


class QuoteCreate(QuoteBase):
    invoice_items: List[InvoiceItemCreate] = Field(default_factory=list)


class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_phone: Optional[str] = None
    case_description: Optional[str] = None
    case_type: Optional[str] = None
    total_amount: Optional[float] = None
    discounted_amount: Optional[float] = None
    currency: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    expected_payment_date: Optional[date] = None
    payment_deadline: Optional[date] = None
    remarks: Optional[str] = None
    status: Optional[QuoteStatus] = None
    invoice_items: Optional[List[InvoiceItemUpdate]] = None


class QuoteStatusUpdate(BaseModel):
    status: QuoteStatus
    comment: Optional[str] = None


class QuoteResponse(BaseSchema, QuoteBase):
    quote_no: str
    status: QuoteStatus
    paid_amount: float = 0.0
    actual_payment_date: Optional[date] = None
    creator_name: Optional[str] = None
    assignee_name: Optional[str] = None


class QuoteDetailResponse(QuoteResponse):
    invoice_items: List[InvoiceItemResponse] = Field(default_factory=list)


class BatchStatusUpdate(BaseModel):
    quote_ids: List[str]
    status: QuoteStatus
    comment: Optional[str] = None
