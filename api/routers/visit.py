import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import VisitRecord, Elder
from api.schemas import VisitRecordOut, VisitRecordCreate

router = APIRouter(prefix="/visits", tags=["探访记录"])


@router.get("", response_model=list[VisitRecordOut], summary="获取探访记录列表")
async def list_visits(
    elder_id: uuid.UUID | None = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(VisitRecord).order_by(VisitRecord.scheduled_time.desc()).limit(limit)
    if elder_id:
        stmt = stmt.where(VisitRecord.elder_id == elder_id)
    result = await db.execute(stmt)
    return [
        VisitRecordOut.model_validate(r, from_attributes=True)
        for r in result.scalars().all()
    ]


@router.post("", response_model=VisitRecordOut, summary="创建探访记录", status_code=201)
async def create_visit(
    data: VisitRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    elder_result = await db.execute(select(Elder).where(Elder.id == data.elder_id))
    if not elder_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="老人记录不存在")
    record = VisitRecord(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return VisitRecordOut.model_validate(record, from_attributes=True)
