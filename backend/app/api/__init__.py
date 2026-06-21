from fastapi import APIRouter
from app.api import auth, documents, audit, stats

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(audit.router)
api_router.include_router(stats.router)
