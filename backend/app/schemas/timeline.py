from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StatusTimelineBase(BaseModel):
    contract_id: Optional[int] = None
    bill_id: Optional[int] = None
    reconciliation_diff_id: Optional[int] = None
    exception_order_id: Optional[int] = None
    status: str = Field(..., max_length=20)
    previous_status: Optional[str] = None
    operator_id: Optional[int] = None
    operation_type: str = Field(..., max_length=50)
    remark: Optional[str] = None


class StatusTimelineCreate(StatusTimelineBase):
    pass


class StatusTimelineResponse(StatusTimelineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
