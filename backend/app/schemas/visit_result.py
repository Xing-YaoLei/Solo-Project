import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class VisitResultCreate(BaseModel):
    complaint_id: uuid.UUID
    visit_method: str
    visitor_name: str
    satisfaction: str
    feedback: Optional[str] = None
    visit_at: str


class VisitResultUpdate(BaseModel):
    visit_method: Optional[str] = None
    visitor_name: Optional[str] = None
    satisfaction: Optional[str] = None
    feedback: Optional[str] = None
    visit_at: Optional[str] = None


class VisitResultResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    visit_method: str
    visitor_name: str
    satisfaction: str
    feedback: Optional[str] = None
    visit_at: datetime

    model_config = {"from_attributes": True}
