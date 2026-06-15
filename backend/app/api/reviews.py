from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db, model_to_dict
from app.models import ReviewApplication, Student, Course, Score, User, UserRole, ReviewStatus, Notification, NotificationType, AuditLog, AuditAction
from app.schemas import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewRecordView
from app.security import get_current_user, require_roles

router = APIRouter()


def _generate_application_no() -> str:
    return f"RV{datetime.now().strftime('%Y%m%d%H%M%S')}{datetime.now().microsecond // 1000:03d}"


def _enrich_review(r: ReviewApplication) -> dict:
    r_dict = model_to_dict(r)
    if r.student:
        r_dict["student_name"] = r.student.name
        r_dict["student_no"] = r.student.student_id
    if r.course:
        r_dict["course_name"] = r.course.course_name
        r_dict["course_code"] = r.course.course_code
    if r.reviewer:
        r_dict["reviewer_name"] = r.reviewer.full_name
    if r.handler:
        r_dict["handler_name"] = r.handler.full_name
    return r_dict


async def _create_notification(db: AsyncSession, recipient_id: int, review_id: int, type: NotificationType, title: str, content: str, reason: str = None):
    notif = Notification(
        recipient_id=recipient_id,
        review_id=review_id,
        type=type,
        title=title,
        content=content,
        reason=reason,
    )
    db.add(notif)


async def _add_audit_log(db: AsyncSession, action: AuditAction, entity_type: str, entity_id: int, review_id: Optional[int], operator_id: int, old_values: dict = None, new_values: dict = None, reason: str = None, action_taken: str = None, closed_at: datetime = None):
    log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        review_id=review_id,
        operator_id=operator_id,
        old_values=old_values,
        new_values=new_values,
        reason=reason,
        action_taken=action_taken,
        closed_at=closed_at,
    )
    db.add(log)


@router.get("/record-view", response_model=ReviewRecordView)
async def get_record_view(
    grade: Optional[str] = None,
    major: Optional[str] = None,
    class_name: Optional[str] = None,
    semester: Optional[str] = None,
    review_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    students_query = select(Student).options(selectinload(Student.advisor))
    scores_query = select(Score).options(selectinload(Score.course), selectinload(Score.teacher))
    reviews_query = select(ReviewApplication).options(
        selectinload(ReviewApplication.student),
        selectinload(ReviewApplication.course),
        selectinload(ReviewApplication.reviewer),
        selectinload(ReviewApplication.handler),
    )

    if grade:
        students_query = students_query.where(Student.grade == grade)
    if major:
        students_query = students_query.where(Student.major == major)
    if class_name:
        students_query = students_query.where(Student.class_name == class_name)

    result = await db.execute(students_query.order_by(Student.student_id))
    students = result.scalars().all()
    student_ids = [s.id for s in students]

    if student_ids:
        scores_query = scores_query.where(Score.student_id.in_(student_ids))
        reviews_query = reviews_query.where(ReviewApplication.student_id.in_(student_ids))
    if semester:
        scores_query = scores_query.where(Score.semester == semester)
    if review_status:
        try:
            reviews_query = reviews_query.where(ReviewApplication.status == ReviewStatus(review_status))
        except ValueError:
            pass

    scores_result = await db.execute(scores_query.order_by(Score.student_id, Score.semester))
    scores = scores_result.scalars().all()
    reviews_result = await db.execute(reviews_query.order_by(ReviewApplication.applied_at.desc()))
    reviews = reviews_result.scalars().all()

    from app.api.scores import _enrich_score

    return {
        "students": [
            {**model_to_dict(s), "advisor_name": s.advisor.full_name if s.advisor else None}
            for s in students
        ],
        "scores": [_enrich_score(s) for s in scores],
        "reviews": [_enrich_review(r) for r in reviews],
        "total_students": len(students),
        "total_reviews": len(reviews),
    }


@router.get("", response_model=dict)
async def list_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    reviewer_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ReviewApplication).options(
        selectinload(ReviewApplication.student),
        selectinload(ReviewApplication.course),
        selectinload(ReviewApplication.reviewer),
        selectinload(ReviewApplication.handler),
    )
    count_query = select(func.count(ReviewApplication.id))

    if status:
        try:
            query = query.where(ReviewApplication.status == ReviewStatus(status))
            count_query = count_query.where(ReviewApplication.status == ReviewStatus(status))
        except ValueError:
            pass
    if student_id:
        query = query.where(ReviewApplication.student_id == student_id)
        count_query = count_query.where(ReviewApplication.student_id == student_id)
    if course_id:
        query = query.where(ReviewApplication.course_id == course_id)
        count_query = count_query.where(ReviewApplication.course_id == course_id)
    if reviewer_id:
        query = query.where(ReviewApplication.reviewer_id == reviewer_id)
        count_query = count_query.where(ReviewApplication.reviewer_id == reviewer_id)
    if date_from:
        query = query.where(func.date(ReviewApplication.applied_at) >= date_from)
        count_query = count_query.where(func.date(ReviewApplication.applied_at) >= date_from)
    if date_to:
        query = query.where(func.date(ReviewApplication.applied_at) <= date_to)
        count_query = count_query.where(func.date(ReviewApplication.applied_at) <= date_to)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(ReviewApplication.applied_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    reviews = result.scalars().all()

    return {
        "data": [_enrich_review(r) for r in reviews],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReviewApplication).options(
            selectinload(ReviewApplication.student),
            selectinload(ReviewApplication.course),
            selectinload(ReviewApplication.reviewer),
            selectinload(ReviewApplication.handler),
        ).where(ReviewApplication.id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="复核申请不存在")
    return _enrich_review(review)


@router.post("", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    student = (await db.execute(select(Student).where(Student.id == data.student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    course = (await db.execute(select(Course).where(Course.id == data.course_id))).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    current_score_val = 0.0
    score_id_val = data.score_id
    if score_id_val:
        score = (await db.execute(select(Score).where(Score.id == score_id_val))).scalar_one_or_none()
        if score:
            current_score_val = score.total_score
    else:
        score = (await db.execute(select(Score).where(and_(Score.student_id == data.student_id, Score.course_id == data.course_id)).order_by(Score.id.desc()))).scalar_one_or_none()
        if score:
            current_score_val = score.total_score
            score_id_val = score.id

    review = ReviewApplication(
        student_id=data.student_id,
        course_id=data.course_id,
        score_id=score_id_val,
        application_no=_generate_application_no(),
        reason=data.reason,
        current_score=current_score_val,
        expected_score=data.expected_score,
        status=ReviewStatus.PENDING,
        deadline=data.deadline,
        materials=[],
        missing_materials=[],
    )
    db.add(review)
    await db.flush()

    await _add_audit_log(
        db, AuditAction.CREATE, "review_application", review.id, review.id,
        current_user.id, new_values={"status": ReviewStatus.PENDING.value, "reason": data.reason}
    )
    await db.commit()
    await db.refresh(review)
    return _enrich_review(review)


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReviewApplication).options(
            selectinload(ReviewApplication.student),
            selectinload(ReviewApplication.course),
            selectinload(ReviewApplication.reviewer),
            selectinload(ReviewApplication.handler),
        ).where(ReviewApplication.id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="复核申请不存在")

    old_values = {
        "status": review.status.value,
        "review_result": review.review_result,
        "adjusted_score": review.adjusted_score,
        "missing_materials": review.missing_materials,
    }

    update_data = data.model_dump(exclude_unset=True)

    old_status = review.status
    if "status" in update_data:
        try:
            new_status = ReviewStatus(update_data["status"])
        except ValueError:
            new_status = old_status
        update_data["status"] = new_status

        if new_status == ReviewStatus.MATERIALS_MISSING and old_status != ReviewStatus.MATERIALS_MISSING:
            mm = update_data.get("missing_materials", [])
            reason_str = f"缺少材料: {', '.join(mm) if mm else '未说明'}"
            if review.student.advisor_id:
                await _create_notification(
                    db, review.student.advisor_id, review.id,
                    NotificationType.MATERIALS_MISSING,
                    "成绩复核材料缺失通知",
                    f"学生[{review.student.name}]的复核申请(编号:{review.application_no})材料缺失，请及时处理。\n缺失材料: {', '.join(mm) if mm else '未说明'}",
                    reason=reason_str,
                )
            student_affairs = (await db.execute(select(User).where(User.role == UserRole.STUDENT_AFFAIRS))).scalars().all()
            for sa in student_affairs:
                await _create_notification(
                    db, sa.id, review.id, NotificationType.MATERIALS_MISSING,
                    "成绩复核材料缺失通知",
                    f"学生[{review.student.name}]的复核申请材料缺失，缺失: {', '.join(mm) if mm else '未说明'}",
                    reason=reason_str,
                )
            await _add_audit_log(
                db, AuditAction.STATUS_CHANGE, "review_application", review.id, review.id,
                current_user.id, old_values={"status": old_status.value},
                new_values={"status": new_status.value, "missing_materials": mm},
                reason=reason_str,
            )

        if new_status in [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.CLOSED]:
            update_data["closed_at"] = datetime.utcnow()
            update_data["reviewed_at"] = datetime.utcnow()
            await _add_audit_log(
                db, AuditAction.STATUS_CHANGE, "review_application", review.id, review.id,
                current_user.id, old_values={"status": old_status.value},
                new_values={"status": new_status.value, "adjusted_score": update_data.get("adjusted_score")},
                reason=f"状态变更为 {new_status.value}",
                action_taken=update_data.get("review_result"),
                closed_at=update_data["closed_at"],
            )

    for key, value in update_data.items():
        setattr(review, key, value)

    if "handler_id" not in update_data and review.handler_id is None:
        review.handler_id = current_user.id

    await db.commit()
    await db.refresh(review)
    return _enrich_review(review)


@router.post("/{review_id}/materials-check")
async def check_materials(
    review_id: int,
    missing_materials: list[str],
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS, UserRole.ADVISOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReviewApplication).options(
            selectinload(ReviewApplication.student),
            selectinload(ReviewApplication.course),
        ).where(ReviewApplication.id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="复核申请不存在")

    review.missing_materials = missing_materials
    review.status = ReviewStatus.MATERIALS_MISSING
    reason_str = f"材料缺失检查: {', '.join(missing_materials)}"

    action_taken_str = f"材料缺失通知已发送至导师及学工处"

    if review.student and review.student.advisor_id:
        await _create_notification(
            db, review.student.advisor_id, review.id, NotificationType.MATERIALS_MISSING,
            "成绩复核材料缺失",
            f"学生[{review.student.name}]复核申请缺失材料: {', '.join(missing_materials)}",
            reason=reason_str,
        )

    student_affairs = (await db.execute(select(User).where(User.role == UserRole.STUDENT_AFFAIRS))).scalars().all()
    for sa in student_affairs:
        await _create_notification(
            db, sa.id, review.id, NotificationType.MATERIALS_MISSING,
            "成绩复核材料缺失",
            f"学生[{review.student.name if review.student else ''}]复核申请缺失材料: {', '.join(missing_materials)}",
            reason=reason_str,
        )

    await _add_audit_log(
        db, AuditAction.NOTIFY, "review_application", review.id, review.id,
        current_user.id, new_values={"missing_materials": missing_materials, "status": ReviewStatus.MATERIALS_MISSING.value},
        reason=reason_str, action_taken=action_taken_str,
    )
    await db.commit()
    return {"message": "材料缺失检查完成，通知已发送", "missing": missing_materials}
