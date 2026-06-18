import enum


class UserRole(str, enum.Enum):
    consultant = "consultant"
    technician = "technician"
    parts_staff = "parts_staff"
    manager = "manager"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    in_inspection = "in_inspection"
    completed = "completed"
    closed = "closed"
    rework = "rework"


class Priority(str, enum.Enum):
    normal = "normal"
    urgent = "urgent"
    critical = "critical"


class PartStatus(str, enum.Enum):
    pending = "pending"
    issued = "issued"
    returned = "returned"


class QuoteStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    approved = "approved"
    rejected = "rejected"


class ItemType(str, enum.Enum):
    labor = "labor"
    part = "part"
    other = "other"


class InspectionType(str, enum.Enum):
    pre_inspection = "pre_inspection"
    in_progress = "in_progress"
    final = "final"


class InspectionResult(str, enum.Enum):
    pass_ = "pass"
    fail = "fail"
    conditional = "conditional"


class ShortageStatus(str, enum.Enum):
    pending = "pending"
    procuring = "procuring"
    arrived = "arrived"
    substituted = "substituted"
    cancelled = "cancelled"
