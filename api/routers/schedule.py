from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db, get_duckdb_conn
from api.models import Schedule, RiskAnnotation, Bed, Elder, FallEvent, BillingCaliberChange
from api.schemas import ScheduleTrendItem, ScheduleTrendResponse, RiskAnnotationOut

router = APIRouter(prefix="/schedule", tags=["排班趋势"])


@router.get("/trend", summary="获取排班趋势数据")
async def get_schedule_trend(
    start_date: date = Query(default=date.today() - timedelta(days=7)),
    end_date: date = Query(default=date.today()),
    db: AsyncSession = Depends(get_db),
):
    total_beds_result = await db.execute(select(func.count(Bed.id)))
    total_beds = total_beds_result.scalar() or 1

    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)

    conn = get_duckdb_conn()
    items = []

    for d in dates:
        occupied_result = await db.execute(
            select(func.count(Elder.id)).where(Elder.admission_date <= d)
        )
        occupied = occupied_result.scalar() or 0
        occupancy_rate = round(occupied / total_beds * 100, 1)

        risk_row = conn.execute(
            "SELECT AVG(risk_score) FROM daily_risk_scores WHERE date = ?",
            [d.isoformat()],
        ).fetchone()
        risk_score = round(risk_row[0], 1) if risk_row and risk_row[0] else 0.0

        items.append({
            "date": d.isoformat(),
            "occupancyRate": occupancy_rate,
            "riskScore": risk_score,
            "bedCount": total_beds,
            "occupiedCount": occupied,
        })

    conn.close()
    return items


@router.get("/annotations", summary="获取风险标注列表")
async def get_annotations(
    start_date: date = Query(default=date.today() - timedelta(days=7)),
    end_date: date = Query(default=date.today()),
    type: str | None = Query(None),
    severity: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    start_dt = start_date
    end_dt = end_date + timedelta(days=1)

    stmt = select(RiskAnnotation).where(
        and_(
            RiskAnnotation.timestamp >= start_dt,
            RiskAnnotation.timestamp < end_dt,
        )
    ).order_by(RiskAnnotation.timestamp.desc())

    if type:
        stmt = stmt.where(RiskAnnotation.type == type)
    if severity:
        stmt = stmt.where(RiskAnnotation.severity == severity)

    result = await db.execute(stmt)
    annotations = result.scalars().all()

    fall_stmt = select(FallEvent).where(
        and_(
            FallEvent.timestamp >= start_dt,
            FallEvent.timestamp < end_dt,
        )
    )
    fall_result = await db.execute(fall_stmt)
    falls = fall_result.scalars().all()

    billing_stmt = select(BillingCaliberChange).where(
        and_(
            BillingCaliberChange.change_date >= start_date,
            BillingCaliberChange.change_date <= end_date,
        )
    )
    billing_result = await db.execute(billing_stmt)
    billing_changes = billing_result.scalars().all()

    result_list = []

    for a in annotations:
        metadata = a.metadata_ or {}
        item = {
            "id": str(a.id),
            "type": a.type,
            "timestamp": a.timestamp.isoformat(),
            "description": a.description,
            "severity": a.severity,
            "metadata": metadata,
            "delayMinutes": None,
            "missingStart": None,
            "missingEnd": None,
            "oldCaliber": None,
            "newCaliber": None,
            "impactOnTrend": None,
        }
        if a.type == "terminal_delay":
            item["delayMinutes"] = metadata.get("delay_minutes") or metadata.get("delayMinutes")
            if item["delayMinutes"]:
                item["metadata"]["syncDelay"] = True
        if a.type == "access_missing":
            item["missingStart"] = metadata.get("missing_start") or metadata.get("missingStart")
            item["missingEnd"] = metadata.get("missing_end") or metadata.get("missingEnd")
        if a.type == "billing_caliber_change":
            item["oldCaliber"] = metadata.get("old_caliber") or metadata.get("oldCaliber")
            item["newCaliber"] = metadata.get("new_caliber") or metadata.get("newCaliber")
        if a.type == "fall_event":
            item["impactOnTrend"] = True
            item["metadata"]["impactOnTrend"] = True
        result_list.append(item)

    for f in falls:
        result_list.append({
            "id": f"fall-{f.id}",
            "type": "fall_event",
            "timestamp": f.timestamp.isoformat(),
            "description": f.description,
            "severity": "critical",
            "metadata": {
                "elderId": str(f.elder_id),
                "impactOnTrend": True,
            },
            "delayMinutes": None,
            "missingStart": None,
            "missingEnd": None,
            "oldCaliber": None,
            "newCaliber": None,
            "impactOnTrend": True,
        })

    for bc in billing_changes:
        result_list.append({
            "id": f"billing-{bc.id}",
            "type": "billing_caliber_change",
            "timestamp": bc.change_date.isoformat() + "T00:00:00",
            "description": bc.description,
            "severity": "low",
            "metadata": {
                "oldCaliber": bc.old_caliber,
                "newCaliber": bc.new_caliber,
            },
            "delayMinutes": None,
            "missingStart": None,
            "missingEnd": None,
            "oldCaliber": bc.old_caliber,
            "newCaliber": bc.new_caliber,
            "impactOnTrend": None,
        })

    result_list.sort(key=lambda x: x["timestamp"], reverse=True)
    return result_list
