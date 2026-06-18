from __future__ import annotations

from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = Field(default=0, description="响应码，0 表示成功")
    message: str = Field(default="success", description="响应消息")
    data: Optional[T] = Field(default=None, description="响应数据")

    @classmethod
    def ok(cls, data: T = None, message: str = "success") -> "ApiResponse[T]":
        return cls(code=0, message=message, data=data)

    @classmethod
    def error(cls, code: int = 500, message: str = "error", data: T = None) -> "ApiResponse[T]":
        return cls(code=code, message=message, data=data)


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="页码，从1开始")
    page_size: int = Field(default=20, ge=1, le=200, description="每页条数")
    sort_by: Optional[str] = Field(default=None, description="排序字段")
    sort_order: Optional[str] = Field(default="desc", description="排序方向 asc/desc")


class PaginatedData(BaseModel, Generic[T]):
    items: List[T] = Field(default_factory=list, description="数据列表")
    total: int = Field(default=0, ge=0, description="总条数")
    page: int = Field(default=1, ge=1, description="当前页码")
    page_size: int = Field(default=20, ge=1, description="每页条数")
    total_pages: int = Field(default=0, ge=0, description="总页数")

    @field_validator("total_pages", mode="before")
    @classmethod
    def compute_total_pages(cls, v: int, info) -> int:
        if v and v > 0:
            return v
        values = info.data
        total = values.get("total", 0)
        page_size = values.get("page_size", 20)
        if page_size <= 0:
            return 0
        import math
        return math.ceil(total / page_size)


class SyncDelayInfo(BaseModel):
    source: str = Field(description="数据源")
    source_name: str = Field(description="数据源名称")
    last_sync_at: Optional[datetime] = Field(default=None, description="最后同步时间")
    delay_hours: float = Field(default=0.0, ge=0, description="延迟小时数")
    affected_from: Optional[datetime] = Field(default=None, description="影响起始时间")
    affected_to: Optional[datetime] = Field(default=None, description="影响结束时间")
    is_delayed: bool = Field(default=False, description="是否延迟超过24h")
