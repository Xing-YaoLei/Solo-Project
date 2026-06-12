from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EquipmentBase(BaseModel):
    equipment_code: str
    equipment_name: str
    equipment_type: str
    store_id: int
    brand: Optional[str] = None
    model: Optional[str] = None
    install_date: Optional[datetime] = None
    status: Optional[str] = "normal"
    cleaning_cycle_days: Optional[int] = 7


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    status: Optional[str] = None
    last_cleaning_date: Optional[datetime] = None
    next_cleaning_date: Optional[datetime] = None
    cleaning_cycle_days: Optional[int] = None


class Equipment(EquipmentBase):
    id: int
    last_cleaning_date: Optional[datetime] = None
    next_cleaning_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
