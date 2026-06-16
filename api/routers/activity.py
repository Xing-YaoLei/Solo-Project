import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import ActivityRecord, Elder
from api.schemas import ActivityRecordOut, ActivityRecordCreate

router = APIRouter(prefix="/activities", tags=["活动记录"])


@router.get("", response_model=list[ActivityRecordOut], summary="获取活动记录列表")
async def list_activities(
    elder_id: uuid.UUID | None = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ActivityRecord).order_by(ActivityRecord.scheduled_time.desc()).limit(limit)
    if elder_id:
        stmt = stmt.where(ActivityRecord.elder_id == elder_id)
    result = await db.execute(stmt)
    return [
        ActivityRecordOut.model_validate(r, from_attributes=True)
        for r in result.scalars().all()
    ]


@router.post("", response_model=ActivityRecordOut, summary="创建活动记录", status_code=201)
async def create_activity(
    data: ActivityRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    elder_result = await db.execute(select(Elder).where(Elder.id == data.elder_id))
    if not elder_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="老人记录不存在")
    record = ActivityRecord(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return ActivityRecordOut.model_validate(record, from_attributes=True)
