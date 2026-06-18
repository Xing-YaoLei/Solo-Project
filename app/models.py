from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Numeric, Boolean,
    ForeignKey, Date, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    DESIGNER = "designer"
    SUPERVISOR = "supervisor"
    FINANCE = "finance"
    SALES = "sales"
    VIEWER = "viewer"


class ProjectStatus(str, enum.Enum):
    MEASURED = "已量房"
    QUOTED = "已报价"
    CONTRACTED = "已签合同"
    IN_PROGRESS = "施工中"
    COMPLETED = "已竣工"
    CLOSED = "已结案"


class ApprovalStatus(str, enum.Enum):
    PENDING = "待审批"
    APPROVED = "已通过"
    REJECTED = "已驳回"
    ABNORMAL = "异常"


class PaymentStatus(str, enum.Enum):
    UNPAID = "未收款"
    PARTIAL = "部分收款"
    FULL = "已结清"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(256))
    role = Column(SAEnum(RoleEnum), default=RoleEnum.VIEWER, nullable=False)
    hashed_password = Column(String(512))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_no = Column(String(64), unique=True, nullable=False, index=True)
    project_name = Column(String(256), nullable=False)
    customer_name = Column(String(128))
    customer_phone = Column(String(32))
    address = Column(String(512))
    house_type = Column(String(64))
    area = Column(Numeric(12, 2))
    status = Column(SAEnum(ProjectStatus), default=ProjectStatus.MEASURED)
    designer_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    sales_id = Column(Integer, ForeignKey("users.id"))
    measure_date = Column(Date)
    quote_date = Column(Date)
    contract_date = Column(Date)
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    designer = relationship("User", foreign_keys=[designer_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    sales = relationship("User", foreign_keys=[sales_id])
    quotations = relationship("Quotation", back_populates="project")
    contracts = relationship("Contract", back_populates="project")
    purchase_orders = relationship("PurchaseOrder", back_populates="project")
    site_photos = relationship("SitePhoto", back_populates="project")
    approvals = relationship("Approval", back_populates="project")
    payments = relationship("Payment", back_populates="project")


class DesignExport(Base):
    __tablename__ = "design_exports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_name = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    software_name = Column(String(128))
    export_date = Column(Date)
    parsed_data = Column(JSON)
    imported_at = Column(DateTime, default=datetime.now)
    imported_by = Column(Integer, ForeignKey("users.id"))


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    quotation_no = Column(String(64), unique=True, nullable=False, index=True)
    version = Column(String(32), default="v1.0")
    total_amount = Column(Numeric(18, 2), default=0)
    material_cost = Column(Numeric(18, 2), default=0)
    labor_cost = Column(Numeric(18, 2), default=0)
    management_fee = Column(Numeric(18, 2), default=0)
    design_fee = Column(Numeric(18, 2), default=0)
    profit = Column(Numeric(18, 2), default=0)
    discount_rate = Column(Numeric(8, 4), default=0)
    final_amount = Column(Numeric(18, 2), default=0)
    is_approved = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    project = relationship("Project", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    category = Column(String(128))
    item_name = Column(String(256), nullable=False)
    specification = Column(String(512))
    unit = Column(String(32))
    quantity = Column(Numeric(18, 4), default=0)
    unit_price = Column(Numeric(18, 2), default=0)
    subtotal = Column(Numeric(18, 2), default=0)
    remark = Column(Text)

    quotation = relationship("Quotation", back_populates="items")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    contract_no = Column(String(64), unique=True, nullable=False, index=True)
    contract_amount = Column(Numeric(18, 2), default=0)
    signed_date = Column(Date)
    effective_date = Column(Date)
    expiry_date = Column(Date)
    warranty_period = Column(Integer, default=24)
    payment_terms = Column(Text)
    attachment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    project = relationship("Project", back_populates="contracts")
    attachments = relationship("ContractAttachment", back_populates="contract")


class ContractAttachment(Base):
    __tablename__ = "contract_attachments"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    attachment_type = Column(String(64), nullable=False)
    file_name = Column(String(512), nullable=False)
    file_path = Column(String(1024))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.now)
    uploaded_by = Column(Integer, ForeignKey("users.id"))

    contract = relationship("Contract", back_populates="attachments")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    po_no = Column(String(64), unique=True, nullable=False, index=True)
    supplier = Column(String(256))
    category = Column(String(128))
    total_amount = Column(Numeric(18, 2), default=0)
    actual_amount = Column(Numeric(18, 2), default=0)
    order_date = Column(Date)
    delivery_date = Column(Date)
    status = Column(String(64), default="待收货")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    project = relationship("Project", back_populates="purchase_orders")
    items = relationship("PurchaseItem", back_populates="purchase_order")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_name = Column(String(256), nullable=False)
    specification = Column(String(512))
    brand = Column(String(128))
    unit = Column(String(32))
    quantity = Column(Numeric(18, 4), default=0)
    unit_price = Column(Numeric(18, 2), default=0)
    subtotal = Column(Numeric(18, 2), default=0)
    quotation_ref = Column(String(256))
    remark = Column(Text)

    purchase_order = relationship("PurchaseOrder", back_populates="items")


class SitePhoto(Base):
    __tablename__ = "site_photos"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    photo_type = Column(String(64))
    file_name = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    thumbnail_path = Column(String(1024))
    file_size = Column(Integer)
    shoot_time = Column(DateTime)
    uploader_id = Column(Integer, ForeignKey("users.id"))
    description = Column(Text)
    parsed_tags = Column(JSON)
    uploaded_at = Column(DateTime, default=datetime.now)

    project = relationship("Project", back_populates="site_photos")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    approval_type = Column(String(64), nullable=False)
    ref_no = Column(String(64))
    approver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    submit_time = Column(DateTime)
    approve_time = Column(DateTime)
    expected_hours = Column(Numeric(10, 2))
    actual_hours = Column(Numeric(10, 2))
    is_abnormal = Column(Boolean, default=False)
    abnormal_reason = Column(Text)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    project = relationship("Project", back_populates="approvals")
    approver = relationship("User", foreign_keys=[approver_id])


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    payment_no = Column(String(64), unique=True, nullable=False, index=True)
    stage = Column(String(64))
    plan_amount = Column(Numeric(18, 2), default=0)
    actual_amount = Column(Numeric(18, 2), default=0)
    plan_date = Column(Date)
    actual_date = Column(Date)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.UNPAID)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    project = relationship("Project", back_populates="payments")


class RefreshLog(Base):
    __tablename__ = "refresh_logs"

    id = Column(Integer, primary_key=True, index=True)
    refresh_type = Column(String(64), nullable=False)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime)
    status = Column(String(32), default="running")
    records_processed = Column(Integer, default=0)
    error_message = Column(Text)
    triggered_by = Column(Integer, ForeignKey("users.id"))
    celery_task_id = Column(String(128))


class SharedView(Base):
    __tablename__ = "shared_views"

    id = Column(Integer, primary_key=True, index=True)
    view_name = Column(String(256), nullable=False)
    view_code = Column(String(128), unique=True, nullable=False, index=True)
    view_config = Column(JSON)
    allowed_roles = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)


all_models = [
    User, Project, DesignExport, Quotation, QuotationItem,
    Contract, ContractAttachment, PurchaseOrder, PurchaseItem,
    SitePhoto, Approval, Payment, RefreshLog, SharedView
]
