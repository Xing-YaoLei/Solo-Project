from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class InteractionBase(BaseModel):
    interaction_type: str
    content: str
    participants: List[str] = []
    attachments: List[dict] = []


class InteractionCreate(InteractionBase):
    document_id: int


class Interaction(InteractionBase):
    id: int
    document_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RiskHitBase(BaseModel):
    keyword: str
    context: Optional[str] = None
    position_start: Optional[int] = None
    position_end: Optional[int] = None
    severity: str = "medium"
    suggestion: Optional[str] = None


class RiskHit(RiskHitBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuditRecordBase(BaseModel):
    action: str
    comments: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    material_tags_suggestion: List[str] = []


class AuditRecordCreate(AuditRecordBase):
    document_id: int


class AuditRecord(AuditRecordBase):
    id: int
    document_id: int
    auditor_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuditAction(BaseModel):
    action: str
    comments: Optional[str] = None
    material_tags_suggestion: List[str] = []
