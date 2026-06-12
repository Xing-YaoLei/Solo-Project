from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema
from schemas.product_tag import ProductTagResponse


class ArrivalListBase(BaseSchema):
    group_batch_id: int = Field(..., description="团单ID")
    product_id: int = Field(..., description="商品ID")
    product_sku: Optional[str] = Field(None, max_length=64, description="商品SKU")
    product_name: Optional[str] = Field(None, max_length=128, description="商品名称")
    expected_quantity: Optional[int] = Field(0, description="预计到货数量")
    actual_quantity: Optional[int] = Field(0, description="实际到货数量")
    shortage_quantity: Optional[int] = Field(0, description="短少数量")
    unit_price: Optional[Decimal] = Field(None, description="单价")
    total_amount: Optional[Decimal] = Field(None, description="金额")
    status: Optional[str] = Field("pending", max_length=32, description="状态")
    arrival_time: Optional[datetime] = Field(None, description="到货时间")
    warehouse_operator: Optional[str] = Field(None, max_length=32, description="仓管员")
    remark: Optional[str] = Field(None, description="备注")
    has_exception: Optional[int] = Field(0, description="是否有异常")


class ArrivalListCreate(ArrivalListBase):
    pass


class ArrivalListUpdate(ArrivalListBase):
    group_batch_id: Optional[int] = Field(None, description="团单ID")
    product_id: Optional[int] = Field(None, description="商品ID")


class ArrivalConfirm(BaseSchema):
    actual_quantity: int = Field(..., ge=0, description="实际到货数量")
    arrival_time: Optional[datetime] = Field(None, description="到货时间")
    warehouse_operator: Optional[str] = Field(None, max_length=32, description="仓管员")
    remark: Optional[str] = Field(None, description="备注")
    create_exception_on_shortage: Optional[bool] = Field(True, description="短少时自动生成异常单")


class ArrivalListResponse(ArrivalListBase):
    product_tags: Optional[List[ProductTagResponse]] = None
