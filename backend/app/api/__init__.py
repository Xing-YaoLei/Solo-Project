from fastapi import APIRouter

from app.api.routes import courses, progress, review, notifications, users, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(courses.router, prefix="/courses", tags=["课程管理"])
api_router.include_router(progress.router, prefix="/progress", tags=["进度记录"])
api_router.include_router(review.router, prefix="/review", tags=["月底复盘"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["进度通知"])
