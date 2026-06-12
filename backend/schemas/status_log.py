from typing import Optional
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema


class StatusLogBase(BaseSchema):
    related_type: str = Field(..., max_length=32, description="关联类型")
    related_id: int = Field(..., description="关联ID")
    old_status: Optional[str] = Field(None, max_length=64, description="原状态")
    new_status: str = Field(..., max_length=64, description="新状态")
    change_reason: Optional[str] = Field(None, description="变更原因")
    operator: Optional[str] = Field(None, max_length=32, description="操作人")
    operation_time: Optional[datetime] = Field(None, description="操作时间")
    extra_info: Optional[str] = Field(None, description="扩展信息(JSON)")


class StatusLogResponse(StatusLogBase):
    pass
