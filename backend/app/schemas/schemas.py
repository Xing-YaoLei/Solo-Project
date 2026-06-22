from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from ..models.models import UserRole, OrderStatus


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.HANDLER
    phone: Optional[str] = None
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class DispatchRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    default_assignee_id: Optional[int] = None
    priority: int = 0
    handling_time_limit: int = 24
    is_active: bool = True


class DispatchRuleCreate(DispatchRuleBase):
    pass


class DispatchRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    default_assignee_id: Optional[int] = None
    priority: Optional[int] = None
    handling_time_limit: Optional[int] = None
    is_active: Optional[bool] = None


class DispatchRule(DispatchRuleBase):
    id: int
    default_assignee: Optional[User] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AffectedObjectBase(BaseModel):
    object_type: str
    object_name: str
    object_id: Optional[str] = None
    description: Optional[str] = None
    impact_level: str = "medium"


class AffectedObjectCreate(AffectedObjectBase):
    pass


class AffectedObject(AffectedObjectBase):
    id: int
    order_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class Attachment(AttachmentBase):
    id: int
    process_record_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ProcessRecordBase(BaseModel):
    action: str
    remark: Optional[str] = None
    new_status: OrderStatus


class ProcessRecordCreate(ProcessRecordBase):
    attachments: Optional[List[AttachmentBase]] = None


class ProcessRecord(ProcessRecordBase):
    id: int
    order_id: int
    handler_id: int
    handler: User
    old_status: Optional[OrderStatus] = None
    attachments: List[Attachment] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewSupplementBase(BaseModel):
    supplement_type: str
    content: Optional[str] = None
    new_assignee_id: Optional[int] = None


class ReviewSupplementCreate(ReviewSupplementBase):
    affected_objects: Optional[List[AffectedObjectCreate]] = None


class ReviewSupplement(ReviewSupplementBase):
    id: int
    order_id: int
    operator_id: int
    operator: User
    old_assignee_id: Optional[int] = None
    old_assignee: Optional[User] = None
    new_assignee: Optional[User] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 1
    audit_type: Optional[str] = None
    audit_item: Optional[str] = None
    location: Optional[str] = None
    site_photo_url: Optional[str] = None
    dispatch_rule_id: Optional[int] = None
    assignee_id: Optional[int] = None
    deadline: Optional[datetime] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrderStatus] = None
    priority: Optional[int] = None
    audit_type: Optional[str] = None
    audit_item: Optional[str] = None
    location: Optional[str] = None
    site_photo_url: Optional[str] = None
    dispatch_rule_id: Optional[int] = None
    assignee_id: Optional[int] = None
    deadline: Optional[datetime] = None


class Order(OrderBase):
    id: int
    order_no: str
    status: OrderStatus
    first_resolved: bool
    processing_count: int
    creator_id: int
    creator: User
    assignee: Optional[User] = None
    dispatch_rule: Optional[DispatchRule] = None
    process_records: List[ProcessRecord] = []
    affected_objects: List[AffectedObject] = []
    review_supplements: List[ReviewSupplement] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: List[Order]
    page: int
    page_size: int


class FirstTimeResolutionStats(BaseModel):
    total_orders: int
    first_time_resolved: int
    first_time_resolution_rate: float
    by_auditor: List[dict] = []
    by_department: List[dict] = []
    by_month: List[dict] = []


class ReviewFailedProcess(BaseModel):
    order_id: int
    affected_objects: List[AffectedObjectCreate]
    supplement: Optional[str] = None
    new_assignee_id: Optional[int] = None
