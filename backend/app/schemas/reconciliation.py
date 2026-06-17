from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ReconciliationDiffBase(BaseModel):
    contract_id: int
    bill_id: Optional[int] = None
    diff_no: str = Field(..., max_length=50)
    diff_type: str = Field(..., max_length=50)
    expected_amount: Decimal
    actual_amount: Decimal
    diff_amount: Decimal
    status: Optional[str] = "pending"
    handled_by: Optional[int] = None
    handler_conclusion: Optional[str] = None
    remark: Optional[str] = None


class ReconciliationDiffCreate(ReconciliationDiffBase):
    pass


class ReconciliationDiffUpdate(BaseModel):
    status: Optional[str] = None
    handled_by: Optional[int] = None
    handler_conclusion: Optional[str] = None
    remark: Optional[str] = None


class ReconciliationDiffResponse(ReconciliationDiffBase):
    id: int
    handled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
