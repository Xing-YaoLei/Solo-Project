from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ThresholdConfigBase(BaseModel):
    config_key: str
    config_name: str
    config_value: float
    config_unit: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    updated_by: Optional[str] = None


class ThresholdConfigCreate(ThresholdConfigBase):
    pass


class ThresholdConfigUpdate(BaseModel):
    config_name: Optional[str] = None
    config_value: Optional[float] = None
    config_unit: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    updated_by: Optional[str] = None


class ThresholdConfig(ThresholdConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
