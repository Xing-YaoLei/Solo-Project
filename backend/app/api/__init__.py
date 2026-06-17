from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .work_orders import router as work_orders_router
from .admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(work_orders_router)
api_router.include_router(admin_router)
