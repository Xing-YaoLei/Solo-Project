from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PaymentTransactionBase(BaseModel):
    transaction_no: str
    customer_id: int
    property_id: int
    amount: int
    payment_type: str
    payment_date: datetime
    payment_method: Optional[str] = None
    status: str = "completed"
    overdue_days: int = 0
    batch_id: Optional[int] = None


class PaymentTransactionCreate(PaymentTransactionBase):
    pass


class PaymentTransaction(PaymentTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
