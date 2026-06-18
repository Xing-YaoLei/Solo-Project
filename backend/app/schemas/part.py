from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


class PartCreate(BaseModel):
    part_no: str
    name: str
    category: Optional[str] = None
    unit: Optional[str] = "个"
    stock_quantity: int = 0
    min_stock: int = 0
    unit_price: float
    location: Optional[str] = None


class PartUpdate(BaseModel):
    part_no: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit_price: Optional[float] = None
    location: Optional[str] = None


class PartResponse(BaseModel):
    id: UUID
    part_no: str
    name: str
    category: Optional[str] = None
    unit: Optional[str] = "个"
    stock_quantity: int
    min_stock: int
    unit_price: float
    location: Optional[str] = None

    model_config = {"from_attributes": True}


class WorkOrderPartCreate(BaseModel):
    part_id: UUID
    quantity: int
    unit_price: float


class WorkOrderPartResponse(BaseModel):
    id: UUID
    work_order_id: UUID
    part_id: UUID
    part_name: Optional[str] = None
    quantity: int
    unit_price: float
    status: str
    issued_by: Optional[UUID] = None
    issued_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
