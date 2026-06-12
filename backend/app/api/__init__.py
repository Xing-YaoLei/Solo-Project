from fastapi import APIRouter

from app.api.reports import router as reports_router
from app.api.thresholds import router as thresholds_router
from app.api.remarks import router as remarks_router
from app.api.etl import router as etl_router

api_router = APIRouter()
api_router.include_router(reports_router)
api_router.include_router(thresholds_router)
api_router.include_router(remarks_router)
api_router.include_router(etl_router)

__all__ = ["api_router"]
