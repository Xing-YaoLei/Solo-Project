from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.models.user import UserRole
from app.schemas.auth import CurrentUser


def require_roles(*roles: UserRole) -> Callable[..., Any]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user: CurrentUser | None = kwargs.get("current_user")
            if not current_user:
                for arg in args:
                    if isinstance(arg, CurrentUser):
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                )

            if current_user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


class PermissionMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Any],
    ) -> Any:
        path_role_map: dict[str, list[UserRole]] = {
            "/api/reports": [UserRole.PARTNER, UserRole.LAWYER, UserRole.ASSISTANT],
            "/api/export": [UserRole.PARTNER, UserRole.LAWYER],
            "/api/share": [UserRole.PARTNER, UserRole.LAWYER, UserRole.ASSISTANT],
            "/api/data-sync": [UserRole.PARTNER, UserRole.ASSISTANT],
        }

        user: CurrentUser | None = getattr(request.state, "user", None)

        for path, allowed_roles in path_role_map.items():
            if request.url.path.startswith(path):
                if not user:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Not authenticated"},
                    )
                if user.role not in allowed_roles:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "Insufficient permissions"},
                    )
                break

        return await call_next(request)
