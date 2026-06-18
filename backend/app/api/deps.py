from typing import Optional, Any, AsyncGenerator

from app.services.mock_service import MockService
from app.core.config import settings


_mock_service_instance: Optional[MockService] = None


def get_mock_data() -> MockService:
    global _mock_service_instance
    if _mock_service_instance is None:
        _mock_service_instance = MockService()
    return _mock_service_instance


async def get_db() -> AsyncGenerator[Any, None]:
    if settings.MOCK_MODE:
        yield None
        return
    try:
        from app.db.session import get_db as _real_get_db
        async for session in _real_get_db():
            yield session
    except Exception:
        yield None
