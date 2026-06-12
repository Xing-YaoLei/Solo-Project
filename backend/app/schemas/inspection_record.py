from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InspectionRecordBase(BaseModel):
    record_code: str
    equipment_id: int
    store_id: int
    inspection_date: datetime
    inspector: Optional[str] = None
    inspection_type: Optional[str] = None
    passed: Optional[bool] = True
    score: Optional[float] = None
    issues_found: Optional[str] = None
    improvement_suggestions: Optional[str] = None


class InspectionRecordCreate(InspectionRecordBase):
    pass


class InspectionRecord(InspectionRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
