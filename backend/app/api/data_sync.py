from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import json
from ..core.database import get_db
from ..data_processing import data_cleaner, data_deduplicator, get_caliber_matcher
from ..models import Student, Enrollment, AcademicRecord, Homework, DataSourceSync
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/data", tags=["数据同步"])


@router.post("/sync/enrollment")
async def sync_enrollment_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步报名表数据 - 清洗、去重、口径匹配"""
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
        deduped_df = caliber.match_dataframe_courses(deduped_df, 'course_name')
        deduped_df = caliber.match_dataframe_regions(deduped_df, 'region')

        inserted = 0
        for _, row in deduped_df.iterrows():
            student = Student(
                student_no=f"STU{uuid.uuid4().hex[:8].upper()}",
                name=row.get('name', ''),
                gender=row.get('gender', ''),
                age=row.get('age'),
                grade=row.get('grade', ''),
                school=row.get('school', ''),
                phone=row.get('phone', ''),
                address=row.get('address', ''),
                region_id=row.get('region_id'),
                data_source=row.get('data_source', 'enrollment'),
                is_merged=row.get('is_merged', False)
            )
            db.add(student)
            inserted += 1

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count,
            "inserted_count": inserted
        }

    except Exception as e:
        sync_record.status = "failed"
        sync_record.error_message = str(e)
        sync_record.finished_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@router.post("/sync/academic")
async def sync_academic_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步教务系统数据"""
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

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count
        }

    except Exception as e:
        sync_record.status = "failed"
        sync_record.error_message = str(e)
        sync_record.finished_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@router.post("/sync/homework")
async def sync_homework_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """同步作业平台数据"""
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

        sync_record.clean_count = len(cleaned_df)
        sync_record.dedup_count = dedup_count
        sync_record.status = "success"
        sync_record.finished_at = datetime.now()
        db.commit()

        return {
            "message": "同步成功",
            "total_records": len(df),
            "cleaned_count": len(cleaned_df),
            "dedup_count": dedup_count
        }

    except Exception as e:
        sync_record.status = "failed"
        sync_record.error_message = str(e)
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
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None
        }
        for r in records
    ]
