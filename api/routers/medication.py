import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import MedicationRecord, Elder
from api.schemas import MedicationRecordOut, MedicationRecordCreate

router = APIRouter(prefix="/medications", tags=["用药记录"])


@router.get("", response_model=list[MedicationRecordOut], summary="获取用药记录列表")
async def list_medications(
    elder_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MedicationRecord).order_by(MedicationRecord.scheduled_time.desc()).limit(limit)
    if elder_id:
        stmt = stmt.where(MedicationRecord.elder_id == elder_id)
    if status:
        stmt = stmt.where(MedicationRecord.status == status)
    result = await db.execute(stmt)
    return [
        MedicationRecordOut.model_validate(r, from_attributes=True)
        for r in result.scalars().all()
    ]


@router.post("", response_model=MedicationRecordOut, summary="创建用药记录", status_code=201)
async def create_medication(
    data: MedicationRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    elder_result = await db.execute(select(Elder).where(Elder.id == data.elder_id))
    if not elder_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="老人记录不存在")
    record = MedicationRecord(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return MedicationRecordOut.model_validate(record, from_attributes=True)
