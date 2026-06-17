import uuid
from datetime import timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import ActivityRecord, Elder
from api.schemas import ActivityRecordOut, ActivityRecordCreate, ActivityAttendee

router = APIRouter(prefix="/activities", tags=["活动记录"])


@router.get("", response_model=list[ActivityRecordOut], summary="获取活动记录列表")
async def list_activities(
    date: str | None = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ActivityRecord, Elder.name).join(
        Elder, ActivityRecord.elder_id == Elder.id
    ).order_by(ActivityRecord.scheduled_time.desc()).limit(limit)
    result = await db.execute(stmt)

    activity_groups: dict[str, list[tuple[ActivityRecord, str]]] = defaultdict(list)
    for r, elder_name in result.all():
        date_key = r.scheduled_time.date().isoformat()
        if date and date_key != date:
            continue
        group_key = f"{r.activity_name}-{date_key}"
        activity_groups[group_key].append((r, elder_name))

    locations = ["1楼活动室", "2楼手工室", "3楼休闲区", "4楼多功能厅"]
    activities = []
    for idx, (group_key, records) in enumerate(activity_groups.items()):
        first_record = records[0][0]
        activity_name = first_record.activity_name
        activity_date = first_record.scheduled_time.date().isoformat()
        start_time = first_record.scheduled_time
        end_time = start_time + timedelta(hours=1)

        attendees = []
        for r, elder_name in records:
            attendees.append(ActivityAttendee(
                elder_id=r.elder_id,
                elder_name=elder_name,
                check_in_time=r.check_in_time,
                status="checked_in" if r.checked_in else "absent",
            ))

        activities.append(ActivityRecordOut(
            id=f"act-{idx}",
            activity_name=activity_name,
            activity_date=activity_date,
            start_time=start_time,
            end_time=end_time,
            location=locations[idx % len(locations)],
            attendees=attendees,
        ))

    return activities


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
