import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResponsibilityCreate(BaseModel):
    complaint_id: uuid.UUID
    responsible_type: str
    responsible_person: str
    judgment_basis: Optional[str] = None
    determined_by: str
    determined_at: str


class ResponsibilityUpdate(BaseModel):
    judgment_basis: Optional[str] = None
    responsible_type: Optional[str] = None
    responsible_person: Optional[str] = None


class ResponsibilityResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    responsible_type: str
    responsible_person: str
    judgment_basis: Optional[str] = None
    determined_by: str
    determined_at: datetime

    model_config = {"from_attributes": True}
