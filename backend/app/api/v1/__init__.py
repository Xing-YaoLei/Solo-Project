from fastapi import APIRouter
from app.api.v1.endpoints import router as settlement_router

api_router = APIRouter()
api_router.include_router(settlement_router, prefix="/settlement", tags=["结算相关"])
