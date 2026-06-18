from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel


class ShortageRecordCreate(BaseModel):
    work_order_id: UUID
    part_id: Optional[UUID] = None
    part_name: str
    requested_quantity: int
    available_quantity: int = 0
    expected_arrival: Optional[datetime] = None


class ShortageRecordUpdate(BaseModel):
    status: Optional[str] = None
    expected_arrival: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    substitute_part_id: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    handled_by: Optional[UUID] = None


class ShortageRecordResponse(BaseModel):
    id: UUID
    work_order_id: UUID
    part_id: Optional[UUID] = None
    part_name: str
    requested_quantity: int
    available_quantity: int
    status: str
    expected_arrival: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    substitute_part_id: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    handled_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
