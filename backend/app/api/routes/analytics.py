from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.deps import get_current_active_worker, get_current_active_admin
from app.models.user import User
from app.analytics.metrics import analytics_metrics
from app.schemas.analytics import (
    UtilityReadingDistribution,
    InspectionFunnel,
    PaymentRanking,
    ComplaintTagTrend,
    RepairDurationStats,
)

router = APIRouter()


@router.post("/sync")
def sync_data(
    tables: Optional[List[str]] = None,
    current_user: User = Depends(get_current_active_admin),
):
    try:
        analytics_metrics.sync_data(tables)
        return {"message": "Data synced successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}",
        )


@router.get("/utility-readings", response_model=List[UtilityReadingDistribution])
def get_utility_readings(
    start_month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    end_month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    district: Optional[str] = None,
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_utility_reading_distribution(
            start_month=start_month,
            end_month=end_month,
            district=district,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get utility readings: {str(e)}",
        )


@router.get("/inspection-funnel", response_model=List[InspectionFunnel])
def get_inspection_funnel(
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_inspection_funnel()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get inspection funnel: {str(e)}",
        )


@router.get("/payment-ranking", response_model=List[PaymentRanking])
def get_payment_ranking(
    dimension: str = Query("property", enum=["property", "district", "month"]),
    period: Optional[str] = Query(None, description="Format: YYYY-MM"),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_payment_ranking(
            dimension=dimension,
            period=period,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get payment ranking: {str(e)}",
        )


@router.get("/complaint-tag-trend", response_model=List[ComplaintTagTrend])
def get_complaint_tag_trend(
    start_month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    end_month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_complaint_tag_trend(
            start_month=start_month,
            end_month=end_month,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get complaint tag trend: {str(e)}",
        )


@router.get("/repair-duration", response_model=List[RepairDurationStats])
def get_repair_duration(
    worker_id: Optional[int] = None,
    repair_type: Optional[str] = None,
    caliber_version: Optional[str] = None,
    start_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_repair_duration_stats(
            worker_id=worker_id,
            repair_type=repair_type,
            caliber_version=caliber_version,
            start_date=start_date,
            end_date=end_date,
            user_role=current_user.role,
            current_user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get repair duration: {str(e)}",
        )


@router.get("/repair-duration/caliber/{version}", response_model=List[RepairDurationStats])
def get_repair_duration_by_caliber(
    version: str,
    worker_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_worker),
):
    try:
        return analytics_metrics.get_repair_duration_by_caliber(
            caliber_version=version,
            worker_id=worker_id,
            user_role=current_user.role,
            current_user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get repair duration by caliber: {str(e)}",
        )
