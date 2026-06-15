from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.database import get_db
from app.models import Student, User, UserRole
from app.schemas import StudentCreate, StudentUpdate, StudentResponse, Pagination
from app.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=dict)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    grade: Optional[str] = None,
    major: Optional[str] = None,
    class_name: Optional[str] = None,
    department: Optional[str] = None,
    advisor_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Student)
    count_query = select(func.count(Student.id))

    if keyword:
        like = f"%{keyword}%"
        query = query.where(or_(Student.name.like(like), Student.student_id.like(like)))
        count_query = count_query.where(or_(Student.name.like(like), Student.student_id.like(like)))
    if grade:
        query = query.where(Student.grade == grade)
        count_query = count_query.where(Student.grade == grade)
    if major:
        query = query.where(Student.major == major)
        count_query = count_query.where(Student.major == major)
    if class_name:
        query = query.where(Student.class_name == class_name)
        count_query = count_query.where(Student.class_name == class_name)
    if department:
        query = query.where(Student.department == department)
        count_query = count_query.where(Student.department == department)
    if advisor_id:
        query = query.where(Student.advisor_id == advisor_id)
        count_query = count_query.where(Student.advisor_id == advisor_id)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(Student.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    students = result.scalars().all()

    students_data = []
    for s in students:
        s_dict = s.__dict__
        if s.advisor:
            s_dict["advisor_name"] = s.advisor.full_name
        students_data.append(s_dict)

    return {
        "data": students_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    s_dict = student.__dict__
    if student.advisor:
        s_dict["advisor_name"] = student.advisor.full_name
    return s_dict


@router.post("", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS)),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Student).where(Student.student_id == data.student_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="学号已存在")
    student = Student(**data.model_dump())
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    data: StudentUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS, UserRole.ADVISOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    await db.commit()
    await db.refresh(student)
    return student


@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    await db.delete(student)
    await db.commit()
    return {"message": "删除成功"}
