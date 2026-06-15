from enum import Enum


class TicketStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    REVIEWING = "reviewing"
    SUPPLEMENT_NEEDED = "supplement_needed"
    ESCALATED_REVIEW = "escalated_review"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CLOSED = "closed"


class TicketSource(str, Enum):
    WECHAT_GROUP = "wechat_group"
    QQ_GROUP = "qq_group"
    OFFLINE_ACTIVITY = "offline_activity"
    REFERRAL = "referral"
    ADVERTISEMENT = "advertisement"
    OTHER = "other"


class ReviewTag(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    NORMAL = "normal"
    NEEDS_IMPROVEMENT = "needs_improvement"
    PROBLEMATIC = "problematic"


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    COMMISSION = "commission"
    DEDUCTION = "deduction"
    BONUS = "bonus"


class PlagiarismStatus(str, Enum):
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"
    APPEALED = "appealed"
    RESOLVED = "resolved"


class PlagiarismSeverity(str, Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class MemberLevel(str, Enum):
    BASIC = "basic"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"
