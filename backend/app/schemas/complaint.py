import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.responsibility import ResponsibilityResponse
from app.schemas.review import ReviewResponse
from app.schemas.visit_result import VisitResultResponse


class HandlingRecordResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    handler_id: Optional[uuid.UUID] = None
    action: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplaintCreate(BaseModel):
    title: str
    description: str
    source_channel: str
    priority: str
    complainant_name: str
    complainant_contact: str
    homestay_name: str
    room_number: str
    check_in_date: date
    check_out_date: Optional[date] = None
    handler_id: Optional[uuid.UUID] = None
    tags: list[str]


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    handler_id: Optional[uuid.UUID] = None
    priority: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    source_channel: str
    status: str
    priority: str
    complainant_name: str
    complainant_contact: str
    homestay_name: str
    room_number: str
    check_in_date: date
    check_out_date: Optional[date] = None
    handler_id: Optional[uuid.UUID] = None
    handler_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    tags: list[str] = []
    visit_results: list[VisitResultResponse] = []
    responsibilities: list[ResponsibilityResponse] = []
    handling_records: list[HandlingRecordResponse] = []
    reviews: list[ReviewResponse] = []

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    priority: str
    source_channel: str
    homestay_name: str
    handler_name: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    tags: list[str] = []

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    tag: str


class HandlingRecordCreate(BaseModel):
    handler_id: Optional[uuid.UUID] = None
    action: str
    description: str


class ComplaintStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
