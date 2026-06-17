from datetime import datetime, date
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class MaterialBatchStatus(str, Enum):
    PENDING = "pending"
    IN_STOCK = "in_stock"
    IN_USE = "in_use"
    SHORTAGE = "shortage"
    COMPLETED = "completed"


class MaterialBatchBase(BaseModel):
    batch_no: str = Field(..., max_length=50, description="批次号")
    material_name: str = Field(..., max_length=200, description="物料名称")
    category: str = Field(..., max_length=100, description="分类")
    specification: Optional[str] = Field(default=None, max_length=200, description="规格")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    quantity: float = Field(..., gt=0, description="数量")
    supplier_id: Optional[int] = Field(default=None, description="供应商ID")
    supplier_name: Optional[str] = Field(default=None, max_length=200, description="供应商名称")
    region: Optional[str] = Field(default=None, max_length=100, description="区域")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人")
    status: MaterialBatchStatus = Field(default=MaterialBatchStatus.PENDING, description="状态")
    in_date: Optional[date] = Field(default=None, description="入库日期")
    expected_turnover_days: Optional[int] = Field(default=None, gt=0, description="预期周转天数")
    actual_turnover_days: Optional[int] = Field(default=None, gt=0, description="实际周转天数")
    remark: Optional[str] = Field(default=None, description="备注")


class MaterialBatchCreate(MaterialBatchBase):
    pass


class MaterialBatchUpdate(BaseModel):
    batch_no: Optional[str] = Field(default=None, max_length=50, description="批次号")
    material_name: Optional[str] = Field(default=None, max_length=200, description="物料名称")
    category: Optional[str] = Field(default=None, max_length=100, description="分类")
    specification: Optional[str] = Field(default=None, max_length=200, description="规格")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    quantity: Optional[float] = Field(default=None, gt=0, description="数量")
    supplier_id: Optional[int] = Field(default=None, description="供应商ID")
    supplier_name: Optional[str] = Field(default=None, max_length=200, description="供应商名称")
    region: Optional[str] = Field(default=None, max_length=100, description="区域")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人")
    status: Optional[MaterialBatchStatus] = Field(default=None, description="状态")
    in_date: Optional[date] = Field(default=None, description="入库日期")
    expected_turnover_days: Optional[int] = Field(default=None, gt=0, description="预期周转天数")
    actual_turnover_days: Optional[int] = Field(default=None, gt=0, description="实际周转天数")
    remark: Optional[str] = Field(default=None, description="备注")


class MaterialBatchQueryParams(BaseModel):
    status: Optional[MaterialBatchStatus] = Field(default=None, description="状态筛选")
    start_date: Optional[date] = Field(default=None, description="开始日期")
    end_date: Optional[date] = Field(default=None, description="结束日期")
    region: Optional[str] = Field(default=None, max_length=100, description="区域筛选")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人筛选")
    category: Optional[str] = Field(default=None, max_length=100, description="分类筛选")
    keyword: Optional[str] = Field(default=None, description="关键词搜索")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")
    sort_by: Optional[str] = Field(default=None, description="排序字段")
    sort_order: Optional[str] = Field(default="desc", description="排序方向")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class MaterialBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="批次ID")
    batch_no: str = Field(description="批次号")
    material_name: str = Field(description="物料名称")
    category: str = Field(description="分类")
    specification: Optional[str] = Field(description="规格")
    unit: Optional[str] = Field(description="单位")
    quantity: float = Field(description="数量")
    supplier_id: Optional[int] = Field(description="供应商ID")
    supplier_name: Optional[str] = Field(description="供应商名称")
    region: Optional[str] = Field(description="区域")
    responsible_person: Optional[str] = Field(description="负责人")
    status: MaterialBatchStatus = Field(description="状态")
    in_date: Optional[date] = Field(description="入库日期")
    expected_turnover_days: Optional[int] = Field(description="预期周转天数")
    actual_turnover_days: Optional[int] = Field(description="实际周转天数")
    remark: Optional[str] = Field(description="备注")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
