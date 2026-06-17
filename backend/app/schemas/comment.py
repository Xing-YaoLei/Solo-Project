from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class RentOverdueCommentBase(BaseModel):
    payment_id: int
    customer_id: int
    comment: str
    commented_by: Optional[int] = None


class RentOverdueCommentCreate(RentOverdueCommentBase):
    pass


class RentOverdueComment(RentOverdueCommentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintBase(BaseModel):
    complaint_no: str
    customer_id: int
    property_id: int
    complaint_type: str
    tags: Optional[List[Any]] = None
    description: Optional[str] = None
    report_date: Optional[datetime] = None
    status: str = "pending"
    batch_id: Optional[int] = None


class ComplaintCreate(ComplaintBase):
    pass


class Complaint(ComplaintBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
