from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel

from app.api.v1.schemas.common import ApiResponse
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/auth", tags=["认证"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=ApiResponse[dict])
async def login(
    req: LoginRequest = Body(...),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    import time
    roles = ["admin", "manager", "operator", "viewer"]
    role = roles[hash(req.username) % len(roles)]
    token = f"mock-jwt-{int(time.time())}-{hash(req.username) % 10000}"
    return ApiResponse.ok(
        data={
            "token": token,
            "accessToken": token,
            "access_token": token,
            "tokenType": "Bearer",
            "token_type": "Bearer",
            "expiresIn": 3600,
            "expires_in": 3600,
            "userInfo": {
                "id": f"user-{hash(req.username) % 1000}",
                "username": req.username,
                "name": req.username,
                "role": role,
                "email": f"{req.username}@example.com",
                "avatar": None,
                "permissions": ["*"],
                "stores": [s["id"] for s in mock.get_stores()],
            },
            "user": {
                "id": f"user-{hash(req.username) % 1000}",
                "username": req.username,
                "name": req.username,
                "role": role,
            },
        }
    )


@router.post("/logout", response_model=ApiResponse[bool])
async def logout() -> ApiResponse:
    return ApiResponse.ok(data=True, message="登出成功")


@router.post("/refresh", response_model=ApiResponse[dict])
async def refresh_token() -> ApiResponse:
    import time
    token = f"mock-jwt-refreshed-{int(time.time())}"
    return ApiResponse.ok(
        data={
            "token": token,
            "accessToken": token,
            "access_token": token,
        }
    )


@router.get("/me", response_model=ApiResponse[dict])
async def get_current_user(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    return ApiResponse.ok(
        data={
            "id": "user-001",
            "username": "admin",
            "name": "系统管理员",
            "role": "admin",
            "email": "admin@example.com",
            "avatar": None,
            "permissions": ["*"],
            "stores": [s["id"] for s in mock.get_stores()],
        }
    )
