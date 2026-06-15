from fastapi import APIRouter
from .funnel import router as funnel_router
from .alerts import router as alerts_router
from .reviews import router as reviews_router
from .grades import router as grades_router
from .reminders import router as reminders_router
from .data_sync import router as data_sync_router

api_router = APIRouter()

api_router.include_router(funnel_router)
api_router.include_router(alerts_router)
api_router.include_router(reviews_router)
api_router.include_router(grades_router)
api_router.include_router(reminders_router)
api_router.include_router(data_sync_router)
