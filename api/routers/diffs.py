from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import DataDiff, Vehicle, Store
from schemas import DiffSummary, SourceVsCrm, DetectorVersionDiff, VersionEntry, DiffRecord

router = APIRouter(prefix="/diffs", tags=["diffs"])


@router.get("/summary", response_model=DiffSummary)
async def get_diff_summary(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(DataDiff.diff_id)))).scalar() or 0
    resolved = (await db.execute(
        select(func.count(DataDiff.diff_id)).where(DataDiff.resolved == True)
    )).scalar() or 0
    pending = total - resolved

    # Aggregate detector versions from Vehicle table (D3.0, D4.1, etc.)
    version_rows = (
        await db.execute(
            select(
                Vehicle.detector_version,
                func.count(Vehicle.vehicle_id).label("vehicle_count"),
            )
            .where(Vehicle.detector_version.isnot(None), Vehicle.detector_version != "")
            .group_by(Vehicle.detector_version)
            .order_by(Vehicle.detector_version)
        )
    ).all()

    versions: list[VersionEntry] = []
    for ver, cnt in version_rows:
        if not ver:
            continue

        # Find stores affected by this detector version
        store_rows = (
            await db.execute(
                select(distinct(Store.store_name))
                .join(Vehicle, Vehicle.store_id == Store.store_id)
                .where(Vehicle.detector_version == ver)
            )
        ).scalars().all()

        # Find earliest entry_date for this version as change_date
        earliest = (
            await db.execute(
                select(func.min(Vehicle.entry_date))
                .where(Vehicle.detector_version == ver)
            )
        ).scalar()
        change_date = str(earliest) if earliest else ""

        versions.append(VersionEntry(
            version=ver,
            count=cnt,
            change_date=change_date,
            affected_stores=list(store_rows),
        ))

    version_total = sum(v.count for v in versions)

    return DiffSummary(
        source_vs_crm=SourceVsCrm(total=total, resolved=resolved, pending=pending),
        detector_version_diff=DetectorVersionDiff(total=version_total, versions=versions),
    )


@router.get("/records", response_model=list[DiffRecord])
async def get_diff_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    resolved: bool | None = Query(None),
    source: str | None = Query(None),
    field_name: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(DataDiff, Vehicle.vin)
        .join(Vehicle, DataDiff.vehicle_id == Vehicle.vehicle_id)
    )

    if resolved is not None:
        query = query.where(DataDiff.resolved == resolved)
    if source:
        query = query.where(DataDiff.source == source)
    if field_name:
        query = query.where(DataDiff.field_name == field_name)

    query = query.order_by(DataDiff.detected_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = (await db.execute(query)).all()

    return [
        DiffRecord(
            diff_id=d.diff_id,
            vehicle_id=d.vehicle_id,
            vin=vin or "",
            field_name=d.field_name or "",
            source_value=d.source_value or "",
            crm_value=d.crm_value or "",
            source=d.source or "vehicle_source",
            detected_at=str(d.detected_at),
            resolved=d.resolved or False,
        )
        for d, vin in rows
    ]
