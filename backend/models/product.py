from sqlalchemy import Column, String, Numeric, Text
from models.base import BaseModel


class Product(BaseModel):
    __tablename__ = "products"

    sku = Column(String(64), unique=True, index=True, comment="商品SKU")
    name = Column(String(128), nullable=False, comment="商品名称")
    category = Column(String(64), index=True, comment="商品分类")
    unit = Column(String(16), default="份", comment="计量单位")
    price = Column(Numeric(10, 2), comment="销售单价")
    cost = Column(Numeric(10, 2), comment="成本单价")
    supplier = Column(String(128), comment="供应商")
    description = Column(Text, comment="商品描述")
    image_url = Column(String(512), comment="商品图片")
