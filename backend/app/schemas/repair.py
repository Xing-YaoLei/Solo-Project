from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel


class RepairCaliberVersionBase(BaseModel):
    version: str
    effective_date: datetime
    description: Optional[str] = None
    calculation_rule: Optional[str] = None
    is_active: bool = True


class RepairCaliberVersionCreate(RepairCaliberVersionBase):
    pass


class RepairCaliberVersion(RepairCaliberVersionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RepairOrderBase(BaseModel):
    repair_no: str
    property_id: int
    reporter_id: int
    worker_id: Optional[int] = None
    repair_type: str
    description: Optional[str] = None
    report_time: datetime
    assign_time: Optional[datetime] = None
    start_time: Optional[datetime] = None
    complete_time: Optional[datetime] = None
    status: str = "pending"
    duration_hours: Optional[Decimal] = None
    caliber_version: Optional[str] = None
    batch_id: Optional[int] = None


class RepairOrderCreate(RepairOrderBase):
    pass


class RepairOrder(RepairOrderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
