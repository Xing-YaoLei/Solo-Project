from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import tempfile
import pandas as pd

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Course, CourseMember, ProgressRecord, Chapter,
    Assignment, ExportLog, User, UserRole, NotificationStatus
)
from app import schemas

router = APIRouter()


@router.post("/monthly", response_model=schemas.MonthlyReviewResponse)
def monthly_review(
    query: schemas.MonthlyReviewQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    courses_query = db.query(Course)
    if query.trainer_id:
        courses_query = courses_query.filter(Course.trainer_id == query.trainer_id)
    if query.course_id:
        courses_query = courses_query.filter(Course.id == query.course_id)
    if current_user.role == UserRole.TRAINER:
        courses_query = courses_query.filter(Course.trainer_id == current_user.id)

    courses = courses_query.all()
    course_stats = []

    for course in courses:
        for cm in course.members:
            if query.member_id and cm.member_id != query.member_id:
                continue

            month_records = db.query(ProgressRecord).filter(
                ProgressRecord.course_id == course.id,
                ProgressRecord.member_id == cm.member_id,
                db.extract("year", ProgressRecord.created_at) == query.year,
                db.extract("month", ProgressRecord.created_at) == query.month
            ).all()

            consumed_sessions = sum(r.consumed_sessions for r in month_records) if month_records else 0
            last_record = db.query(ProgressRecord).filter(
                ProgressRecord.course_id == course.id,
                ProgressRecord.member_id == cm.member_id
            ).order_by(ProgressRecord.created_at.desc()).first()

            actual_progress = last_record.new_progress if last_record else cm.actual_progress_rate
            expected_progress = cm.expected_progress_rate
            gap = round(expected_progress - actual_progress, 2)
            is_behind = actual_progress < expected_progress - 5
            remaining = max(0, course.total_sessions - consumed_sessions)
            completion_rate = actual_progress

            course_stats.append(schemas.CourseMonthlyStats(
                course_id=course.id,
                course_name=course.name,
                trainer_name=course.trainer.full_name,
                member_name=cm.member.full_name,
                total_sessions=course.total_sessions,
                consumed_sessions=consumed_sessions,
                remaining_sessions=remaining,
                expected_progress=expected_progress,
                actual_progress=actual_progress,
                completion_rate=completion_rate,
                is_behind=is_behind,
                gap=gap
            ))

    total_courses = len(set(cs.course_id for cs in course_stats))
    total_members = len(course_stats)
    overall_rate = round(
        sum(cs.completion_rate for cs in course_stats) / total_members, 2
    ) if total_members > 0 else 0.0
    on_track = sum(1 for cs in course_stats if not cs.is_behind and cs.completion_rate < 100)
    behind = sum(1 for cs in course_stats if cs.is_behind)
    completed = sum(1 for cs in course_stats if cs.completion_rate >= 100)

    return schemas.MonthlyReviewResponse(
        year=query.year,
        month=query.month,
        total_courses=total_courses,
        total_members=total_members,
        overall_completion_rate=overall_rate,
        on_track_count=on_track,
        behind_count=behind,
        completed_count=completed,
        course_stats=course_stats
    )


@router.post("/export/monthly")
def export_monthly_review(
    query: schemas.MonthlyReviewQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = monthly_review(query, db, current_user)

    filter_conditions = {
        "year": query.year,
        "month": query.month,
        "trainer_id": query.trainer_id,
        "member_id": query.member_id,
        "course_id": query.course_id,
        "generated_at": datetime.utcnow().isoformat(),
        "operator_id": current_user.id,
        "operator_name": current_user.full_name
    }

    data = []
    for cs in review.course_stats:
        data.append({
            "课程ID": cs.course_id,
            "课程名称": cs.course_name,
            "教练": cs.trainer_name,
            "学员": cs.member_name,
            "总课时": cs.total_sessions,
            "已消耗课时": cs.consumed_sessions,
            "剩余课时": cs.remaining_sessions,
            "预期进度(%)": cs.expected_progress,
            "实际进度(%)": cs.actual_progress,
            "完成率(%)": cs.completion_rate,
            "是否落后": "是" if cs.is_behind else "否",
            "差距(%)": cs.gap
        })

    summary_data = [{
        "统计月份": f"{query.year}年{query.month}月",
        "课程总数": review.total_courses,
        "学员总数": review.total_members,
        "整体完成率(%)": review.overall_completion_rate,
        "正常进度人数": review.on_track_count,
        "进度落后人数": review.behind_count,
        "已完成人数": review.completed_count,
        "生成时间": filter_conditions["generated_at"],
        "操作人": filter_conditions["operator_name"]
    }]

    os.makedirs("exports", exist_ok=True)
    filename = f"月度复盘_{query.year}_{query.month}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xlsx"
    filepath = os.path.join("exports", filename)

    with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="汇总", index=False)
        pd.DataFrame(data).to_excel(writer, sheet_name="详细数据", index=False)
        filter_df = pd.DataFrame([filter_conditions])
        filter_df.to_excel(writer, sheet_name="筛选条件", index=False)

    export_log = ExportLog(
        operator_id=current_user.id,
        export_type="monthly_review",
        filter_conditions=filter_conditions,
        file_name=filename,
        file_url=filepath
    )
    db.add(export_log)
    db.commit()

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get("/export-logs", response_model=List[schemas.ExportLogResponse])
def list_export_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(ExportLog).order_by(ExportLog.generated_at.desc()).offset(skip).limit(limit).all()
    result = []
    for log in logs:
        result.append(schemas.ExportLogResponse(
            id=log.id,
            export_type=log.export_type,
            filter_conditions=log.filter_conditions,
            file_name=log.file_name,
            generated_at=log.generated_at,
            operator_name=log.operator.full_name
        ))
    return result
