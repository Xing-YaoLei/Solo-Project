from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date, ForeignKey
from sqlalchemy.sql import func

from models.database import Base


class InsuranceDocument(Base):
    __tablename__ = "insurance_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_no = Column(String(50), unique=True, index=True, comment="单据号")
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True, comment="关联工单ID")
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, comment="关联预约ID")
    insurance_company = Column(String(100), comment="保险公司")
    policy_no = Column(String(100), comment="保单号")
    claim_no = Column(String(100), comment="理赔号")
    license_plate = Column(String(20), index=True, comment="车牌号")
    insured_name = Column(String(100), comment="被保险人")
    accident_type = Column(String(50), comment="事故类型")
    accident_date = Column(Date, comment="出险日期")
    estimated_amount = Column(Float, default=0, comment="预估金额")
    claim_amount = Column(Float, default=0, comment="理赔金额")
    deductible = Column(Float, default=0, comment="免赔额")
    status = Column(String(20), default="pending", comment="状态：pending/submitted/approved/rejected/paid")
    materials = Column(Text, comment="材料清单JSON")
    reviewer = Column(String(50), comment="审核人")
    review_time = Column(DateTime, comment="审核时间")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
