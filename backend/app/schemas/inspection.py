import enum
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel


class InspectionType(str, enum.Enum):
    pre_work = "pre_work"
    in_process = "in_process"
    post_work = "post_work"
    delivery = "delivery"


class InspectionResult(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    conditional = "conditional"


class InspectionPhotoResponse(BaseModel):
    id: UUID
    inspection_id: UUID
    photo_url: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InspectionRecordCreate(BaseModel):
    work_order_id: UUID
    type: InspectionType
    result: InspectionResult
    notes: Optional[str] = None
    photo_urls: Optional[list[str]] = None


class InspectionRecordResponse(BaseModel):
    id: UUID
    work_order_id: UUID
    type: str
    result: str
    notes: Optional[str] = None
    inspector_id: Optional[UUID] = None
    inspector_name: Optional[str] = None
    created_at: datetime
    photos: list[InspectionPhotoResponse] = []

    model_config = {"from_attributes": True}
