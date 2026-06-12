from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EquipmentRemarkBase(BaseModel):
    equipment_id: int
    store_id: int
    remark_type: str
    content: str
    operator: Optional[str] = None
    related_date: Optional[datetime] = None


class EquipmentRemarkCreate(EquipmentRemarkBase):
    pass


class EquipmentRemark(EquipmentRemarkBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
