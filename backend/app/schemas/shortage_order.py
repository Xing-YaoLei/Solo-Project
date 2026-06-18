from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


class ShortageOrderCreate(BaseModel):
    batch_id: Optional[str] = None
    material_name: str = Field(..., description="材料名称")
    shortage_quantity: float = Field(..., description="短缺数量")
    unit: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    deadline: Optional[date] = None


class ShortageOrderUpdate(BaseModel):
    batch_id: Optional[str] = None
    material_name: Optional[str] = None
    shortage_quantity: Optional[float] = None
    unit: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[date] = None


class ShortageHandleRequest(BaseModel):
    action: str = Field(..., description="操作: supplement/retry/close")
    remark: Optional[str] = None
    supplement_quantity: Optional[float] = None


class ShortageActionLogResponse(BaseModel):
    id: str
    shortage_order_id: str
    action: str
    operator_id: Optional[str] = None
    operator: Optional[str] = None
    remark: Optional[str] = None
    supplement_quantity: Optional[float] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ShortageOrderResponse(BaseModel):
    id: str
    batch_id: Optional[str] = None
    material_name: str
    shortage_quantity: float
    unit: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    priority: str
    status: str
    deadline: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    action_logs: Optional[List[ShortageActionLogResponse]] = None

    model_config = {"from_attributes": True}
