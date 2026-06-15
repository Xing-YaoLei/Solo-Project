from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional

from app.database import get_db
from app.models import Classroom, ClassroomSchedule, User, UserRole
from app.schemas import ClassroomBase, ClassroomResponse, ClassroomScheduleBase
from app.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=dict)
async def list_classrooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    building: Optional[str] = None,
    room_type: Optional[str] = None,
    min_capacity: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Classroom)
    count_query = select(func.count(Classroom.id))

    if building:
        query = query.where(Classroom.building == building)
        count_query = count_query.where(Classroom.building == building)
    if room_type:
        query = query.where(Classroom.room_type == room_type)
        count_query = count_query.where(Classroom.room_type == room_type)
    if min_capacity:
        query = query.where(Classroom.capacity >= min_capacity)
        count_query = count_query.where(Classroom.capacity >= min_capacity)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(Classroom.building, Classroom.room_no).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    classrooms = result.scalars().all()

    return {
        "data": [c.__dict__ for c in classrooms],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/buildings")
async def list_buildings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Classroom.building).distinct())
    buildings = [r[0] for r in result.all()]
    return {"buildings": sorted(buildings)}


@router.post("", response_model=ClassroomResponse)
async def create_classroom(
    data: ClassroomBase,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    classroom = Classroom(**data.model_dump())
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return classroom


@router.post("/schedule", response_model=ClassroomScheduleBase)
async def create_schedule(
    data: ClassroomScheduleBase,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS)),
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(
        select(ClassroomSchedule).where(
            ClassroomSchedule.classroom_id == data.classroom_id,
            ClassroomSchedule.date == data.date,
            and_(
                ClassroomSchedule.period_start <= data.period_end,
                ClassroomSchedule.period_end >= data.period_start,
            )
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="该时段教室已被占用")
    schedule = ClassroomSchedule(**data.model_dump())
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule
