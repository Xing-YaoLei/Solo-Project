import time
from collections.abc import Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config.settings import settings


class RateLimiter:
    def __init__(self, requests_per_minute: int, requests_per_hour: int) -> None:
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self._minute_requests: dict[str, list[float]] = {}
        self._hour_requests: dict[str, list[float]] = {}

    def _cleanup(self, key: str, now: float) -> None:
        minute_ago = now - 60
        hour_ago = now - 3600

        self._minute_requests[key] = [
            t for t in self._minute_requests.get(key, []) if t > minute_ago
        ]
        self._hour_requests[key] = [
            t for t in self._hour_requests.get(key, []) if t > hour_ago
        ]

    def check_and_increment(self, key: str) -> tuple[bool, dict[str, int]]:
        now = time.time()
        self._cleanup(key, now)

        minute_count = len(self._minute_requests.get(key, []))
        hour_count = len(self._hour_requests.get(key, []))

        if minute_count >= self.requests_per_minute:
            return False, {
                "minute_limit": self.requests_per_minute,
                "minute_remaining": 0,
                "hour_limit": self.requests_per_hour,
                "hour_remaining": self.requests_per_hour - hour_count,
            }

        if hour_count >= self.requests_per_hour:
            return False, {
                "minute_limit": self.requests_per_minute,
                "minute_remaining": self.requests_per_minute - minute_count,
                "hour_limit": self.requests_per_hour,
                "hour_remaining": 0,
            }

        self._minute_requests.setdefault(key, []).append(now)
        self._hour_requests.setdefault(key, []).append(now)

        return True, {
            "minute_limit": self.requests_per_minute,
            "minute_remaining": self.requests_per_minute - minute_count - 1,
            "hour_limit": self.requests_per_hour,
            "hour_remaining": self.requests_per_hour - hour_count - 1,
        }


rate_limiter = RateLimiter(
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    requests_per_hour=settings.RATE_LIMIT_PER_HOUR,
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Any],
    ) -> Any:
        client_ip = request.client.host if request.client else "unknown"

        if request.url.path.startswith("/api/auth"):
            key = f"auth:{client_ip}"
        else:
            user = getattr(request.state, "user", None)
            key = f"user:{user.id}" if user else f"ip:{client_ip}"

        allowed, headers = rate_limiter.check_and_increment(key)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after": 60,
                },
                headers={
                    "X-RateLimit-Limit-Minute": str(headers["minute_limit"]),
                    "X-RateLimit-Remaining-Minute": str(headers["minute_remaining"]),
                    "X-RateLimit-Limit-Hour": str(headers["hour_limit"]),
                    "X-RateLimit-Remaining-Hour": str(headers["hour_remaining"]),
                },
            )

        response = await call_next(request)

        response.headers["X-RateLimit-Limit-Minute"] = str(headers["minute_limit"])
        response.headers["X-RateLimit-Remaining-Minute"] = str(headers["minute_remaining"])
        response.headers["X-RateLimit-Limit-Hour"] = str(headers["hour_limit"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(headers["hour_remaining"])

        return response
