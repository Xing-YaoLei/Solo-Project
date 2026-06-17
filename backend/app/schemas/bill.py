from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class BillItemBase(BaseModel):
    bill_id: int
    item_name: str = Field(..., max_length=200)
    item_code: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    subtotal: Decimal
    discount_rate: Optional[Decimal] = 0
    actual_amount: Decimal
    remark: Optional[str] = None
    sort_order: Optional[int] = 0


class BillItemCreate(BillItemBase):
    pass


class BillItemUpdate(BaseModel):
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    discount_rate: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    remark: Optional[str] = None
    sort_order: Optional[int] = None


class BillItemResponse(BillItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BillBase(BaseModel):
    contract_id: int
    bill_no: str = Field(..., max_length=50)
    bill_type: str = Field(..., max_length=50)
    bill_name: str = Field(..., max_length=200)
    total_amount: Decimal
    paid_amount: Optional[Decimal] = 0
    unpaid_amount: Optional[Decimal] = 0
    status: Optional[str] = "pending"
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    created_by: Optional[int] = None
    verified_by: Optional[int] = None
    remark: Optional[str] = None


class BillCreate(BillBase):
    items: Optional[List[BillItemCreate]] = None


class BillUpdate(BaseModel):
    bill_name: Optional[str] = None
    bill_type: Optional[str] = None
    total_amount: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    unpaid_amount: Optional[Decimal] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    verified_by: Optional[int] = None
    remark: Optional[str] = None


class BillResponse(BillBase):
    id: int
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: Optional[List[BillItemResponse]] = None

    class Config:
        from_attributes = True
