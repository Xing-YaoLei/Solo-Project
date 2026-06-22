from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    AuditChecklist,
    SamplingRecord,
    RectificationPlan,
    ExceptionOrder,
    Vendor,
    User,
    RiskLevel,
    RectificationStatus,
    ExceptionStatus,
)
from app.schemas import DashboardStatsResponse
from app.services import ExportService
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["仪表盘"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_checklists = db.query(AuditChecklist).count()
    total_samplings = db.query(SamplingRecord).count()
    total_rectifications = db.query(RectificationPlan).count()
    total_exceptions = db.query(ExceptionOrder).count()
    total_vendors = db.query(Vendor).count()

    pending_exceptions = db.query(ExceptionOrder).filter(
        ExceptionOrder.status == ExceptionStatus.OPEN
    ).count()

    coverage = ExportService.calculate_sampling_coverage(db)
    sampling_coverage_rate = coverage.coverage_rate

    closed_rectifications = db.query(RectificationPlan).filter(
        RectificationPlan.status == RectificationStatus.CLOSED
    ).count()

    rectification_completion_rate = round(
        (closed_rectifications / total_rectifications * 100) if total_rectifications > 0 else 0.0,
        2
    )

    risk_rows = db.query(
        RectificationPlan.risk_level,
        func.count(RectificationPlan.id)
    ).group_by(RectificationPlan.risk_level).all()

    risk_distribution = {}
    for level, count in risk_rows:
        if level:
            risk_distribution[level.value] = count

    for rl in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]:
        if rl.value not in risk_distribution:
            risk_distribution[rl.value] = 0

    return DashboardStatsResponse(
        total_checklists=total_checklists,
        total_samplings=total_samplings,
        total_rectifications=total_rectifications,
        total_exceptions=total_exceptions,
        pending_exceptions=pending_exceptions,
        total_vendors=total_vendors,
        sampling_coverage_rate=sampling_coverage_rate,
        rectification_completion_rate=rectification_completion_rate,
        risk_distribution=risk_distribution,
        sampling_coverage_description=coverage.description
    )
