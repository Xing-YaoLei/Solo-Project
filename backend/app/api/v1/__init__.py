from fastapi import APIRouter

from . import auth, guide, operations, misc


api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(guide.router)
api_router.include_router(operations.router)
api_router.include_router(misc.router, prefix="")
