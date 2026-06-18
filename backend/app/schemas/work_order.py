import enum
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel


class Priority(str, enum.Enum):
    normal = "normal"
    urgent = "urgent"
    critical = "critical"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    in_inspection = "in_inspection"
    completed = "completed"
    closed = "closed"
    rework = "rework"


class WorkOrderCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    vehicle_plate: str
    vehicle_model: Optional[str] = None
    vin: Optional[str] = None
    priority: Priority = Priority.normal
    assigned_consultant_id: Optional[UUID] = None
    assigned_technician_id: Optional[UUID] = None
    estimated_completion: Optional[datetime] = None
    mileage_in: Optional[int] = None
    customer_complaint: Optional[str] = None


class WorkOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    vin: Optional[str] = None
    priority: Optional[Priority] = None
    assigned_consultant_id: Optional[UUID] = None
    assigned_technician_id: Optional[UUID] = None
    estimated_completion: Optional[datetime] = None
    mileage_in: Optional[int] = None
    customer_complaint: Optional[str] = None


class WorkOrderResponse(BaseModel):
    id: UUID
    order_no: str
    customer_name: str
    customer_phone: Optional[str] = None
    vehicle_plate: str
    vehicle_model: Optional[str] = None
    vin: Optional[str] = None
    priority: str
    status: str
    assigned_consultant_id: Optional[UUID] = None
    assigned_technician_id: Optional[UUID] = None
    estimated_completion: Optional[datetime] = None
    mileage_in: Optional[int] = None
    customer_complaint: Optional[str] = None
    total_amount: float
    is_rework: bool
    original_order_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkOrderListResponse(BaseModel):
    items: list[WorkOrderResponse]
    total: int
    page: int
    page_size: int
