from typing import Optional
from pydantic import BaseModel, Field


class UsageRuleCreate(BaseModel):
    material_category: str = Field(..., description="材料类别")
    max_daily_usage: float = 1000.0
    requires_approval: bool = False
    approval_level: int = 0
    description: Optional[str] = None


class UsageRuleUpdate(BaseModel):
    material_category: Optional[str] = None
    max_daily_usage: Optional[float] = None
    requires_approval: Optional[bool] = None
    approval_level: Optional[int] = None
    description: Optional[str] = None


class UsageRuleResponse(BaseModel):
    id: str
    material_category: str
    max_daily_usage: float
    requires_approval: bool
    approval_level: int
    description: Optional[str] = None

    model_config = {"from_attributes": True}
