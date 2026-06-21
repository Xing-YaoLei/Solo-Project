from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole


class ShareLinkCreate(BaseModel):
    resource_type: str = Field(max_length=50)
    resource_id: UUID | None = None
    allowed_roles: list[UserRole] = Field(default_factory=lambda: [UserRole.PARTNER, UserRole.LAWYER])
    expires_in_hours: int = Field(default=24, ge=1, le=720)
    allow_export: bool = False
    hide_sensitive: bool = True


class ShareLinkUpdate(BaseModel):
    allowed_roles: list[UserRole] | None = None
    expires_in_hours: int | None = Field(default=None, ge=1, le=720)
    allow_export: bool | None = None
    hide_sensitive: bool | None = None
    is_active: bool | None = None


class ShareLinkResponse(BaseModel):
    id: UUID
    token: str
    resource_type: str
    resource_id: UUID | None
    allowed_roles: list[UserRole]
    expires_at: datetime
    allow_export: bool
    hide_sensitive: bool
    access_count: int
    is_active: bool
    created_at: datetime
    share_url: str

    model_config = ConfigDict(from_attributes=True)


class ShareLinkListItem(BaseModel):
    id: UUID
    token: str
    resource_type: str
    resource_id: UUID | None
    expires_at: datetime
    access_count: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShareAccessRequest(BaseModel):
    token: str


class ShareAccessResponse(BaseModel):
    valid: bool
    resource_type: str | None = None
    resource_id: UUID | None = None
    allow_export: bool = False
    hide_sensitive: bool = True
    expires_at: datetime | None = None
    data: Any | None = None
    message: str | None = None
