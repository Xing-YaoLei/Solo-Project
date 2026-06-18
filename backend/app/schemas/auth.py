import enum
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


class UserRole(str, enum.Enum):
    consultant = "consultant"
    technician = "technician"
    parts_staff = "parts_staff"
    manager = "manager"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    display_name: str
    role: UserRole


class UserResponse(BaseModel):
    id: UUID
    username: str
    display_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
