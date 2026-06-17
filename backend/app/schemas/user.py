from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[int] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "worker"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
