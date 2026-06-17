from fastapi import APIRouter

from app.api import auth, users, apartments, time_slots, schedules, details, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户管理"])
api_router.include_router(apartments.router, prefix="/apartments", tags=["公寓管理"])
api_router.include_router(time_slots.router, prefix="/time-slots", tags=["时段管理"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["排班管理"])
api_router.include_router(details.router, prefix="/details", tags=["详情管理"])
api_router.include_router(reports.router, prefix="/reports", tags=["报表统计"])
