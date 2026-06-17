from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApprovalNodeBase(BaseModel):
    node_name: str = Field(..., max_length=100)
    node_code: str = Field(..., max_length=50)
    approver_role: Optional[str] = None
    approver_id: Optional[int] = None
    approval_type: Optional[str] = "and"
    sort_order: Optional[int] = 0
    is_active: Optional[int] = 1
    description: Optional[str] = None


class ApprovalNodeCreate(ApprovalNodeBase):
    pass


class ApprovalNodeUpdate(BaseModel):
    node_name: Optional[str] = None
    approver_role: Optional[str] = None
    approver_id: Optional[int] = None
    approval_type: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[int] = None
    description: Optional[str] = None


class ApprovalNodeResponse(ApprovalNodeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApprovalRecordBase(BaseModel):
    bill_id: int
    node_id: int
    approver_id: int
    approval_status: Optional[str] = "pending"
    approval_opinion: Optional[str] = None
    sort_order: Optional[int] = 0


class ApprovalRecordCreate(ApprovalRecordBase):
    pass


class ApprovalRecordUpdate(BaseModel):
    approval_status: Optional[str] = None
    approval_opinion: Optional[str] = None


class ApprovalRecordResponse(ApprovalRecordBase):
    id: int
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
