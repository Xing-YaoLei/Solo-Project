from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=100, description="每页条数")
    keyword: Optional[str] = Field(default=None, description="搜索关键词")


class PageResponse(BaseModel, Generic[T]):
    total: int = Field(description="总数")
    page: int = Field(description="页码")
    page_size: int = Field(description="每页条数")
    list: List[T] = Field(description="数据列表")


class ApiResponse(BaseModel, Generic[T]):
    code: int = Field(default=0, description="状态码, 0表示成功")
    message: str = Field(default="success", description="消息")
    data: Optional[T] = Field(default=None, description="数据")

    @classmethod
    def success(cls, data: Any = None, message: str = "success"):
        return cls(code=0, message=message, data=data)

    @classmethod
    def error(cls, code: int = -1, message: str = "error"):
        return cls(code=code, message=message, data=None)


class BaseSchema(BaseModel):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
