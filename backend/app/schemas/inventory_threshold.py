from typing import Optional
from pydantic import BaseModel, Field


class InventoryThresholdCreate(BaseModel):
    material_category: str = Field(..., description="材料类别")
    allowed_error_rate: float = 0.05
    overstock_warning_threshold: float = 1.5
    description: Optional[str] = None


class InventoryThresholdUpdate(BaseModel):
    material_category: Optional[str] = None
    allowed_error_rate: Optional[float] = None
    overstock_warning_threshold: Optional[float] = None
    description: Optional[str] = None


class InventoryThresholdResponse(BaseModel):
    id: str
    material_category: str
    allowed_error_rate: float
    overstock_warning_threshold: float
    description: Optional[str] = None

    model_config = {"from_attributes": True}
