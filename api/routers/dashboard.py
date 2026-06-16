from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, get_db_session
from api.models import Exception, MemberProfile, Prescription, Store, User
from api.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    total_rx = (await db.execute(select(func.count()).select_from(Prescription))).scalar() or 0
    pending = (await db.execute(
        select(func.count()).select_from(Prescription).where(Prescription.status == "pending")
    )).scalar() or 0
    in_review = (await db.execute(
        select(func.count()).select_from(Prescription).where(Prescription.status == "in_review")
    )).scalar() or 0
    approved = (await db.execute(
        select(func.count()).select_from(Prescription).where(Prescription.status == "approved")
    )).scalar() or 0
    rejected = (await db.execute(
        select(func.count()).select_from(Prescription).where(Prescription.status == "rejected")
    )).scalar() or 0
    exception_count = (await db.execute(
        select(func.count()).select_from(Prescription).where(Prescription.status == "exception")
    )).scalar() or 0
    open_exceptions = (await db.execute(
        select(func.count()).select_from(Exception).where(Exception.status.in_(["open", "in_progress"]))
    )).scalar() or 0
    total_stores = (await db.execute(select(func.count()).select_from(Store))).scalar() or 0
    total_members = (await db.execute(select(func.count()).select_from(MemberProfile))).scalar() or 0

    return DashboardStats(
        total_prescriptions=total_rx,
        pending_count=pending,
        in_review_count=in_review,
        approved_count=approved,
        rejected_count=rejected,
        exception_count=exception_count,
        open_exceptions=open_exceptions,
        total_stores=total_stores,
        total_members=total_members,
    )
