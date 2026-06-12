from typing import Optional
from decimal import Decimal
from pydantic import Field
from schemas.common import BaseSchema


class ProductBase(BaseSchema):
    sku: str = Field(..., max_length=64, description="商品SKU")
    name: str = Field(..., max_length=128, description="商品名称")
    category: Optional[str] = Field(None, max_length=64, description="商品分类")
    unit: Optional[str] = Field("份", max_length=16, description="计量单位")
    price: Optional[Decimal] = Field(None, description="销售单价")
    cost: Optional[Decimal] = Field(None, description="成本单价")
    supplier: Optional[str] = Field(None, max_length=128, description="供应商")
    description: Optional[str] = Field(None, description="商品描述")
    image_url: Optional[str] = Field(None, max_length=512, description="商品图片")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    sku: Optional[str] = Field(None, max_length=64, description="商品SKU")
    name: Optional[str] = Field(None, max_length=128, description="商品名称")


class ProductResponse(ProductBase):
    pass
