from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, comment="活动名称")
    activity_type = Column(String(50), nullable=False, default="演出", comment="活动类型：演出/活动")
    venue = Column(String(255), comment="举办地点")
    start_date = Column(Date, nullable=False, comment="活动开始日期")
    end_date = Column(Date, comment="活动结束日期")
    description = Column(Text, comment="活动描述")
    status = Column(String(20), default="active", comment="状态：active/inactive")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    ticket_types = relationship("TicketType", back_populates="activity")
    sponsors = relationship("Sponsor", back_populates="activity")
    registrations = relationship("Registration", back_populates="activity")


class TicketType(Base):
    __tablename__ = "ticket_types"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    name = Column(String(100), nullable=False, comment="票种名称")
    price = Column(Float, nullable=False, default=0.0, comment="票价")
    total_quantity = Column(Integer, nullable=False, default=0, comment="总票数")
    sold_quantity = Column(Integer, default=0, comment="已售数量")
    ticket_category = Column(String(50), comment="票种分类：VIP/普通/学生等")
    description = Column(Text, comment="票种说明")
    sale_start = Column(DateTime, comment="开售时间")
    sale_end = Column(DateTime, comment="停售时间")
    is_refundable = Column(Boolean, default=True, comment="是否可退票")
    created_at = Column(DateTime, server_default=func.now())

    activity = relationship("Activity", back_populates="ticket_types")
    registrations = relationship("Registration", back_populates="ticket_type")


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    name = Column(String(255), nullable=False, comment="赞助商名称")
    sponsor_level = Column(String(50), comment="赞助级别：冠名/特约/一般等")
    allocated_tickets = Column(Integer, default=0, comment="分配票数")
    used_tickets = Column(Integer, default=0, comment="已使用票数")
    contact_person = Column(String(100), comment="联系人")
    contact_phone = Column(String(50), comment="联系电话")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, server_default=func.now())

    activity = relationship("Activity", back_populates="sponsors")
    registrations = relationship("Registration", back_populates="sponsor")


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    ticket_type_id = Column(Integer, ForeignKey("ticket_types.id"), nullable=False)
    sponsor_id = Column(Integer, ForeignKey("sponsors.id"), comment="赞助来源")
    order_no = Column(String(100), unique=True, nullable=False, comment="订单号")
    customer_name = Column(String(100), comment="购票人姓名")
    customer_phone = Column(String(50), comment="购票人电话")
    customer_email = Column(String(255), comment="购票人邮箱")
    quantity = Column(Integer, nullable=False, default=1, comment="购票数量")
    total_amount = Column(Float, nullable=False, default=0.0, comment="订单总金额")
    status = Column(String(20), default="pending", comment="订单状态：pending/paid/refunded/disputed")
    is_disputed = Column(Boolean, default=False, comment="是否有退票争议")
    dispute_reason = Column(Text, comment="争议原因")
    register_time = Column(DateTime, server_default=func.now(), comment="报名时间")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    activity = relationship("Activity", back_populates="registrations")
    ticket_type = relationship("TicketType", back_populates="registrations")
    sponsor = relationship("Sponsor", back_populates="registrations")
    payments = relationship("Payment", back_populates="registration")
    gate_records = relationship("GateRecord", back_populates="registration")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    payment_no = Column(String(100), unique=True, nullable=False, comment="支付流水号")
    amount = Column(Float, nullable=False, comment="支付金额")
    payment_method = Column(String(50), comment="支付方式：微信/支付宝/银行卡等")
    payment_status = Column(String(20), default="pending", comment="支付状态：pending/success/failed/refunded")
    payment_time = Column(DateTime, comment="支付完成时间")
    refund_time = Column(DateTime, comment="退款时间")
    refund_amount = Column(Float, default=0.0, comment="退款金额")
    channel_order_no = Column(String(100), comment="渠道订单号")
    remark = Column(Text, comment="备注")
    sync_source = Column(String(50), comment="同步来源")
    sync_time = Column(DateTime, comment="同步时间")
    created_at = Column(DateTime, server_default=func.now())

    registration = relationship("Registration", back_populates="payments")


class GateRecord(Base):
    __tablename__ = "gate_records"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    ticket_code = Column(String(100), nullable=False, comment="票号/核销码")
    gate_no = Column(String(50), comment="闸机编号")
    check_in_time = Column(DateTime, nullable=False, comment="核销时间")
    check_in_type = Column(String(20), default="entry", comment="核销类型：entry/exit/re-entry")
    operator = Column(String(100), comment="操作人员")
    is_valid = Column(Boolean, default=True, comment="是否有效")
    invalid_reason = Column(String(255), comment="无效原因")
    sync_source = Column(String(50), comment="同步来源")
    sync_time = Column(DateTime, comment="同步时间")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, server_default=func.now())

    registration = relationship("Registration", back_populates="gate_records")


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_type = Column(String(50), nullable=False, comment="异常类型：payment/gate/registration/data_mismatch")
    source_table = Column(String(50), comment="来源表")
    source_id = Column(Integer, comment="来源记录ID")
    description = Column(Text, nullable=False, comment="异常描述")
    severity = Column(String(20), default="warning", comment="严重程度：error/warning/info")
    is_resolved = Column(Boolean, default=False, comment="是否已处理")
    resolved_by = Column(String(100), comment="处理人")
    resolved_time = Column(DateTime, comment="处理时间")
    resolution_note = Column(Text, comment="处理说明")
    detected_time = Column(DateTime, server_default=func.now(), comment="检测时间")
    created_at = Column(DateTime, server_default=func.now())


class Remark(Base):
    __tablename__ = "remarks"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(50), nullable=False, comment="目标类型：chart/activity/ticket_type/sponsor")
    target_id = Column(String(100), nullable=False, comment="目标ID")
    content = Column(Text, nullable=False, comment="备注内容")
    created_by = Column(String(100), default="system", comment="创建人")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    sync_type = Column(String(50), nullable=False, comment="同步类型：payment/gate/registration")
    source = Column(String(100), comment="数据来源")
    total_count = Column(Integer, default=0, comment="总记录数")
    success_count = Column(Integer, default=0, comment="成功数")
    failed_count = Column(Integer, default=0, comment="失败数")
    anomaly_count = Column(Integer, default=0, comment="异常数")
    status = Column(String(20), default="running", comment="状态：running/completed/failed")
    error_message = Column(Text, comment="错误信息")
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, comment="结束时间")
    created_at = Column(DateTime, server_default=func.now())
