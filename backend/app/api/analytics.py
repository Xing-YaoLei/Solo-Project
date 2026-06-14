from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from ..services.analytics_service import (
    get_renewal_funnel,
    get_renewal_rate_trend,
    get_refund_reason_distribution,
    get_coach_renewal_ranking,
    get_expiring_members_list,
    get_verification_records,
)
from ..services import repository as repo
from ..schemas.analytics import (
    FunnelStage,
    RenewalRateTrend,
    RefundReasonItem,
    CoachRankingItem,
    ExpiringMembersResponse,
    VerificationRecordsResponse,
)

router = APIRouter(prefix="/api/analytics", tags=["数据分析"])


@router.get("/funnel", response_model=List[FunnelStage])
def renewal_funnel(
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
    coach_id: int = Query(None, description="教练ID"),
):
    return get_renewal_funnel(start_date, end_date, coach_id)


@router.get("/renewal-rate-trend", response_model=List[RenewalRateTrend])
def renewal_rate_trend(days: int = Query(30, description="统计天数")):
    return get_renewal_rate_trend(days)


@router.get("/refund-reasons", response_model=List[RefundReasonItem])
def refund_reasons(
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
):
    return get_refund_reason_distribution(start_date, end_date)


@router.get("/coach-ranking", response_model=List[CoachRankingItem])
def coach_ranking(
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
):
    return get_coach_renewal_ranking(start_date, end_date)


@router.get("/expiring-members", response_model=ExpiringMembersResponse)
def expiring_members(
    days: int = Query(30, description="未来N天内到期"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return get_expiring_members_list(days, page, page_size)


@router.get("/verification-records", response_model=VerificationRecordsResponse)
def verification_records(
    member_id: int = Query(None, description="会员ID"),
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return get_verification_records(member_id, start_date, end_date, page, page_size)


@router.get("/funnel-stage-members")
def funnel_stage_members(
    stage: str = Query(..., description="漏斗阶段: total_members/active_members/expiring_members/contacted_members/renewed_members"),
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
    days: int = Query(30, description="到期预警天数"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    return repo.get_funnel_stage_members(stage, start_date, end_date, days, page, page_size)


@router.get("/refund-reason-members")
def refund_reason_members(
    reason: str = Query(..., description="退款原因: injury/move_away/dissatisfied/coach_change/price_reason/time_conflict/health_reason/other"),
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    return repo.get_refund_reason_members(reason, start_date, end_date, page, page_size)
