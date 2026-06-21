from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class DocumentVersionBase(BaseModel):
    version_number: int
    title: str
    content: str
    change_summary: Optional[str] = None


class DocumentVersionCreate(DocumentVersionBase):
    document_id: int
    created_by: Optional[int] = None


class DocumentVersion(DocumentVersionBase):
    id: int
    document_id: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    title: str
    document_type: str = "other"
    content: str
    summary: Optional[str] = None
    client_name: Optional[str] = None
    case_no: Optional[str] = None
    assignee_id: Optional[int] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    document_type: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    client_name: Optional[str] = None
    case_no: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[str] = None
    material_tags: Optional[List[str]] = None
    review_comments: Optional[str] = None


class Document(DocumentBase):
    id: int
    document_no: Optional[str] = None
    status: str
    creator_id: Optional[int] = None
    current_version: int
    is_version_verified: bool
    risk_level: Optional[str] = None
    material_tags: List[str] = []
    rejection_count: int = 0
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentDetail(Document):
    versions: List[DocumentVersion] = []
