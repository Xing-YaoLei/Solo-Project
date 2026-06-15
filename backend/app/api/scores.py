from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models import Score, Student, Course, User, UserRole
from app.schemas import ScoreCreate, ScoreUpdate, ScoreResponse
from app.security import get_current_user, require_roles

router = APIRouter()


def _enrich_score(score: Score) -> dict:
    s_dict = score.__dict__
    if score.course:
        s_dict["course_name"] = score.course.course_name
        s_dict["course_code"] = score.course.course_code
    if score.teacher:
        s_dict["teacher_name"] = score.teacher.full_name
    return s_dict


@router.get("", response_model=dict)
async def list_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    semester: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Score)
    count_query = select(func.count(Score.id))

    if student_id:
        query = query.where(Score.student_id == student_id)
        count_query = count_query.where(Score.student_id == student_id)
    if course_id:
        query = query.where(Score.course_id == course_id)
        count_query = count_query.where(Score.course_id == course_id)
    if semester:
        query = query.where(Score.semester == semester)
        count_query = count_query.where(Score.semester == semester)
    if min_score is not None:
        query = query.where(Score.total_score >= min_score)
        count_query = count_query.where(Score.total_score >= min_score)
    if max_score is not None:
        query = query.where(Score.total_score <= max_score)
        count_query = count_query.where(Score.total_score <= max_score)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(Score.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    scores = result.scalars().all()

    return {
        "data": [_enrich_score(s) for s in scores],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/student/{student_id}", response_model=list[ScoreResponse])
async def get_student_scores(
    student_id: int,
    semester: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Score).where(Score.student_id == student_id)
    if semester:
        query = query.where(Score.semester == semester)
    query = query.order_by(Score.semester.desc(), Score.id.desc())
    result = await db.execute(query)
    scores = result.scalars().all()
    return [_enrich_score(s) for s in scores]


@router.get("/{score_id}", response_model=ScoreResponse)
async def get_score(
    score_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Score).where(Score.id == score_id))
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="成绩不存在")
    return _enrich_score(score)


@router.post("", response_model=ScoreResponse)
async def create_score(
    data: ScoreCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    score = Score(**data.model_dump())
    db.add(score)
    await db.commit()
    await db.refresh(score)
    return _enrich_score(score)


@router.put("/{score_id}", response_model=ScoreResponse)
async def update_score(
    score_id: int,
    data: ScoreUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Score).where(Score.id == score_id))
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="成绩不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(score, key, value)
    await db.commit()
    await db.refresh(score)
    return _enrich_score(score)


@router.delete("/{score_id}")
async def delete_score(
    score_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Score).where(Score.id == score_id))
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="成绩不存在")
    await db.delete(score)
    await db.commit()
    return {"message": "删除成功"}
