from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import pandas as pd
from ..core.database import get_db
from ..data_processing import data_cleaner, data_deduplicator, get_caliber_matcher
from ..models import Student, Enrollment, AcademicRecord, Homework, DataSourceSync, NoteTask
from ..services.funnel_service import get_funnel_service, FunnelService
from ..services.alert_service import get_alert_service, AlertService
from datetime import datetime, date
from sqlalchemy import and_
import uuid

router = APIRouter(prefix="/api/data", tags=["数据同步"])


def _find_or_create_student(
    db: Session,
    row: pd.Series,
    phone_to_student: Dict[str, Student],
    caliber
) -> Student:
    """查找或创建学生记录，返回 Student 实例"""
    phone = str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else ''
    name = str(row.get('name', '')).strip() if pd.notna(row.get('name')) else ''

    if phone and phone in phone_to_student:
        student = phone_to_student[phone]
        existing_sources = (student.data_source or '').split(',') if student.data_source else []
        source = row.get('data_source', '')
        if source and source not in existing_sources:
            existing_sources.append(source)
            student.data_source = ','.join(sorted([s for s in existing_sources if s]))
            student.is_merged = len(existing_sources) > 1
        return student

    student = Student(
        student_no=f"STU{uuid.uuid4().hex[:8].upper()}",
        name=name,
        gender=str(row.get('gender', '')).strip() if pd.notna(row.get('gender')) else '',
        age=int(row['age']) if pd.notna(row.get('age')) else None,
        grade=str(row.get('grade', '')).strip() if pd.notna(row.get('grade')) else '',
        school=str(row.get('school', '')).strip() if pd.notna(row.get('school')) else '',
        phone=phone,
        address=str(row.get('address', '')).strip() if pd.notna(row.get('address')) else '',
        region_id=int(row['region_id']) if pd.notna(row.get('region_id')) else None,
        data_source=str(row.get('data_source', '')),
        is_merged=bool(row.get('is_merged', False))
    )
    db.add(student)
    db.flush()
    if phone:
        phone_to_student[phone] = student
    return student


def _parse_date(value: Any) -> Optional[date]:
    """安全解析日期"""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    try:
        return datetime.strptime(str(value).strip()[:10], '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def _process_alerts_and_create_tasks(
    db: Session,
    funnel_service: FunnelService,
    alert_service: AlertService
) -> Dict[str, Any]:
    """统一处理：检测预警并生成备注任务，返回统计信息和任务详情"""
    funnel_service.invalidate_cache()

    alerts = alert_service.check_alerts()

    note_task_details = []
    note_tasks_created = 0

    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for alert in alerts:
        dup_task = db.query(NoteTask).filter(
            and_(
                NoteTask.trigger_threshold_id == alert['threshold_id'],
                NoteTask.status.in_(['pending', 'processing']),
                NoteTask.created_at >= today_start
            )
        ).first()

        if not dup_task:
            task = alert_service.generate_note_task(alert)
            note_tasks_created += 1
            note_task_details.append({
                "id": task.id,
                "task_no": task.task_no,
                "type": task.type,
                "title": task.title,
                "chart_ref": task.chart_ref,
                "priority": task.priority,
                "level": alert['level']
            })

    db.commit()
    funnel_service.invalidate_cache()

    return {
        "alerts_triggered": len(alerts),
        "note_tasks_created": note_tasks_created,
        "note_tasks": note_task_details
    }


@router.post("/sync/enrollment")
async def sync_enrollment_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步报名表数据 - 清洗、去重、口径匹配后写入 Student + Enrollment"""
    try:
        contents = await file.read()
        df = pd.read_excel(contents) if file.filename.endswith(('.xlsx', '.xls')) else pd.read_csv(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件解析失败: {str(e)}")

    sync_record = DataSourceSync(
        source_name="enrollment",
        sync_type="full",
        record_count=len(df),
        status="running"
    )
    db.add(sync_record)
    db.commit()

    try:
        cleaned_df = data_cleaner.clean_enrollment_data(df.to_dict('records'))
        deduped_df, dedup_count = data_deduplicator.deduplicate_dataframe(cleaned_df)

        caliber = get_caliber_matcher(db)
        if 'course_name' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_courses(deduped_df, 'course_name')
        if 'region' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_regions(deduped_df, 'region')

        existing_phones = db.query(Student.phone, Student).filter(Student.phone != '').all()
        phone_to_student = {p: s for p, s in existing_phones}

        student_count = 0
        enrollment_count = 0

        for _, row in deduped_df.iterrows():
            student = _find_or_create_student(db, row, phone_to_student, caliber)
            student_count += 1

            course_id = int(row['course_id']) if pd.notna(row.get('course_id')) else None

            if course_id and student.id:
                existing = db.query(Enrollment).filter(
                    and_(
                        Enrollment.student_id == student.id,
                        Enrollment.course_id == course_id
                    )
                ).first()

                if not existing:
                    enrollment = Enrollment(
                        enrollment_no=f"EN{uuid.uuid4().hex[:8].upper()}",
                        student_id=student.id,
                        course_id=course_id,
                        enrollment_date=_parse_date(row.get('enrollment_date')),
                        source_channel=str(row.get('source_channel', '')).strip() if pd.notna(row.get('source_channel')) else '',
                        status=str(row.get('status', 'active')).strip() if pd.notna(row.get('status')) else 'active',
                        raw_data=row.to_dict(),
                        is_cleaned=True
                    )
                    db.add(enrollment)
                    enrollment_count += 1

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        funnel_service = get_funnel_service(db)
        alert_service = get_alert_service(db)
        alert_result = _process_alerts_and_create_tasks(db, funnel_service, alert_service)

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count,
            "students_inserted_merged": student_count,
            "enrollments_inserted": enrollment_count,
            **alert_result
        }

    except Exception as e:
        db.rollback()
        sync_record.status = "failed"
        sync_record.error_message = str(e)[:2000]
        sync_record.finished_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@router.post("/sync/academic")
async def sync_academic_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步教务系统数据 - 清洗后写入 Student + AcademicRecord"""
    try:
        contents = await file.read()
        df = pd.read_excel(contents) if file.filename.endswith(('.xlsx', '.xls')) else pd.read_csv(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件解析失败: {str(e)}")

    sync_record = DataSourceSync(
        source_name="academic",
        sync_type="incremental",
        record_count=len(df),
        status="running"
    )
    db.add(sync_record)
    db.commit()

    try:
        cleaned_df = data_cleaner.clean_academic_data(df.to_dict('records'))
        deduped_df, dedup_count = data_deduplicator.deduplicate_dataframe(cleaned_df)

        caliber = get_caliber_matcher(db)
        if 'course_name' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_courses(deduped_df, 'course_name')
        if 'region' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_regions(deduped_df, 'region')

        existing_phones = db.query(Student.phone, Student).filter(Student.phone != '').all()
        phone_to_student = {p: s for p, s in existing_phones}

        student_count = 0
        academic_count = 0

        for _, row in deduped_df.iterrows():
            student = _find_or_create_student(db, row, phone_to_student, caliber)
            student_count += 1

            course_id = int(row['course_id']) if pd.notna(row.get('course_id')) else None
            chapter_id = None
            if course_id and pd.notna(row.get('chapter_no')):
                chapter_id = caliber.match_chapter(course_id, str(row['chapter_no']))

            if student.id:
                record_date = _parse_date(row.get('record_date'))

                attend_count = int(row['attend_count']) if pd.notna(row.get('attend_count')) else 0
                total_classes = int(row['total_classes']) if pd.notna(row.get('total_classes')) else 0

                raw_score = row.get('score')
                score = caliber.normalize_score_caliber(
                    float(raw_score) if pd.notna(raw_score) else None,
                    'academic'
                )

                attendance_rate = caliber.normalize_attendance_caliber(attend_count, total_classes)

                grade_level = str(row.get('grade_level', '')).strip() if pd.notna(row.get('grade_level')) else ''
                if not grade_level and score is not None:
                    if score >= 90:
                        grade_level = '优秀'
                    elif score >= 80:
                        grade_level = '良好'
                    elif score >= 70:
                        grade_level = '中等'
                    elif score >= 60:
                        grade_level = '及格'
                    else:
                        grade_level = '不及格'

                record = AcademicRecord(
                    record_no=f"AC{uuid.uuid4().hex[:8].upper()}",
                    student_id=student.id,
                    course_id=course_id,
                    chapter_id=chapter_id,
                    attend_count=attend_count,
                    total_classes=total_classes,
                    attendance_rate=attendance_rate,
                    score=score,
                    grade_level=grade_level,
                    record_date=record_date,
                    raw_data=row.to_dict(),
                    is_cleaned=True
                )
                db.add(record)
                academic_count += 1

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        funnel_service = get_funnel_service(db)
        alert_service = get_alert_service(db)
        alert_result = _process_alerts_and_create_tasks(db, funnel_service, alert_service)

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count,
            "students_inserted_merged": student_count,
            "academic_records_inserted": academic_count,
            **alert_result
        }

    except Exception as e:
        db.rollback()
        sync_record.status = "failed"
        sync_record.error_message = str(e)[:2000]
        sync_record.finished_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@router.post("/sync/homework")
async def sync_homework_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步作业平台数据 - 清洗后写入 Student + Homework"""
    try:
        contents = await file.read()
        df = pd.read_excel(contents) if file.filename.endswith(('.xlsx', '.xls')) else pd.read_csv(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件解析失败: {str(e)}")

    sync_record = DataSourceSync(
        source_name="homework",
        sync_type="incremental",
        record_count=len(df),
        status="running"
    )
    db.add(sync_record)
    db.commit()

    try:
        cleaned_df = data_cleaner.clean_homework_data(df.to_dict('records'))
        deduped_df, dedup_count = data_deduplicator.deduplicate_dataframe(cleaned_df)

        caliber = get_caliber_matcher(db)
        if 'course_name' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_courses(deduped_df, 'course_name')
        if 'region' in deduped_df.columns:
            deduped_df = caliber.match_dataframe_regions(deduped_df, 'region')

        existing_phones = db.query(Student.phone, Student).filter(Student.phone != '').all()
        phone_to_student = {p: s for p, s in existing_phones}

        student_count = 0
        homework_count = 0

        for _, row in deduped_df.iterrows():
            student = _find_or_create_student(db, row, phone_to_student, caliber)
            student_count += 1

            if student.id:
                course_id = int(row['course_id']) if pd.notna(row.get('course_id')) else None
                chapter_id = None
                if course_id and pd.notna(row.get('chapter_no')):
                    chapter_id = caliber.match_chapter(course_id, str(row['chapter_no']))

                raw_score = row.get('score')
                score = caliber.normalize_score_caliber(
                    float(raw_score) if pd.notna(raw_score) else None,
                    'homework'
                )

                submit_time_raw = row.get('submit_time')
                submit_time = None
                if submit_time_raw is not None and not (isinstance(submit_time_raw, float) and pd.isna(submit_time_raw)):
                    if isinstance(submit_time_raw, datetime):
                        submit_time = submit_time_raw
                    elif isinstance(submit_time_raw, pd.Timestamp):
                        submit_time = submit_time_raw.to_pydatetime()
                    else:
                        try:
                            submit_time = pd.to_datetime(str(submit_time_raw)).to_pydatetime()
                        except Exception:
                            submit_time = None

                is_submitted = bool(row.get('is_submitted', False)) if pd.notna(row.get('is_submitted')) else (submit_time is not None)
                is_late = bool(row.get('is_late', False)) if pd.notna(row.get('is_late')) else False

                homework = Homework(
                    homework_no=f"HW{uuid.uuid4().hex[:8].upper()}",
                    student_id=student.id,
                    course_id=course_id,
                    chapter_id=chapter_id,
                    submit_time=submit_time,
                    score=score,
                    is_submitted=is_submitted,
                    is_late=is_late,
                    feedback=str(row.get('feedback', '')).strip() if pd.notna(row.get('feedback')) else '',
                    raw_data=row.to_dict(),
                    is_cleaned=True
                )
                db.add(homework)
                homework_count += 1

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        funnel_service = get_funnel_service(db)
        alert_service = get_alert_service(db)
        alert_result = _process_alerts_and_create_tasks(db, funnel_service, alert_service)

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count,
            "students_inserted_merged": student_count,
            "homework_inserted": homework_count,
            **alert_result
        }

    except Exception as e:
        db.rollback()
        sync_record.status = "failed"
        sync_record.error_message = str(e)[:2000]
        sync_record.finished_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@router.get("/sync/history")
def get_sync_history(
    source_name: str = None,
    db: Session = Depends(get_db)
):
    """获取同步历史记录"""
    query = db.query(DataSourceSync)
    if source_name:
        query = query.filter(DataSourceSync.source_name == source_name)
    records = query.order_by(DataSourceSync.started_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "source_name": r.source_name,
            "sync_type": r.sync_type,
            "record_count": r.record_count,
            "clean_count": r.clean_count,
            "dedup_count": r.dedup_count,
            "status": r.status,
            "error_message": r.error_message,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None
        }
        for r in records
    ]
