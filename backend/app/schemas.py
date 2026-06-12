from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import (
    UserRole, LossStatus, LossCategory, ReviewResult,
    ApprovalResult, AbnormalType
)


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.STAFF
    store_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithStore(UserResponse):
    store_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class StoreBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    address: Optional[str] = None
    city: Optional[str] = None
    manager_id: Optional[int] = None
    monthly_sales_target: float = 0


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    id: int
    is_active: bool
    created_at: datetime
    manager_name: Optional[str] = None

    class Config:
        from_attributes = True


class StoreWithStats(StoreResponse):
    current_month_loss: float = 0
    current_month_loss_rate: float = 0


class LossReportBase(BaseModel):
    title: str = Field(..., max_length=200)
    category: LossCategory
    loss_date: datetime
    cost_amount: float = Field(..., gt=0)
    sale_amount: float = 0
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., max_length=20)
    description: Optional[str] = None
    store_id: int
    responsible_staff_id: Optional[int] = None


class LossReportCreate(LossReportBase):
    pass


class LossReportUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[LossCategory] = None
    loss_date: Optional[datetime] = None
    cost_amount: Optional[float] = None
    sale_amount: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    status: Optional[LossStatus] = None
    responsible_staff_id: Optional[int] = None


class LossReportResponse(LossReportBase):
    id: int
    report_no: str
    status: LossStatus
    is_abnormal: bool
    abnormal_type: Optional[AbnormalType] = None
    loss_rate: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    creator_name: Optional[str] = None
    store_name: Optional[str] = None
    responsible_staff_name: Optional[str] = None

    class Config:
        from_attributes = True


class LossReportDetail(LossReportResponse):
    reviews: List["ReviewResponse"] = []
    approvals: List["ApprovalResponse"] = []
    communications: List["CommunicationResponse"] = []


class ReviewBase(BaseModel):
    review_opinion: str = Field(..., min_length=1)
    result: ReviewResult
    verified_amount: Optional[float] = None
    cost_verified: bool = False
    store_verified: bool = False
    follow_up_days: int = 3


class ReviewCreate(ReviewBase):
    loss_report_id: int


class ReviewResponse(ReviewBase):
    id: int
    review_time: datetime
    loss_report_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalBase(BaseModel):
    approval_opinion: str = Field(..., min_length=1)
    result: ApprovalResult


class ApprovalCreate(ApprovalBase):
    loss_report_id: int


class ApprovalResponse(ApprovalBase):
    id: int
    approval_time: datetime
    loss_report_id: int
    approver_id: int
    approver_name: Optional[str] = None

    class Config:
        from_attributes = True


class CommunicationBase(BaseModel):
    message: str = Field(..., min_length=1)
    message_type: str = "comment"
    loss_report_id: int
    reply_to_id: Optional[int] = None


class CommunicationCreate(CommunicationBase):
    pass


class CommunicationResponse(CommunicationBase):
    id: int
    created_at: datetime
    sender_id: int
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None

    class Config:
        from_attributes = True


class TodoItemBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    loss_report_id: int
    assignee_id: int


class TodoItemCreate(TodoItemBase):
    pass


class TodoItemResponse(TodoItemBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    assignee_name: Optional[str] = None
    loss_report_no: Optional[str] = None

    class Config:
        from_attributes = True


class LossStatisticsBase(BaseModel):
    stat_date: datetime
    stat_type: str
    total_loss_amount: float = 0
    total_sales: float = 0
    loss_rate: float = 0
    report_count: int = 0
    abnormal_count: int = 0
    store_id: Optional[int] = None
    category: Optional[LossCategory] = None


class LossStatisticsResponse(LossStatisticsBase):
    id: int
    store_name: Optional[str] = None

    class Config:
        from_attributes = True


class LossTrendItem(BaseModel):
    date: str
    loss_amount: float
    loss_rate: float
    report_count: int


class StoreLossRank(BaseModel):
    store_id: int
    store_name: str
    loss_amount: float
    loss_rate: float
    rank: int


class DashboardStats(BaseModel):
    today_loss_amount: float
    today_report_count: int
    pending_review_count: int
    pending_approval_count: int
    abnormal_count: int
    month_loss_rate: float
    month_loss_amount: float
    loss_trend: List[LossTrendItem]
    store_ranking: List[StoreLossRank]


class StatusTransition(BaseModel):
    from_status: LossStatus
    to_status: LossStatus
    reason: Optional[str] = None
