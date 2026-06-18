from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Vehicle, Store, InspectionReport, InspectionItem, PreparationTask, TestDriveRecord
from schemas import VehicleListItem, VehicleDetail, InspectionReport as InspectionReportSchema, InspectionItem as InspectionItemSchema, PreparationItem, TestDriveRecord as TestDriveRecordSchema

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleListItem])
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    store_id: str | None = Query(None),
    keyword: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Vehicle, Store.store_name)
        .join(Store, Vehicle.store_id == Store.store_id, isouter=True)
    )

    if status:
        query = query.where(Vehicle.status == status)
    if store_id:
        query = query.where(Vehicle.store_id == store_id)
    if keyword:
        query = query.where(
            (Vehicle.vin.ilike(f"%{keyword}%")) | (Vehicle.model.ilike(f"%{keyword}%")) | (Vehicle.brand.ilike(f"%{keyword}%"))
        )

    query = query.order_by(Vehicle.entry_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = (await db.execute(query)).all()

    results: list[VehicleListItem] = []
    for vehicle, store_name in rows:
        turnover_days = 0
        if vehicle.entry_date:
            turnover_days = (await db.execute(
                select(func.extract("day", func.now() - vehicle.entry_date))
            )).scalar()
            turnover_days = int(float(turnover_days)) if turnover_days else 0

        results.append(VehicleListItem(
            vehicle_id=vehicle.vehicle_id,
            vin=vehicle.vin,
            model=vehicle.model or "",
            brand=vehicle.brand or "",
            store_name=store_name or "",
            entry_date=str(vehicle.entry_date),
            status=vehicle.status,
            turnover_days=turnover_days,
        ))
    return results


@router.get("/{vehicle_id}", response_model=VehicleDetail)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    vehicle = (
        await db.execute(
            select(Vehicle)
            .options(
                selectinload(Vehicle.store),
                selectinload(Vehicle.inspection_reports).selectinload(InspectionReport.items),
                selectinload(Vehicle.preparation_tasks),
                selectinload(Vehicle.test_drive_records),
            )
            .where(Vehicle.vehicle_id == vehicle_id)
        )
    ).scalar_one_or_none()

    if not vehicle:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vehicle not found")

    inspection_reports = [
        InspectionReportSchema(
            report_id=r.report_id,
            inspector=r.inspector or "",
            inspect_date=str(r.inspect_date or ""),
            detector_version=r.detector_version or "",
            items=[
                InspectionItemSchema(
                    item_name=item.item_name or "",
                    status=item.status or "pass",
                    detail=item.detail or "",
                )
                for item in r.items
            ],
        )
        for r in vehicle.inspection_reports
    ]

    preparation_list = [
        PreparationItem(
            task_id=t.task_id,
            task_name=t.task_name or "",
            category=t.category or "",
            status=t.status,
            related_inspection_item=t.related_inspection_item or "",
            cost=float(t.cost) if t.cost else 0.0,
        )
        for t in vehicle.preparation_tasks
    ]

    test_drive_records = [
        TestDriveRecordSchema(
            record_id=r.record_id,
            drive_date=str(r.drive_date or ""),
            driver=r.driver or "",
            duration_minutes=r.duration_minutes or 0,
            mileage_km=float(r.mileage_km) if r.mileage_km else 0.0,
            is_anomaly=r.is_anomaly or False,
            anomaly_detail=r.anomaly_detail,
        )
        for r in vehicle.test_drive_records
    ]

    turnover_days = 0
    if vehicle.entry_date:
        days = (await db.execute(
            select(func.extract("day", func.now() - vehicle.entry_date))
        )).scalar()
        turnover_days = int(float(days)) if days else 0

    return VehicleDetail(
        vehicle_id=vehicle.vehicle_id,
        vin=vehicle.vin,
        model=vehicle.model or "",
        brand=vehicle.brand or "",
        year=vehicle.year or 0,
        mileage=float(vehicle.mileage) if vehicle.mileage else 0.0,
        store_id=vehicle.store_id or "",
        store_name=vehicle.store.store_name if vehicle.store else "",
        entry_date=str(vehicle.entry_date),
        status=vehicle.status,
        source_db_version=vehicle.source_db_version or "",
        detector_version=vehicle.detector_version or "",
        crm_id=vehicle.crm_id or "",
        inspection_reports=inspection_reports,
        preparation_list=preparation_list,
        test_drive_records=test_drive_records,
    )
