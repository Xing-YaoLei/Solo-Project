import json
import os
import functools

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Store, Vehicle, MaterialItem, TurnoverTarget
from schemas import DashboardKPI, StoreMapPoint, TurnoverTrend, MaterialHeatmap, MaterialSample, KPITrend

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)


def cache(ttl: int = 300):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"dashboard:{func.__name__}"
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass
            result = await func(*args, **kwargs)
            try:
                await redis_client.setex(cache_key, ttl, json.dumps(result))
            except Exception:
                pass
            return result
        return wrapper
    return decorator


@router.get("/kpi", response_model=DashboardKPI)
@cache(ttl=300)
async def get_kpi(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Vehicle.vehicle_id)))).scalar() or 0

    transferred = (
        await db.execute(
            select(func.count(Vehicle.vehicle_id)).where(Vehicle.status.in_(["transferred", "sold"]))
        )
    ).scalar() or 0

    completion_rate = round(transferred / total, 3) if total > 0 else 0.0

    avg_days_result = (
        await db.execute(
            select(
                func.avg(
                    func.extract("day", func.now() - Vehicle.entry_date)
                )
            )
        )
    ).scalar()
    avg_turnover_days = round(float(avg_days_result), 1) if avg_days_result else 0.0

    missing = (await db.execute(
        select(func.count(MaterialItem.material_id)).where(MaterialItem.status == "missing")
    )).scalar() or 0
    total_materials = (await db.execute(select(func.count(MaterialItem.material_id)))).scalar() or 1
    missing_rate = round(missing / total_materials, 3)

    trends: list[KPITrend] = []
    for i in range(12):
        month_str = f"2025-{i + 1:02d}"
        trends.append(KPITrend(
            date=month_str,
            turnover_days=round(28 - i * 0.4, 1),
            completion_rate=round(0.8 + i * 0.006, 3),
            missing_rate=round(0.18 - i * 0.003, 3),
        ))

    return DashboardKPI(
        total_vehicles=total,
        transfer_completion_rate=completion_rate,
        avg_turnover_days=avg_turnover_days,
        material_missing_rate=missing_rate,
        kpi_trends=trends,
    )


@router.get("/stores", response_model=list[StoreMapPoint])
@cache(ttl=300)
async def get_stores(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Store))).scalars().all()
    points: list[StoreMapPoint] = []
    for s in rows:
        v_count = (
            await db.execute(
                select(func.count(Vehicle.vehicle_id)).where(Vehicle.store_id == s.store_id)
            )
        ).scalar() or 0

        avg_target = (
            await db.execute(
                select(func.avg(TurnoverTarget.target_days)).where(TurnoverTarget.store_id == s.store_id)
            )
        ).scalar()

        avg_days = (
            await db.execute(
                select(
                    func.avg(func.extract("day", func.now() - Vehicle.entry_date))
                ).where(Vehicle.store_id == s.store_id)
            )
        ).scalar()

        target = float(avg_target) if avg_target else 20.0
        current = float(avg_days) if avg_days else 0.0

        if current > target * 1.5:
            status = "critical"
        elif current > target * 1.2:
            status = "warning"
        else:
            status = "normal"

        points.append(StoreMapPoint(
            store_id=s.store_id,
            store_name=s.store_name,
            lng=float(s.lng) if s.lng is not None else 0.0,
            lat=float(s.lat) if s.lat is not None else 0.0,
            vehicle_count=v_count,
            turnover_status=status,
        ))
    return points


@router.get("/turnover-trends", response_model=list[TurnoverTrend])
@cache(ttl=300)
async def get_turnover_trends(db: AsyncSession = Depends(get_db)):
    trends: list[TurnoverTrend] = []
    for i in range(12):
        month_str = f"2025-{i + 1:02d}"
        current = round(24 - i * 0.3, 1)
        trends.append(TurnoverTrend(
            month=month_str,
            current=current,
            yoy=round(30 - i * 0.5, 1),
            mom=round(25 - i * 0.2, 1),
            target=20.0,
        ))
    return trends


@router.get("/material-heatmap", response_model=list[MaterialHeatmap])
@cache(ttl=300)
async def get_material_heatmap(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(
                MaterialItem.material_type,
                Store.store_name,
                func.count(MaterialItem.material_id).label("total"),
                func.sum(case((MaterialItem.status == "missing", 1), else_=0)).label("missing"),
            )
            .join(Vehicle, MaterialItem.vehicle_id == Vehicle.vehicle_id)
            .join(Store, Vehicle.store_id == Store.store_id)
            .group_by(MaterialItem.material_type, Store.store_name)
        )
    ).all()

    heatmaps: list[MaterialHeatmap] = []
    for material_type, store_name, total, missing in rows:
        missing_count = int(missing or 0)
        total_count = int(total or 1)
        missing_rate = round(missing_count / total_count, 3) if total_count > 0 else 0.0

        sample_rows = (
            await db.execute(
                select(Vehicle.vehicle_id, Vehicle.vin, Vehicle.model, MaterialItem.material_type)
                .join(MaterialItem, Vehicle.vehicle_id == MaterialItem.vehicle_id)
                .where(MaterialItem.status == "missing", MaterialItem.material_type == material_type)
                .limit(2)
            )
        ).all()

        samples = [
            MaterialSample(
                vehicle_id=s.vehicle_id,
                vin=s.vin,
                model=s.model or "",
                missing_items=[s.material_type or ""],
            )
            for s in sample_rows
        ]

        heatmaps.append(MaterialHeatmap(
            material_type=material_type or "",
            store_name=store_name or "",
            missing_count=missing_count,
            missing_rate=missing_rate,
            samples=samples,
        ))
    return heatmaps
