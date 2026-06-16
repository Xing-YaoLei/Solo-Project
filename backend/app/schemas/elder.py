from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class ElderBase(BaseModel):
    name: str
    gender: str
    birth_date: date
    id_card: str
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address: Optional[str] = None
    health_status: str = "stable"
    care_level: str = "basic"
    room_number: Optional[str] = None
    bed_number: Optional[str] = None
    admission_date: Optional[date] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    mobility_level: Optional[str] = None
    cognitive_level: Optional[str] = None
    status: str = "active"
    avatar_url: Optional[str] = None
    remark: Optional[str] = None


class ElderCreate(ElderBase):
    pass


class ElderUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address: Optional[str] = None
    health_status: Optional[str] = None
    care_level: Optional[str] = None
    room_number: Optional[str] = None
    bed_number: Optional[str] = None
    admission_date: Optional[date] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    mobility_level: Optional[str] = None
    cognitive_level: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None
    remark: Optional[str] = None


class ElderResponse(ElderBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ElderStatusUpdate(BaseModel):
    status: str
    remark: Optional[str] = None
