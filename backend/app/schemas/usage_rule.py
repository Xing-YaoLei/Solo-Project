from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class UsageRuleBase(BaseModel):
    material_category: str = Field(..., max_length=100, description="物料分类")
    max_daily_usage: float = Field(..., gt=0, description="每日最大使用量")
    requires_approval: bool = Field(default=False, description="是否需要审批")
    approval_level: int = Field(default=1, ge=1, le=5, description="审批级别")
    description: Optional[str] = Field(default=None, description="描述")


class UsageRuleCreate(UsageRuleBase):
    pass


class UsageRuleUpdate(BaseModel):
    material_category: Optional[str] = Field(default=None, max_length=100, description="物料分类")
    max_daily_usage: Optional[float] = Field(default=None, gt=0, description="每日最大使用量")
    requires_approval: Optional[bool] = Field(default=None, description="是否需要审批")
    approval_level: Optional[int] = Field(default=None, ge=1, le=5, description="审批级别")
    description: Optional[str] = Field(default=None, description="描述")


class UsageRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="规则ID")
    material_category: str = Field(description="物料分类")
    max_daily_usage: float = Field(description="每日最大使用量")
    requires_approval: bool = Field(description="是否需要审批")
    approval_level: int = Field(description="审批级别")
    description: Optional[str] = Field(description="描述")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
