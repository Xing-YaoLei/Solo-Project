from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SafetyStockConfigBase(BaseModel):
    material_name: str = Field(..., max_length=200, description="物料名称")
    category: str = Field(..., max_length=100, description="分类")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    region: str = Field(..., max_length=100, description="区域")
    min_stock: float = Field(..., gt=0, description="最低库存")
    warning_stock: float = Field(..., gt=0, description="预警库存")
    max_stock: float = Field(..., gt=0, description="最高库存")
    current_stock: float = Field(default=0.0, ge=0.0, description="当前库存")
    daily_consumption_rate: float = Field(default=0.0, ge=0.0, description="每日消耗量")


class SafetyStockConfigCreate(SafetyStockConfigBase):
    pass


class SafetyStockConfigUpdate(BaseModel):
    material_name: Optional[str] = Field(default=None, max_length=200, description="物料名称")
    category: Optional[str] = Field(default=None, max_length=100, description="分类")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    region: Optional[str] = Field(default=None, max_length=100, description="区域")
    min_stock: Optional[float] = Field(default=None, gt=0, description="最低库存")
    warning_stock: Optional[float] = Field(default=None, gt=0, description="预警库存")
    max_stock: Optional[float] = Field(default=None, gt=0, description="最高库存")
    current_stock: Optional[float] = Field(default=None, ge=0.0, description="当前库存")
    daily_consumption_rate: Optional[float] = Field(default=None, ge=0.0, description="每日消耗量")


class SafetyStockConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="配置ID")
    material_name: str = Field(description="物料名称")
    category: str = Field(description="分类")
    unit: Optional[str] = Field(description="单位")
    region: str = Field(description="区域")
    min_stock: float = Field(description="最低库存")
    warning_stock: float = Field(description="预警库存")
    max_stock: float = Field(description="最高库存")
    current_stock: float = Field(description="当前库存")
    daily_consumption_rate: float = Field(description="每日消耗量")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
