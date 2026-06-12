from typing import Optional
from pydantic import Field
from schemas.common import BaseSchema


class ProductTagBase(BaseSchema):
    arrival_list_id: int = Field(..., description="到货清单ID")
    tag_type: Optional[str] = Field(None, max_length=32, description="标签类型")
    tag_name: Optional[str] = Field(None, max_length=64, description="标签名称")
    tag_color: Optional[str] = Field("#ff4d4f", max_length=16, description="标签颜色")
    description: Optional[str] = Field(None, description="标签说明")
    operator: Optional[str] = Field(None, max_length=32, description="打标人")


class ProductTagCreate(ProductTagBase):
    pass


class ProductTagUpdate(ProductTagBase):
    arrival_list_id: Optional[int] = Field(None, description="到货清单ID")


class ProductTagResponse(ProductTagBase):
    pass
