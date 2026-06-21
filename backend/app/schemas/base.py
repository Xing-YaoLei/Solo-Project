from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer


T = TypeVar("T")


class UUIDMixin(BaseModel):
    id: str

    @field_serializer("id")
    def serialize_id(self, v: Any) -> str:
        if isinstance(v, UUID):
            return str(v)
        return v


class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class BaseSchema(UUIDMixin, TimestampMixin):
    model_config = ConfigDict(from_attributes=True)


class PageParams(BaseModel):
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(20, ge=1, le=100, description="每页数量")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class SuccessResponse(BaseModel):
    message: str = "操作成功"
