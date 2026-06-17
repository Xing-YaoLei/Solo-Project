from datetime import date, datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class DashboardStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_materials: int = Field(description="物料总数")
    total_quantity: float = Field(description="库存总数量")
    total_value: float = Field(description="库存总价值")
    in_stock_count: int = Field(description="在库批次数量")
    in_use_count: int = Field(description="使用中批次数量")
    shortage_count: int = Field(description="短缺批次数量")
    pending_shortage_orders: int = Field(description="待处理短缺工单数量")
    today_in_count: int = Field(description="今日入库数量")
    today_out_count: int = Field(description="今日出库数量")
    low_stock_alerts: int = Field(description="低库存预警数量")
    overstock_alerts: int = Field(description="积压预警数量")


class TrendDataPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date = Field(description="日期")
    in_quantity: float = Field(default=0.0, description="入库数量")
    out_quantity: float = Field(default=0.0, description="出库数量")
    balance: float = Field(default=0.0, description="结存数量")


class TrendData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    period: str = Field(description="统计周期")
    data_points: List[TrendDataPoint] = Field(description="数据点列表")


class TurnoverAnalysisItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str = Field(description="物料分类")
    total_in: float = Field(description="入库总量")
    total_out: float = Field(description="出库总量")
    average_stock: float = Field(description="平均库存")
    turnover_rate: float = Field(description="周转率")
    turnover_days: float = Field(description="周转天数")


class TurnoverAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[TurnoverAnalysisItem] = Field(description="周转分析列表")
    overall_turnover_rate: float = Field(description="整体周转率")
    overall_turnover_days: float = Field(description="整体周转天数")


class RegionDistributionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    region: str = Field(description="区域")
    batch_count: int = Field(description="批次数量")
    total_quantity: float = Field(description="总数量")
    percentage: float = Field(description="占比")


class RegionDistribution(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[RegionDistributionItem] = Field(description="区域分布列表")


class CategoryDistributionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str = Field(description="分类")
    batch_count: int = Field(description="批次数量")
    total_quantity: float = Field(description="总数量")
    percentage: float = Field(description="占比")


class CategoryDistribution(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[CategoryDistributionItem] = Field(description="分类分布列表")


class SupplierPerformanceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int = Field(description="供应商ID")
    supplier_name: str = Field(description="供应商名称")
    delivery_count: int = Field(description="送货次数")
    on_time_count: int = Field(description="准时次数")
    on_time_rate: float = Field(description="准时率")
    quality_score: float = Field(description="质量评分")
    credit_rating: str = Field(description="信用评级")


class SupplierPerformance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[SupplierPerformanceItem] = Field(description="供应商绩效列表")
