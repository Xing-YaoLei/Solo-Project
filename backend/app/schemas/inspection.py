from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class InspectionItemBase(BaseModel):
    item_name: str
    item_category: str
    is_pass: bool = True
    remark: Optional[str] = None


class InspectionItemCreate(InspectionItemBase):
    pass


class InspectionItem(InspectionItemBase):
    id: int
    inspection_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InspectionRecordBase(BaseModel):
    inspection_no: str
    contract_id: int
    property_id: int
    customer_id: int
    inspector_id: Optional[int] = None
    apply_date: Optional[datetime] = None
    inspection_date: Optional[datetime] = None
    status: str = "pending"
    water_reading: Optional[int] = None
    electricity_reading: Optional[int] = None
    gas_reading: Optional[int] = None
    has_damage: bool = False
    damage_description: Optional[str] = None
    batch_id: Optional[int] = None


class InspectionRecordCreate(InspectionRecordBase):
    items: Optional[List[InspectionItemCreate]] = None


class InspectionRecord(InspectionRecordBase):
    id: int
    created_at: datetime
    items: List[InspectionItem] = []

    class Config:
        from_attributes = True
