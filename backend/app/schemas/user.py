from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    WORKER = "worker"


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., max_length=100, description="邮箱")
    full_name: Optional[str] = Field(default=None, max_length=100, description="全名")
    role: UserRole = Field(default=UserRole.WORKER, description="角色")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(default=None, max_length=100, description="邮箱")
    full_name: Optional[str] = Field(default=None, max_length=100, description="全名")
    role: Optional[UserRole] = Field(default=None, description="角色")
    is_active: Optional[bool] = Field(default=None, description="是否激活")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="用户ID")
    username: str = Field(description="用户名")
    email: str = Field(description="邮箱")
    full_name: Optional[str] = Field(description="全名")
    role: UserRole = Field(description="角色")
    is_active: bool = Field(description="是否激活")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str = Field(description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    user: UserResponse = Field(description="用户信息")
