from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[str] = None
    role: str = "nurse"


class UserCreate(UserBase):
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


class TokenData(BaseModel):
    username: Optional[str] = None


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_full_name: Optional[str] = None
    entity_type: str
    entity_id: int
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    field_name: Optional[str]
    created_at: datetime
    remark: Optional[str]

    class Config:
        from_attributes = True
