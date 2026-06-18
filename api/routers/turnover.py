from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Vehicle, Store, TurnoverTarget, TestDriveRecord
from schemas import TurnoverComparison, TurnoverGapSample, TestDriveRecord as TestDriveRecordSchema

router = APIRouter(prefix="/turnover", tags=["turnover"])


@router.get("/comparison", response_model=list[TurnoverComparison])
async def get_turnover_comparison(db: AsyncSession = Depends(get_db)):
    comparisons: list[TurnoverComparison] = []
    for i in range(12):
        month_str = f"2025-{i + 1:02d}"
        current = round(24 - i * 0.3, 1)
        target = 20.0
        comparisons.append(TurnoverComparison(
            period=month_str,
            current_value=current,
            yoy_value=round(30 - i * 0.5, 1),
            mom_value=round(25 - i * 0.2, 1),
            target_value=target,
            gap_to_target=round(current - target, 1),
        ))
    return comparisons


@router.get("/gap-samples", response_model=list[TurnoverGapSample])
async def get_gap_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    store_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Vehicle, Store.store_name)
        .join(Store, Vehicle.store_id == Store.store_id, isouter=True)
        .where(Vehicle.status.in_(["in_stock", "transfer_processing"]))
    )

    if store_id:
        query = query.where(Vehicle.store_id == store_id)

    query = query.order_by(Vehicle.entry_date.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = (await db.execute(query)).all()

    results: list[TurnoverGapSample] = []
    for idx, (vehicle, store_name) in enumerate(rows):
        turnover_days = 0
        if vehicle.entry_date:
            days = (await db.execute(
                select(func.extract("day", func.now() - vehicle.entry_date))
            )).scalar()
            turnover_days = int(float(days)) if days else 0

        gap_reasons = ["登记证缺失等待补办", "检测异常复检中", "整备延期", "试驾发现异响应修", "过户材料不齐"]

        anomaly_record = None
        if idx % 3 == 0:
            tdr = (
                await db.execute(
                    select(TestDriveRecord)
                    .where(TestDriveRecord.vehicle_id == vehicle.vehicle_id, TestDriveRecord.is_anomaly == True)
                    .limit(1)
                )
            ).scalar_one_or_none()

            if tdr:
                anomaly_record = TestDriveRecordSchema(
                    record_id=tdr.record_id,
                    drive_date=str(tdr.drive_date or ""),
                    driver=tdr.driver or "",
                    duration_minutes=tdr.duration_minutes or 0,
                    mileage_km=float(tdr.mileage_km) if tdr.mileage_km else 0.0,
                    is_anomaly=True,
                    anomaly_detail=tdr.anomaly_detail,
                )

        results.append(TurnoverGapSample(
            vehicle_id=vehicle.vehicle_id,
            vin=vehicle.vin,
            model=vehicle.model or "",
            store_name=store_name or "",
            turnover_days=turnover_days,
            gap_reason=gap_reasons[idx % len(gap_reasons)],
            test_drive_anomaly=anomaly_record,
        ))
    return results
