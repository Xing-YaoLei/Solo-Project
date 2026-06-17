from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from app.db.session import get_db
from app import schemas, models
from app.services.duckdb_service import duckdb_service

router = APIRouter(prefix="/funnel", tags=["促销陈列漏斗"])


@router.get("/", response_model=List[schemas.FunnelData])
def get_funnel_report(
    promotion_id: Optional[int] = Query(None),
    store_id: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    duckdb_service.refresh_data(db)

    funnel_rows = duckdb_service.query_funnel_data(
        promotion_id=promotion_id,
        region=region,
        start_date=start_date,
        end_date=end_date,
    )

    results = []
    for row in funnel_rows:
        pid = row["promotion_id"]
        target_sales = row["target_sales"] or 0.0
        actual_sales = row["actual_sales"] or 0.0

        achievement_rate = (actual_sales / target_sales * 100) if target_sales > 0 else 0.0
        promo_days = max((row["end_date"] - row["start_date"]).days + 1, 1)
        target_daily = target_sales / promo_days
        total_checks = row["total_display_checks"] or 0
        qualified_checks = row["qualified_display_count"] or 0
        display_rate = (qualified_checks / total_checks * 100) if total_checks > 0 else 0.0
        total_issues = row["total_issues"] or 0
        rectified = row["rectified_count"] or 0
        rectify_rate = (rectified / total_issues * 100) if total_issues > 0 else 100.0

        stages = [
            schemas.FunnelStageItem(
                stage="活动创建",
                stage_code="created",
                value=100.0,
                rate=100.0,
                count=1,
            ),
            schemas.FunnelStageItem(
                stage="陈列巡检完成",
                stage_code="display_checked",
                value=display_rate if total_checks > 0 else 100.0,
                rate=display_rate if total_checks > 0 else 100.0,
                count=total_checks,
            ),
            schemas.FunnelStageItem(
                stage="陈列合格率",
                stage_code="display_qualified",
                value=display_rate,
                rate=display_rate,
                count=qualified_checks,
            ),
            schemas.FunnelStageItem(
                stage="问题整改完成",
                stage_code="rectified",
                value=rectify_rate,
                rate=rectify_rate,
                count=rectified,
            ),
            schemas.FunnelStageItem(
                stage="销售达成率",
                stage_code="achievement",
                value=achievement_rate,
                rate=achievement_rate,
                count=int(actual_sales),
            ),
        ]

        results.append(
            schemas.FunnelData(
                promotion_id=pid,
                promo_code=row["promo_code"],
                promo_name=row["promo_name"],
                store_name=row["store_name"],
                stages=stages,
                target_achievement_rate=round(achievement_rate, 2),
                actual_sales=round(actual_sales, 2),
                target_sales=round(target_sales, 2),
            )
        )

    return results


@router.get("/sales-trend", response_model=schemas.SalesTrendData)
def get_sales_trend(
    promotion_id: int = Query(..., description="促销活动ID"),
    store_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    duckdb_service.refresh_data(db)

    promotion = db.query(models.Promotion).filter(models.Promotion.id == promotion_id).first()
    if not promotion:
        return schemas.SalesTrendData(
            promotion_id=promotion_id,
            daily_data=[],
            total_sales=0,
            total_target=0,
            overall_achievement_rate=0,
        )

    trend_rows = duckdb_service.query_sales_trend(
        promotion_id=promotion_id,
        store_id=store_id,
        start_date=start_date,
        end_date=end_date,
    )

    unqualified_inspections = (
        db.query(models.DisplayInspection)
        .filter(
            models.DisplayInspection.promotion_id == promotion_id,
            models.DisplayInspection.is_qualified == False,
        )
        .all()
    )
    unqualified_dates = {ins.inspection_date for ins in unqualified_inspections}

    exception_annotations = (
        db.query(models.ExceptionAnnotation)
        .filter(models.ExceptionAnnotation.promotion_id == promotion_id)
        .all()
    )
    exception_map = {}
    for ann in exception_annotations:
        if ann.annotation_date not in exception_map:
            exception_map[ann.annotation_date] = []
        exception_map[ann.annotation_date].append(ann.exception_type)

    promo_days = max((promotion.end_date - promotion.start_date).days + 1, 1)
    target_daily = (promotion.target_sales or 0) / promo_days
    total_sales = 0.0
    total_target = promotion.target_sales or 0.0

    daily_points = []
    for row in trend_rows:
        s_date = row["sale_date"]
        amount = row["sales_amount"] or 0.0
        units = row["sales_units"] or 0
        total_sales += amount

        exception_types = exception_map.get(s_date, [])
        if row["cashier_delay_count"] and row["cashier_delay_count"] > 0:
            exception_types.append("cashier_delay")
        if row["member_missing_total"] and row["member_missing_total"] > 0:
            exception_types.append("member_missing")
        if row["mi_caliber_change_count"] and row["mi_caliber_change_count"] > 0:
            exception_types.append("mi_caliber_change")

        daily_points.append(
            schemas.SalesTrendPoint(
                date=s_date,
                sales_amount=round(amount, 2),
                sales_units=units,
                target_daily=round(target_daily, 2),
                achievement_rate=round((amount / target_daily * 100) if target_daily > 0 else 0, 2),
                has_exception=len(exception_types) > 0,
                exception_types=list(set(exception_types)),
                is_display_unqualified=s_date in unqualified_dates,
            )
        )

    overall_rate = (total_sales / total_target * 100) if total_target > 0 else 0.0

    return schemas.SalesTrendData(
        promotion_id=promotion_id,
        daily_data=daily_points,
        total_sales=round(total_sales, 2),
        total_target=round(total_target, 2),
        overall_achievement_rate=round(overall_rate, 2),
    )


@router.get("/display-impact-ranges", response_model=List[schemas.DisplayImpactRange])
def get_display_impact_ranges(
    promotion_id: int = Query(..., description="促销活动ID"),
    db: Session = Depends(get_db),
):
    duckdb_service.refresh_data(db)

    impact_rows = duckdb_service.detect_display_impact_ranges(promotion_id)
    unqualified_inspections = (
        db.query(models.DisplayInspection)
        .filter(
            models.DisplayInspection.promotion_id == promotion_id,
            models.DisplayInspection.is_qualified == False,
        )
        .all()
    )

    results = []
    for row in impact_rows:
        start = row["start_date"]
        end = row["end_date"]
        related_ids = [
            ins.id
            for ins in unqualified_inspections
            if start <= ins.inspection_date <= end
        ]

        results.append(
            schemas.DisplayImpactRange(
                start_date=start,
                end_date=end,
                impact_days=int(row["impact_days"] or 0),
                estimated_loss_sales=float(row["estimated_loss_sales"] or 0.0),
                avg_score_during_period=int(row["avg_score_during_period"] or 0),
                related_inspection_ids=related_ids,
            )
        )

    return results


@router.get("/exceptions/scan")
def scan_exceptions(
    promotion_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.SalesRecord)
    if promotion_id:
        query = query.filter(models.SalesRecord.promotion_id == promotion_id)
    sales_records = query.all()

    cashier_delay_threshold = (
        db.query(models.ThresholdConfig)
        .filter(models.ThresholdConfig.config_key == "cashier_delay_minutes")
        .first()
    )
    delay_threshold = cashier_delay_threshold.config_value if cashier_delay_threshold else 30

    member_missing_threshold = (
        db.query(models.ThresholdConfig)
        .filter(models.ThresholdConfig.config_key == "member_missing_count")
        .first()
    )
    missing_threshold = member_missing_threshold.config_value if member_missing_threshold else 5

    exceptions = {
        "cashier_delay": [],
        "member_missing": [],
        "mi_caliber_change": [],
    }

    for sr in sales_records:
        if sr.cashier_delay_minutes >= delay_threshold:
            exceptions["cashier_delay"].append(
                {
                    "date": sr.sale_date.isoformat(),
                    "promotion_id": sr.promotion_id,
                    "delay_minutes": sr.cashier_delay_minutes,
                    "threshold": delay_threshold,
                }
            )
        if sr.member_record_missing_count >= missing_threshold:
            exceptions["member_missing"].append(
                {
                    "date": sr.sale_date.isoformat(),
                    "promotion_id": sr.promotion_id,
                    "missing_count": sr.member_record_missing_count,
                    "threshold": missing_threshold,
                }
            )
        if sr.medical_insurance_caliber_changed:
            exceptions["mi_caliber_change"].append(
                {
                    "date": sr.sale_date.isoformat(),
                    "promotion_id": sr.promotion_id,
                    "data_version": sr.data_version,
                }
            )

    return {
        "total_exceptions": sum(len(v) for v in exceptions.values()),
        "summary": {k: len(v) for k, v in exceptions.items()},
        "details": exceptions,
    }
