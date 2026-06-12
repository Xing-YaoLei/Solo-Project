from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    MANAGER = "manager"
    STAFF = "staff"


class LossStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    FOLLOWING = "following"
    CLOSED = "closed"


class LossCategory(str, enum.Enum):
    RAW_MATERIAL = "raw_material"
    FINISHED_PRODUCT = "finished_product"
    PACKAGING = "packaging"
    EQUIPMENT = "equipment"
    OTHER = "other"


class ReviewResult(str, enum.Enum):
    CONFIRMED = "confirmed"
    NEEDS_FOLLOW_UP = "needs_follow_up"
    DISPUTED = "disputed"


class ApprovalResult(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


class AbnormalType(str, enum.Enum):
    HIGH_LOSS_RATE = "high_loss_rate"
    FREQUENT_LOSS = "frequent_loss"
    LARGE_AMOUNT = "large_amount"
    SUSPICIOUS_PATTERN = "suspicious_pattern"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STAFF, nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store_id = Column(Integer, ForeignKey("stores.id"))
    store = relationship("Store", back_populates="staff")

    created_reports = relationship("LossReport", foreign_keys="LossReport.created_by", back_populates="creator")
    reviews = relationship("Review", back_populates="reviewer")
    approvals = relationship("Approval", back_populates="approver")
    communications = relationship("Communication", back_populates="sender")
    todo_items = relationship("TodoItem", back_populates="assignee")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    city = Column(String(50))
    manager_id = Column(Integer, ForeignKey("users.id"))
    monthly_sales_target = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    staff = relationship("User", back_populates="store", foreign_keys="User.store_id")
    loss_reports = relationship("LossReport", back_populates="store")
    loss_statistics = relationship("LossStatistics", back_populates="store")


class LossReport(Base):
    __tablename__ = "loss_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_no = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(Enum(LossCategory), nullable=False)
    loss_date = Column(DateTime(timezone=True), nullable=False)
    cost_amount = Column(Float, nullable=False)
    sale_amount = Column(Float, default=0)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    description = Column(Text)
    status = Column(Enum(LossStatus), default=LossStatus.DRAFT, nullable=False)
    is_abnormal = Column(Boolean, default=False)
    abnormal_type = Column(Enum(AbnormalType))
    loss_rate = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    store = relationship("Store", back_populates="loss_reports")

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_reports")

    responsible_staff_id = Column(Integer, ForeignKey("users.id"))
    responsible_staff = relationship("User", foreign_keys=[responsible_staff_id])

    reviews = relationship("Review", back_populates="loss_report", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="loss_report", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="loss_report", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="loss_report", cascade="all, delete-orphan")
    todo_items = relationship("TodoItem", back_populates="loss_report", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    review_opinion = Column(Text, nullable=False)
    result = Column(Enum(ReviewResult), nullable=False)
    verified_amount = Column(Float)
    cost_verified = Column(Boolean, default=False)
    store_verified = Column(Boolean, default=False)
    review_time = Column(DateTime(timezone=True), server_default=func.now())
    follow_up_days = Column(Integer, default=3)

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"), nullable=False)
    loss_report = relationship("LossReport", back_populates="reviews")

    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer = relationship("User", back_populates="reviews")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    approval_opinion = Column(Text, nullable=False)
    result = Column(Enum(ApprovalResult), nullable=False)
    approval_time = Column(DateTime(timezone=True), server_default=func.now())

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"), nullable=False)
    loss_report = relationship("LossReport", back_populates="approvals")

    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver = relationship("User", back_populates="approvals")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="comment")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"), nullable=False)
    loss_report = relationship("LossReport", back_populates="communications")

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender = relationship("User", back_populates="communications")

    reply_to_id = Column(Integer, ForeignKey("communications.id"))
    reply_to = relationship("Communication", remote_side=[id])


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"), nullable=False)
    loss_report = relationship("LossReport", back_populates="attachments")

    uploaded_by = Column(Integer, ForeignKey("users.id"))


class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"), nullable=False)
    loss_report = relationship("LossReport", back_populates="todo_items")

    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee = relationship("User", back_populates="todo_items")

    created_by = Column(Integer, ForeignKey("users.id"))


class LossStatistics(Base):
    __tablename__ = "loss_statistics"

    id = Column(Integer, primary_key=True, index=True)
    stat_date = Column(DateTime(timezone=True), nullable=False)
    stat_type = Column(String(20), nullable=False)
    total_loss_amount = Column(Float, default=0)
    total_sales = Column(Float, default=0)
    loss_rate = Column(Float, default=0)
    report_count = Column(Integer, default=0)
    abnormal_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store_id = Column(Integer, ForeignKey("stores.id"))
    store = relationship("Store", back_populates="loss_statistics")

    category = Column(Enum(LossCategory))


class AbnormalAlert(Base):
    __tablename__ = "abnormal_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AbnormalType), nullable=False)
    alert_message = Column(String(500), nullable=False)
    threshold_value = Column(Float)
    actual_value = Column(Float)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    loss_report_id = Column(Integer, ForeignKey("loss_reports.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
