from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.import_data import router as import_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.inspection import router as inspection_router
from app.api.routes.repair import router as repair_router
from app.api.routes.comments import router as comments_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(import_router, prefix="/import", tags=["import"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(inspection_router, prefix="/inspections", tags=["inspections"])
api_router.include_router(repair_router, prefix="/repairs", tags=["repairs"])
api_router.include_router(comments_router, prefix="/comments", tags=["comments"])
