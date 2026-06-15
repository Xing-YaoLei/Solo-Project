from pydantic import BaseModel, Field
from datetime import datetime


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UserInfo(BaseModel):
    id: int
    username: str
    role: str
    name: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    accessToken: str
    user: UserInfo


class TokenData(BaseModel):
    user_id: int | None = None
