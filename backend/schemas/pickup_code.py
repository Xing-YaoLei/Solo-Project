from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema
from schemas.after_sale_voucher import AfterSaleVoucherResponse


class PickupCodeBase(BaseSchema):
    group_batch_id: int = Field(..., description="团单ID")
    code: str = Field(..., max_length=32, description="自提码")
    qr_code: Optional[str] = Field(None, max_length=512, description="二维码链接")
    customer_name: Optional[str] = Field(None, max_length=32, description="客户姓名")
    customer_phone: Optional[str] = Field(None, max_length=16, description="客户手机号")
    order_no: Optional[str] = Field(None, max_length=64, description="订单号")
    product_info: Optional[str] = Field(None, description="商品信息(JSON)")
    total_items: Optional[int] = Field(0, description="商品件数")
    total_amount: Optional[Decimal] = Field(Decimal("0"), description="订单金额")
    status: Optional[str] = Field("unused", max_length=32, description="状态")
    pickup_time: Optional[datetime] = Field(None, description="提货时间")
    pickup_operator: Optional[str] = Field(None, max_length=32, description="提货操作人")
    expire_time: Optional[datetime] = Field(None, description="过期时间")
    remark: Optional[str] = Field(None, description="备注")
    is_notified: Optional[bool] = Field(False, description="是否已通知")


class PickupCodeCreate(PickupCodeBase):
    pass


class PickupCodeUpdate(PickupCodeBase):
    group_batch_id: Optional[int] = Field(None, description="团单ID")
    code: Optional[str] = Field(None, max_length=32, description="自提码")


class PickupCodeStatusUpdate(BaseSchema):
    status: str = Field(..., max_length=32, description="新状态")
    change_reason: Optional[str] = Field(None, description="变更原因")
    operator: Optional[str] = Field(None, max_length=32, description="操作人")


class PickupCodeResponse(PickupCodeBase):
    after_sale_vouchers: Optional[List[AfterSaleVoucherResponse]] = None
