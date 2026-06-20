from datetime import datetime as DateTimeType
from datetime import date as DateType
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = Field(default=0, description="响应码，0 表示成功")
    message: str = Field(default="success", description="响应消息")
    data: Optional[T] = Field(default=None, description="响应数据")
    timestamp: int = Field(default_factory=lambda: int(DateTimeType.now().timestamp() * 1000))


class PageInfo(BaseModel):
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页数量")
    total: int = Field(description="总记录数")
    total_pages: int = Field(description="总页数")


class PageResponse(BaseModel, Generic[T]):
    items: List[T] = Field(description="数据列表")
    page_info: PageInfo = Field(description="分页信息")


class KPIOverview(BaseModel):
    total_tickets: int = Field(description="总票量")
    total_tickets_change: float = Field(description="总票量环比变化率")
    sold_rate: float = Field(description="已售率")
    sold_rate_change: float = Field(description="已售率环比变化率")
    checkin_rate: float = Field(description="核销率")
    checkin_rate_change: float = Field(description="核销率环比变化率")
    sponsorship_completion_rate: float = Field(description="赞助完成率")
    sponsorship_completion_rate_change: float = Field(description="赞助完成率环比变化率")
    refund_rate: float = Field(description="退票率")
    refund_rate_change: float = Field(description="退票率环比变化率")


class KPITrendPoint(BaseModel):
    date: DateType = Field(description="日期")
    fulfillment_rate: float = Field(description="权益兑现率")
    anomaly_warning: int = Field(description="异常预警数量")


class PipelineStatus(BaseModel):
    task_code: str = Field(description="任务编码")
    task_name: str = Field(description="任务名称")
    source_type: str = Field(description="数据源类型")
    last_sync_time: Optional[DateTimeType] = Field(description="最近同步时间")
    last_sync_count: int = Field(description="最近同步记录数")
    status: str = Field(description="同步状态")
    delay_seconds: int = Field(description="延迟秒数")


class SyncLog(BaseModel):
    id: int = Field(description="日志ID")
    task_code: str = Field(description="任务编码")
    level: str = Field(description="日志级别")
    message: str = Field(description="日志消息")
    detail: Optional[str] = Field(description="详细信息")
    created_at: DateTimeType = Field(description="创建时间")


class SeatHeatmapItem(BaseModel):
    area_code: str = Field(description="区域编码")
    area_name: str = Field(description="区域名称")
    total_seats: int = Field(description="总座位数")
    sold_seats: int = Field(description="已售座位数")
    sales_rate: float = Field(description="销售率")
    sales_rate_yoy: Optional[float] = Field(description="同比变化率")
    sales_rate_mom: Optional[float] = Field(description="环比变化率")
    polygon_geom: Optional[str] = Field(description="区域多边形几何")


class CheckinTrendPoint(BaseModel):
    date: DateType = Field(description="日期")
    generated_count: int = Field(description="签到码生成数")
    checked_count: int = Field(description="签到码核销数")
    generated_yoy: Optional[float] = Field(description="生成数同比")
    generated_mom: Optional[float] = Field(description="生成数环比")
    checked_yoy: Optional[float] = Field(description="核销数同比")
    checked_mom: Optional[float] = Field(description="核销数环比")


class SponsorshipItem(BaseModel):
    id: str = Field(description="权益ID")
    sponsor_id: str = Field(description="赞助商ID")
    sponsor_name: str = Field(description="赞助商名称")
    sponsor_level: str = Field(description="赞助级别")
    benefit_type: str = Field(description="权益类型")
    contract_qty: int = Field(description="合同数量")
    fulfilled_qty: int = Field(description="已兑现数量")
    completion_rate: float = Field(description="完成率")
    status: str = Field(description="状态")
    deadline: DateType = Field(description="截止日期")
    risk_tag: Optional[str] = Field(description="风险标签")


class FulfillmentRecord(BaseModel):
    id: str = Field(description="兑现记录ID")
    fulfilled_at: DateTimeType = Field(description="兑现时间")
    quantity: int = Field(description="兑现数量")
    recipient: str = Field(description="接收方")
    remark: Optional[str] = Field(description="备注")


class SponsorshipDetail(BaseModel):
    id: str = Field(description="权益ID")
    sponsor_id: str = Field(description="赞助商ID")
    sponsor_name: str = Field(description="赞助商名称")
    sponsor_level: str = Field(description="赞助级别")
    sponsor_contact: str = Field(description="赞助商联系人")
    benefit_type: str = Field(description="权益类型")
    contract_qty: int = Field(description="合同数量")
    fulfilled_qty: int = Field(description="已兑现数量")
    completion_rate: float = Field(description="完成率")
    status: str = Field(description="状态")
    deadline: DateType = Field(description="截止日期")
    fulfillment_records: List[FulfillmentRecord] = Field(description="兑现记录列表")


class VerificationEfficiency(BaseModel):
    gate_no: str = Field(description="通道编号")
    total_checkins: int = Field(description="总核销数")
    avg_processing_seconds: float = Field(description="平均处理秒数")
    efficiency_score: float = Field(description="效率评分")
    group: str = Field(description="聚合分组")


class VerificationDatePoint(BaseModel):
    date: DateType = Field(description="日期")
    checkin_count: int = Field(description="核销数量")
    checkin_rate: float = Field(description="核销率")


class VerificationAreaItem(BaseModel):
    area_code: str = Field(description="区域编码")
    area_name: str = Field(description="区域名称")
    checkin_count: int = Field(description="核销数量")
    checkin_rate: float = Field(description="核销率")


class VerificationDefinition(BaseModel):
    formula: str = Field(description="核销计算公式")
    data_source: str = Field(description="数据来源说明")
    exception_rules: List[str] = Field(description="异常处理规则列表")


class TicketRankItem(BaseModel):
    rule_id: str = Field(description="票种规则ID")
    rule_name: str = Field(description="票种规则名称")
    ticket_type: str = Field(description="票种类型")
    price: float = Field(description="价格")
    sold_count: int = Field(description="销售数量（绝对值）")
    sold_ratio: float = Field(description="销售占比")
    rank: int = Field(description="排名")


class RefundDistributionPoint(BaseModel):
    date: DateType = Field(description="日期")
    refund_count: int = Field(description="退票数量")
    refund_amount: float = Field(description="退票金额")
    disputed_count: int = Field(description="争议数量")
    disputed_points: List[str] = Field(default_factory=list, description="争议点退票ID列表")


class RefundSample(BaseModel):
    id: str = Field(description="退票ID")
    payment_id: str = Field(description="支付ID")
    registration_id: str = Field(description="报名ID")
    registrant_name: str = Field(description="报名人姓名")
    registrant_phone: str = Field(description="报名人电话")
    ticket_type: str = Field(description="票种类型")
    original_amount: float = Field(description="原始金额")
    refund_amount: float = Field(description="退票金额")
    reason: str = Field(description="退票原因")
    is_disputed: bool = Field(description="是否争议")
    dispute_note: Optional[str] = Field(description="争议备注")
    refunded_at: DateTimeType = Field(description="退票时间")
    order_no: str = Field(description="订单号")
    payment_channel: str = Field(description="支付渠道")
    paid_at: DateTimeType = Field(description="支付时间")
    gate_record: Optional[dict] = Field(description="闸机记录")
    operation_logs: List[dict] = Field(default_factory=list, description="操作日志列表")
