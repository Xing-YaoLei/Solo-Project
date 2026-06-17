from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.rules import router as rules_router
from app.api.v1.shortage import router as shortage_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth_router)
api_router.include_router(suppliers_router)
api_router.include_router(inventory_router)
api_router.include_router(rules_router)
api_router.include_router(shortage_router)
api_router.include_router(analytics_router)

__all__ = ["api_router"]
