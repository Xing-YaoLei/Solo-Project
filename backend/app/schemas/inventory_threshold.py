from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class InventoryThresholdBase(BaseModel):
    material_category: str = Field(..., max_length=100, description="物料分类")
    allowed_error_rate: float = Field(default=0.05, ge=0.0, le=1.0, description="允许误差率")
    overstock_warning_threshold: float = Field(..., gt=0, description="积压预警阈值")
    description: Optional[str] = Field(default=None, description="描述")


class InventoryThresholdCreate(InventoryThresholdBase):
    pass


class InventoryThresholdUpdate(BaseModel):
    material_category: Optional[str] = Field(default=None, max_length=100, description="物料分类")
    allowed_error_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="允许误差率")
    overstock_warning_threshold: Optional[float] = Field(default=None, gt=0, description="积压预警阈值")
    description: Optional[str] = Field(default=None, description="描述")


class InventoryThresholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="阈值ID")
    material_category: str = Field(description="物料分类")
    allowed_error_rate: float = Field(description="允许误差率")
    overstock_warning_threshold: float = Field(description="积压预警阈值")
    description: Optional[str] = Field(description="描述")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
