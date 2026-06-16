from datetime import date, datetime, time
from pydantic import BaseModel
from typing import Optional


class MedicationBase(BaseModel):
    drug_name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: str
    route: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    pharmacy: Optional[str] = None
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"


class MedicationCreate(MedicationBase):
    elder_id: int


class MedicationUpdate(BaseModel):
    drug_name: Optional[str] = None
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    pharmacy: Optional[str] = None
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class MedicationResponse(MedicationBase):
    id: int
    elder_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
