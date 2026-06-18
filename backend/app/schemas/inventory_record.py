from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class InventoryRecordCreate(BaseModel):
    batch_id: str = Field(..., description="批次ID")
    type: str = Field(..., description="类型: in/out/transfer/adjust")
    quantity: float = Field(..., description="数量")
    operator_id: Optional[str] = None
    operator: Optional[str] = None
    region: Optional[str] = None
    remark: Optional[str] = None


class InventoryRecordResponse(BaseModel):
    id: str
    batch_id: str
    type: str
    quantity: float
    operator_id: Optional[str] = None
    operator: Optional[str] = None
    region: Optional[str] = None
    remark: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
