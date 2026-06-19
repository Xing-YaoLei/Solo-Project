from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date, ForeignKey
from sqlalchemy.sql import func

from models.database import Base


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    part_code = Column(String(50), unique=True, index=True, comment="配件编码")
    part_name = Column(String(200), comment="配件名称")
    category = Column(String(50), comment="配件分类")
    brand = Column(String(100), comment="品牌")
    spec = Column(String(200), comment="规格型号")
    unit = Column(String(20), default="个", comment="单位")
    unit_price = Column(Float, default=0, comment="单价")
    stock_quantity = Column(Float, default=0, comment="库存数量")
    safe_stock = Column(Float, default=0, comment="安全库存")
    warehouse = Column(String(50), comment="仓库")
    location = Column(String(50), comment="库位")
    supplier = Column(String(100), comment="供应商")
    is_shortage = Column(Boolean, default=False, comment="是否缺货")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PartsStockRecord(Base):
    __tablename__ = "parts_stock_records"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, index=True, comment="配件ID")
    part_code = Column(String(50), comment="配件编码")
    change_type = Column(String(20), comment="变动类型：in/out/adjust")
    quantity = Column(Float, default=0, comment="变动数量")
    balance_before = Column(Float, default=0, comment="变动前库存")
    balance_after = Column(Float, default=0, comment="变动后库存")
    related_order_no = Column(String(50), comment="关联单据号")
    remark = Column(String(500), comment="备注")
    operator = Column(String(50), comment="操作人")
    created_at = Column(DateTime, server_default=func.now())
