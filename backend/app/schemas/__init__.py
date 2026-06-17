from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, WorkOrderStatus, WorkOrderPriority, WorkOrderCategory


class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[str] = None
    role: UserRole = UserRole.WORKER
    phone: Optional[str] = None
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class WorkOrderPhotoBase(BaseModel):
    url: str
    caption: Optional[str] = None
    photo_type: Optional[str] = None


class WorkOrderPhotoCreate(WorkOrderPhotoBase):
    pass


class WorkOrderPhoto(WorkOrderPhotoBase):
    id: int
    work_order_id: int
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StatusLogBase(BaseModel):
    from_status: Optional[WorkOrderStatus] = None
    to_status: WorkOrderStatus
    remark: Optional[str] = None


class StatusLogCreate(StatusLogBase):
    pass


class StatusLog(StatusLogBase):
    id: int
    work_order_id: int
    operated_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewRecordBase(BaseModel):
    is_passed: bool
    comment: Optional[str] = None


class ReviewRecordCreate(ReviewRecordBase):
    pass


class ReviewRecord(ReviewRecordBase):
    id: int
    work_order_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    review_time: datetime

    class Config:
        from_attributes = True


class CommunicationBase(BaseModel):
    content: str
    msg_type: str = "text"


class CommunicationCreate(CommunicationBase):
    pass


class Communication(CommunicationBase):
    id: int
    work_order_id: int
    sender_id: int
    sender_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DispatchRuleBase(BaseModel):
    name: str
    category: Optional[WorkOrderCategory] = None
    priority: Optional[WorkOrderPriority] = None
    assigned_role: Optional[str] = None
    default_assignee_id: Optional[int] = None
    processing_hours: float = 24
    description: Optional[str] = None
    is_active: bool = True


class DispatchRuleCreate(DispatchRuleBase):
    pass


class DispatchRuleUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[WorkOrderCategory] = None
    priority: Optional[WorkOrderPriority] = None
    assigned_role: Optional[str] = None
    default_assignee_id: Optional[int] = None
    processing_hours: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DispatchRule(DispatchRuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorkOrderBase(BaseModel):
    title: str
    description: str
    location: str
    category: WorkOrderCategory
    priority: WorkOrderPriority = WorkOrderPriority.MEDIUM
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None


class WorkOrderCreate(WorkOrderBase):
    photos: Optional[list[WorkOrderPhotoCreate]] = None


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[WorkOrderCategory] = None
    priority: Optional[WorkOrderPriority] = None
    status: Optional[WorkOrderStatus] = None
    assigned_to: Optional[int] = None
    deadline: Optional[datetime] = None


class WorkOrderAssign(BaseModel):
    assigned_to: int
    remark: Optional[str] = None


class WorkOrderComplete(BaseModel):
    remark: Optional[str] = None
    photos: Optional[list[WorkOrderPhotoCreate]] = None


class WorkOrderReview(BaseModel):
    is_passed: bool
    comment: Optional[str] = None


class WorkOrder(WorkOrderBase):
    id: int
    order_no: str
    status: WorkOrderStatus
    created_by: Optional[int] = None
    assigned_to: Optional[int] = None
    assigned_worker_name: Optional[str] = None
    creator_name: Optional[str] = None
    deadline: Optional[datetime] = None
    processing_hours: float = 0
    is_first_time_resolved: bool = True
    review_failed_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    photos: list[WorkOrderPhoto] = []
    status_logs: list[StatusLog] = []
    review_records: list[ReviewRecord] = []
    communications: list[Communication] = []
    dispatch_rules: list[DispatchRule] = []

    class Config:
        from_attributes = True


class WorkOrderList(BaseModel):
    items: list[WorkOrder]
    total: int
    page: int
    page_size: int


class FirstTimeResolveStats(BaseModel):
    date: str
    total: int
    first_time_resolved: int
    rate: float


class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    in_progress_orders: int
    completed_orders: int
    review_failed_orders: int
    first_time_resolve_rate: float
    first_time_resolve_trend: list[FirstTimeResolveStats]


class WorkOrderDailyItem(BaseModel):
    id: int
    order_no: str
    title: str
    status: WorkOrderStatus
    priority: WorkOrderPriority
    category: WorkOrderCategory
    location: str
    assigned_worker_name: Optional[str] = None
    deadline: Optional[datetime] = None
    is_overdue: bool = False
    review_failed: bool = False
    created_at: datetime
