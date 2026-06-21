from typing import List, Optional

from pydantic import BaseModel, Field

from ..models.approval import ApprovalStatus
from .base import BaseSchema


class ApprovalNodeBase(BaseModel):
    quote_id: str
    approver_id: str
    node_order: int
    node_name: str = Field(..., max_length=100)
    required_role: Optional[str] = None


class ApprovalNodeCreate(ApprovalNodeBase):
    pass


class ApprovalNodeUpdate(BaseModel):
    node_name: Optional[str] = None
    approver_id: Optional[str] = None
    node_order: Optional[int] = None
    is_active: Optional[bool] = None


class ApprovalAction(BaseModel):
    status: ApprovalStatus
    comment: Optional[str] = Field(None, max_length=500)


class ApprovalNodeResponse(BaseSchema, ApprovalNodeBase):
    status: ApprovalStatus
    comment: Optional[str] = None
    approved_at: Optional[str] = None
    is_active: bool
    approver_name: Optional[str] = None


class ApprovalFlowCreate(BaseModel):
    quote_id: str
    nodes: List[ApprovalNodeCreate]


class BatchApprovalAction(BaseModel):
    node_ids: List[str]
    status: ApprovalStatus
    comment: Optional[str] = None
