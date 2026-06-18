from fastapi import APIRouter

from app.api.v1 import auth, suppliers, inventory, rules, shortage, analytics

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(suppliers.router)
api_router.include_router(inventory.router)
api_router.include_router(rules.router)
api_router.include_router(shortage.router)
api_router.include_router(analytics.router)

__all__ = ["api_router"]
