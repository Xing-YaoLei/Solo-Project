from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from models.base import BaseModel


class ProductTagType:
    QUALITY = "quality"
    FRESH = "fresh"
    COLD = "cold"
    FRAGILE = "fragile"
    SPECIAL = "special"
    OTHER = "other"

    CHOICES = [
        (QUALITY, "品质异常"),
        (FRESH, "新鲜度"),
        (COLD, "冷链"),
        (FRAGILE, "易碎"),
        (SPECIAL, "特殊商品"),
        (OTHER, "其他"),
    ]


class ProductTag(BaseModel):
    __tablename__ = "product_tags"

    arrival_list_id = Column(Integer, ForeignKey("arrival_lists.id"), nullable=False, index=True, comment="到货清单ID")
    tag_type = Column(String(32), index=True, comment="标签类型")
    tag_name = Column(String(64), comment="标签名称")
    tag_color = Column(String(16), default="#ff4d4f", comment="标签颜色")
    description = Column(Text, comment="标签说明")
    operator = Column(String(32), comment="打标人")

    arrival_list = relationship("ArrivalList", back_populates="product_tags")
