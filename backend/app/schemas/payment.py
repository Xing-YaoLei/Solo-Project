from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from ..models.payment import PaymentMethod, PaymentStatus
from .base import BaseSchema


class PaymentBase(BaseModel):
    quote_id: str
    amount: float = 0.0
    currency: str = "CNY"
    method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    payment_date: Optional[date] = None
    transaction_id: Optional[str] = Field(None, max_length=100)
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_account: Optional[str] = Field(None, max_length=100)
    payer_name: Optional[str] = Field(None, max_length=200)
    remarks: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None
    method: Optional[PaymentMethod] = None
    status: Optional[PaymentStatus] = None
    payment_date: Optional[date] = None
    transaction_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    payer_name: Optional[str] = None
    remarks: Optional[str] = None


class PaymentConfirm(BaseModel):
    comment: Optional[str] = None


class PaymentResponse(BaseSchema, PaymentBase):
    payment_no: str
    status: PaymentStatus
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    quote_title: Optional[str] = None
    client_name: Optional[str] = None
