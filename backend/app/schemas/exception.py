from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ExceptionAffectedObjectBase(BaseModel):
    exception_order_id: int
    object_type: str = Field(..., max_length=50)
    object_id: int
    object_name: str = Field(..., max_length=200)
    object_no: Optional[str] = None
    impact_level: Optional[str] = "medium"
    impact_description: Optional[str] = None


class ExceptionAffectedObjectCreate(ExceptionAffectedObjectBase):
    pass


class ExceptionAffectedObjectUpdate(BaseModel):
    object_type: Optional[str] = None
    object_name: Optional[str] = None
    object_no: Optional[str] = None
    impact_level: Optional[str] = None
    impact_description: Optional[str] = None


class ExceptionAffectedObjectResponse(ExceptionAffectedObjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExceptionOrderBase(BaseModel):
    contract_id: Optional[int] = None
    bill_id: Optional[int] = None
    reconciliation_diff_id: Optional[int] = None
    exception_no: str = Field(..., max_length=50)
    exception_type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    expected_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    diff_amount: Optional[Decimal] = None
    status: Optional[str] = "pending"
    priority: Optional[str] = "normal"
    handler_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    final_conclusion: Optional[str] = None
    remark: Optional[str] = None


class ExceptionOrderCreate(ExceptionOrderBase):
    affected_objects: Optional[List[ExceptionAffectedObjectCreate]] = None


class ExceptionOrderUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    handler_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    final_conclusion: Optional[str] = None
    remark: Optional[str] = None


class ExceptionOrderResponse(ExceptionOrderBase):
    id: int
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    affected_objects: Optional[List[ExceptionAffectedObjectResponse]] = None

    class Config:
        from_attributes = True
