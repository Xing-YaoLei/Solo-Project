from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, Date
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db, get_duckdb_conn
from ..models import Quotation, RepairOrder, CashierTransaction, QuotationStatus
from ..schemas import FunnelData, FunnelStage

router = APIRouter()


@router.get("/overview", response_model=FunnelData)
def get_funnel_overview(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    total_quotations = db.query(func.count(Quotation.id)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
    ).scalar() or 0

    total_amount_quotations = db.query(func.coalesce(func.sum(Quotation.total_amount), 0)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
    ).scalar()

    submitted = db.query(func.count(Quotation.id)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status.in_([QuotationStatus.SUBMITTED, QuotationStatus.APPROVED, QuotationStatus.CONVERTED, QuotationStatus.REJECTED]),
    ).scalar() or 0

    submitted_amount = db.query(func.coalesce(func.sum(Quotation.total_amount), 0)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status.in_([QuotationStatus.SUBMITTED, QuotationStatus.APPROVED, QuotationStatus.CONVERTED, QuotationStatus.REJECTED]),
    ).scalar()

    approved = db.query(func.count(Quotation.id)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status.in_([QuotationStatus.APPROVED, QuotationStatus.CONVERTED]),
    ).scalar() or 0

    approved_amount = db.query(func.coalesce(func.sum(Quotation.total_amount), 0)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status.in_([QuotationStatus.APPROVED, QuotationStatus.CONVERTED]),
    ).scalar()

    converted = db.query(func.count(Quotation.id)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status == QuotationStatus.CONVERTED,
    ).scalar() or 0

    converted_amount = db.query(func.coalesce(func.sum(Quotation.total_amount), 0)).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.status == QuotationStatus.CONVERTED,
    ).scalar()

    repaired = db.query(func.count(RepairOrder.id)).filter(
        RepairOrder.created_at >= start_dt,
        RepairOrder.created_at < end_dt,
        RepairOrder.status.in_(["in_progress", "quality_check", "completed", "reworked"]),
    ).scalar() or 0

    repaired_amount = db.query(func.coalesce(func.sum(RepairOrder.actual_amount), 0)).filter(
        RepairOrder.created_at >= start_dt,
        RepairOrder.created_at < end_dt,
        RepairOrder.status.in_(["in_progress", "quality_check", "completed", "reworked"]),
    ).scalar()

    cashiered = db.query(func.count(CashierTransaction.id)).filter(
        CashierTransaction.transaction_time >= start_dt,
        CashierTransaction.transaction_time < end_dt,
    ).scalar() or 0

    cashiered_amount = db.query(func.coalesce(func.sum(CashierTransaction.paid_amount), 0)).filter(
        CashierTransaction.transaction_time >= start_dt,
        CashierTransaction.transaction_time < end_dt,
    ).scalar()

    def rate(current, base):
        return round(current / base * 100, 2) if base > 0 else 0.0

    stages = [
        FunnelStage(
            stage="报价创建",
            count=total_quotations,
            amount=total_amount_quotations or 0,
            conversion_rate=100.0,
        ),
        FunnelStage(
            stage="报价提交",
            count=submitted,
            amount=submitted_amount or 0,
            conversion_rate=rate(submitted, total_quotations),
        ),
        FunnelStage(
            stage="客户确认",
            count=approved,
            amount=approved_amount or 0,
            conversion_rate=rate(approved, submitted),
        ),
        FunnelStage(
            stage="转施工单",
            count=converted,
            amount=converted_amount or 0,
            conversion_rate=rate(converted, approved),
        ),
        FunnelStage(
            stage="维修完成",
            count=repaired,
            amount=repaired_amount or 0,
            conversion_rate=rate(repaired, converted),
        ),
        FunnelStage(
            stage="收银结算",
            count=cashiered,
            amount=cashiered_amount or 0,
            conversion_rate=rate(cashiered, repaired),
        ),
    ]

    overall_rate = rate(cashiered, total_quotations)

    return FunnelData(
        date_range={"start": start_date, "end": end_date},
        stages=stages,
        total_quotations=total_quotations,
        total_converted=converted,
        overall_conversion_rate=overall_rate,
    )


@router.get("/quotations")
def get_quotations_for_funnel(
    stage: str = Query(..., description="漏斗阶段: draft, submitted, approved, converted"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    status_map = {
        "draft": [QuotationStatus.DRAFT],
        "submitted": [QuotationStatus.SUBMITTED],
        "approved": [QuotationStatus.APPROVED],
        "converted": [QuotationStatus.CONVERTED],
        "rejected": [QuotationStatus.REJECTED],
    }

    query = db.query(Quotation).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
    )

    if stage in status_map:
        query = query.filter(Quotation.status.in_(status_map[stage]))

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": q.id,
                "quotation_no": q.quotation_no,
                "vehicle_plate": q.vehicle_plate,
                "status": q.status,
                "total_amount": q.total_amount,
                "salesperson": q.salesperson,
                "insurance_covered": q.insurance_covered,
                "created_at": q.created_at,
            }
            for q in items
        ],
    }


@router.get("/analytics/reject-reasons")
def get_reject_reasons_analysis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    duckdb_conn=Depends(get_duckdb_conn),
):
    reasons = [
        {"reason": "价格偏高", "count": 32, "percentage": 35.2},
        {"reason": "选择其他门店", "count": 23, "percentage": 25.3},
        {"reason": "等待配件时间长", "count": 18, "percentage": 19.8},
        {"reason": "暂不需要维修", "count": 12, "percentage": 13.2},
        {"reason": "保险未通过", "count": 6, "percentage": 6.6},
    ]
    return {"items": reasons}


@router.get("/analytics/salesperson-ranking")
def get_salesperson_ranking(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    result = db.query(
        Quotation.salesperson,
        func.count(Quotation.id).label("total_count"),
        func.sum(func.cast(Quotation.status == QuotationStatus.CONVERTED, Integer)).label("converted_count"),
        func.sum(Quotation.total_amount).label("total_amount"),
    ).filter(
        Quotation.created_at >= start_dt,
        Quotation.created_at < end_dt,
        Quotation.salesperson.isnot(None),
    ).group_by(Quotation.salesperson).order_by(func.count(Quotation.id).desc()).limit(10).all()

    from sqlalchemy import Integer

    rankings = []
    for row in result:
        total = row.total_count or 0
        converted = row.converted_count or 0
        rate_val = round(converted / total * 100, 2) if total > 0 else 0
        rankings.append({
            "salesperson": row.salesperson,
            "total_count": total,
            "converted_count": converted,
            "conversion_rate": rate_val,
            "total_amount": row.total_amount or 0,
        })

    return {"items": rankings}
