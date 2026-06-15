from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

from ..enums import (
    TicketStatus, TicketSource, ReviewTag,
    TransactionType, PlagiarismStatus, PlagiarismSeverity, MemberLevel
)


class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[str] = None
    role: str = "operator"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MemberProfileBase(BaseModel):
    member_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    level: MemberLevel = MemberLevel.BASIC
    source_channel: TicketSource = TicketSource.OTHER
    join_date: Optional[date] = None
    exam_score: Optional[float] = None
    exam_pass_status: Optional[bool] = None
    exam_date: Optional[date] = None
    total_learning_hours: float = 0.0
    community_group: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    remark: Optional[str] = None


class MemberProfileCreate(MemberProfileBase):
    pass


class MemberProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    level: Optional[MemberLevel] = None
    source_channel: Optional[TicketSource] = None
    exam_score: Optional[float] = None
    exam_pass_status: Optional[bool] = None
    exam_date: Optional[date] = None
    total_learning_hours: Optional[float] = None
    community_group: Optional[str] = None
    tags: Optional[List[str]] = None
    remark: Optional[str] = None


class MemberProfileResponse(MemberProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberProfileListResponse(BaseModel):
    total: int
    items: List[MemberProfileResponse]


class BenefitRuleBase(BaseModel):
    rule_code: str
    rule_name: str
    description: Optional[str] = None
    benefit_type: Optional[str] = None
    applicable_levels: List[str] = Field(default_factory=list)
    discount_rate: float = 0
    bonus_points: int = 0
    cash_value: float = 0.0
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: bool = True
    conditions: Dict[str, Any] = Field(default_factory=dict)


class BenefitRuleCreate(BenefitRuleBase):
    pass


class BenefitRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    description: Optional[str] = None
    benefit_type: Optional[str] = None
    applicable_levels: Optional[List[str]] = None
    discount_rate: Optional[float] = None
    bonus_points: Optional[int] = None
    cash_value: Optional[float] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: Optional[bool] = None
    conditions: Optional[Dict[str, Any]] = None


class BenefitRuleResponse(BenefitRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BenefitRuleListResponse(BaseModel):
    total: int
    items: List[BenefitRuleResponse]


class MemberBenefitMappingBase(BaseModel):
    member_id: int
    benefit_id: int
    granted_date: Optional[date] = None
    used_count: int = 0
    max_usage: int = 1
    is_active: bool = True
    remark: Optional[str] = None


class MemberBenefitMappingCreate(MemberBenefitMappingBase):
    pass


class MemberBenefitMappingResponse(MemberBenefitMappingBase):
    id: int
    benefit: Optional[BenefitRuleResponse] = None

    class Config:
        from_attributes = True


class AccountTransactionBase(BaseModel):
    transaction_no: str
    member_id: int
    ticket_id: Optional[int] = None
    type: TransactionType
    amount: float
    balance_after: Optional[float] = None
    payment_method: Optional[str] = None
    related_order_no: Optional[str] = None
    description: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    transaction_date: datetime = Field(default_factory=datetime.utcnow)


class AccountTransactionCreate(AccountTransactionBase):
    pass


class AccountTransactionResponse(AccountTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AccountTransactionListResponse(BaseModel):
    total: int
    items: List[AccountTransactionResponse]


class AuditLogBase(BaseModel):
    ticket_id: int
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    reference_ids: List[int] = Field(default_factory=list)


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    operator_id: int
    operator: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewRecordBase(BaseModel):
    ticket_id: int
    round: int = 1
    is_escalated: bool = False
    review_tag: Optional[ReviewTag] = None
    score: Optional[int] = None
    summary: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    cited_transaction_ids: List[int] = Field(default_factory=list)
    cited_benefit_ids: List[int] = Field(default_factory=list)
    follow_up_actions: List[str] = Field(default_factory=list)


class ReviewRecordCreate(ReviewRecordBase):
    pass


class ReviewRecordResponse(ReviewRecordBase):
    id: int
    reviewer_id: int
    reviewer: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketBenefitReferenceBase(BaseModel):
    ticket_id: int
    benefit_id: int
    applied_value: float = 0.0
    remark: Optional[str] = None


class TicketBenefitReferenceCreate(TicketBenefitReferenceBase):
    pass


class TicketBenefitReferenceResponse(TicketBenefitReferenceBase):
    id: int
    applied_date: datetime
    benefit: Optional[BenefitRuleResponse] = None

    class Config:
        from_attributes = True


class CommunityTicketBase(BaseModel):
    ticket_no: str
    title: str
    member_id: int
    source: TicketSource = TicketSource.OTHER
    category: Optional[str] = None
    priority: int = 3
    description: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    responsible_id: Optional[int] = None


class CommunityTicketCreate(CommunityTicketBase):
    benefit_ids: List[int] = Field(default_factory=list)


class CommunityTicketUpdate(BaseModel):
    title: Optional[str] = None
    source: Optional[TicketSource] = None
    category: Optional[str] = None
    priority: Optional[int] = None
    description: Optional[str] = None
    evidence_urls: Optional[List[str]] = None
    responsible_id: Optional[int] = None


class CommunityTicketResponse(CommunityTicketBase):
    id: int
    status: TicketStatus
    creator_id: Optional[int] = None
    creator: Optional[UserResponse] = None
    responsible: Optional[UserResponse] = None
    member: Optional[MemberProfileResponse] = None
    supplement_requirements: Optional[str] = None
    closed_at: Optional[datetime] = None
    close_remark: Optional[str] = None
    review_tag: Optional[ReviewTag] = None
    review_score: Optional[int] = None
    review_remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    audit_logs: List[AuditLogResponse] = Field(default_factory=list)
    review_records: List[ReviewRecordResponse] = Field(default_factory=list)
    transactions: List[AccountTransactionResponse] = Field(default_factory=list)
    benefit_references: List[TicketBenefitReferenceResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CommunityTicketListResponse(BaseModel):
    total: int
    items: List[CommunityTicketResponse]


class TicketStatusUpdate(BaseModel):
    new_status: TicketStatus
    comment: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    supplement_requirements: Optional[str] = None
    close_remark: Optional[str] = None


class TicketReviewCreate(BaseModel):
    review_tag: ReviewTag
    score: Optional[int] = None
    summary: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    cited_transaction_ids: List[int] = Field(default_factory=list)
    cited_benefit_ids: List[int] = Field(default_factory=list)
    follow_up_actions: List[str] = Field(default_factory=list)
    is_escalated: bool = False


class PlagiarismCaseBase(BaseModel):
    case_no: str
    member_id: int
    ticket_id: Optional[int] = None
    assignment_name: str
    course_name: Optional[str] = None
    similarity_score: Optional[float] = None
    original_author: Optional[str] = None
    description: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    severity: PlagiarismSeverity = PlagiarismSeverity.MODERATE


class PlagiarismCaseCreate(BaseModel):
    member_id: int
    ticket_id: Optional[int] = None
    assignment_name: str
    course_name: Optional[str] = None
    similarity_score: Optional[float] = None
    original_author: Optional[str] = None
    description: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
    severity: PlagiarismSeverity = PlagiarismSeverity.MODERATE


class PlagiarismCaseUpdate(BaseModel):
    status: Optional[PlagiarismStatus] = None
    severity: Optional[PlagiarismSeverity] = None
    similarity_score: Optional[float] = None
    investigation_notes: Optional[str] = None
    resolution: Optional[str] = None
    punishment: Optional[str] = None
    appeal_deadline: Optional[date] = None


class PlagiarismStatusUpdate(BaseModel):
    status: PlagiarismStatus
    comment: Optional[str] = None
    handler_id: Optional[int] = None


class PlagiarismStatistics(BaseModel):
    by_status: Dict[str, int] = Field(default_factory=dict)
    by_severity: Dict[str, int] = Field(default_factory=dict)


class PlagiarismCaseResponse(PlagiarismCaseBase):
    id: int
    status: PlagiarismStatus
    reporter_id: Optional[int] = None
    handler_id: Optional[int] = None
    investigation_notes: Optional[str] = None
    resolution: Optional[str] = None
    punishment: Optional[str] = None
    appeal_deadline: Optional[date] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    member: Optional[MemberProfileResponse] = None

    class Config:
        from_attributes = True


class PlagiarismCaseListResponse(BaseModel):
    total: int
    items: List[PlagiarismCaseResponse]


class SummaryStats(BaseModel):
    total_tickets: int
    draft_count: int
    pending_review_count: int
    supplement_needed_count: int
    escalated_review_count: int
    processing_count: int
    completed_count: int
    closed_count: int
    total_members: int
    exam_pass_rate: float
    plagiarism_cases_count: int
    open_plagiarism_count: int


class SourceChannelStats(BaseModel):
    source: TicketSource
    count: int
    percentage: float
    exam_pass_rate: Optional[float] = None


class ResponsibleStats(BaseModel):
    responsible_id: int
    responsible_name: str
    total: int
    completed: int
    completion_rate: float


class ReviewTagStats(BaseModel):
    tag: ReviewTag
    count: int
    percentage: float


class ExamStats(BaseModel):
    total_examined: int
    passed_count: int
    failed_count: int
    pass_rate: float
    average_score: Optional[float] = None
    by_level: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class FullSummaryResponse(BaseModel):
    overview: SummaryStats
    by_source: List[SourceChannelStats]
    by_responsible: List[ResponsibleStats]
    by_review_tag: List[ReviewTagStats]
    exam_stats: ExamStats
