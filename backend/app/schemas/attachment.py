from typing import Optional

from pydantic import BaseModel, Field

from ..models.attachment import AttachmentCategory
from .base import BaseSchema


class AttachmentBase(BaseModel):
    quote_id: Optional[str] = None
    exception_id: Optional[str] = None
    payment_id: Optional[str] = None
    category: AttachmentCategory = AttachmentCategory.OTHER
    description: Optional[str] = Field(None, max_length=500)


class AttachmentCreate(AttachmentBase):
    file_name: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None


class AttachmentUpdate(BaseModel):
    category: Optional[AttachmentCategory] = None
    description: Optional[str] = None


class AttachmentResponse(BaseSchema, AttachmentBase):
    file_name: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None
