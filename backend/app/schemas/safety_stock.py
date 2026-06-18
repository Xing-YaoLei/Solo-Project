from typing import Optional
from pydantic import BaseModel, Field


class SafetyStockCreate(BaseModel):
    material_name: str = Field(..., description="材料名称")
    category: Optional[str] = None
    unit: Optional[str] = None
    region: str = Field(..., description="区域")
    min_stock: float = 0.0
    warning_stock: float = 0.0
    max_stock: float = 0.0
    current_stock: float = 0.0
    daily_consumption_rate: float = 0.0


class SafetyStockUpdate(BaseModel):
    material_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    region: Optional[str] = None
    min_stock: Optional[float] = None
    warning_stock: Optional[float] = None
    max_stock: Optional[float] = None
    current_stock: Optional[float] = None
    daily_consumption_rate: Optional[float] = None


class SafetyStockResponse(BaseModel):
    id: str
    material_name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    region: str
    min_stock: float
    warning_stock: float
    max_stock: float
    current_stock: float
    daily_consumption_rate: float

    model_config = {"from_attributes": True}
