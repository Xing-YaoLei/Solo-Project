import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, get_db_session
from api.models import User, CaliberNote
from api.schemas import ExportRequest, ExportStatusResponse, GlobalCaliberNoteOut
from api.services.export_service import create_export_record, get_export_record_by_task

router = APIRouter(prefix="/export", tags=["数据导出"])


@router.post("/trigger", response_model=ExportStatusResponse)
async def trigger_export(
    body: ExportRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    from api.tasks.export_tasks import export_prescriptions

    task = export_prescriptions.delay(
        filters=body.filters,
        include_caliber=body.include_caliber,
        dimensions=body.dimensions,
        date_range=body.date_range,
        format=body.format,
    )
    task_id = task.id

    await create_export_record(db, task_id, body.export_type, current_user.id)
    await db.commit()

    return ExportStatusResponse(task_id=task_id, status="pending")


@router.get("/caliber-notes", response_model=list[GlobalCaliberNoteOut])
async def get_caliber_notes(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(CaliberNote).order_by(CaliberNote.created_at.asc()))
    notes = result.scalars().all()
    return notes


@router.get("/status/{task_id}", response_model=ExportStatusResponse)
async def get_export_status(
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record = await get_export_record_by_task(db, task_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="导出任务不存在")
    return ExportStatusResponse(
        task_id=record.task_id,
        status=record.status,
        file_path=record.file_path,
        error_message=record.error_message,
        row_count=record.row_count,
    )


@router.get("/download/{task_id}")
async def download_export(
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record = await get_export_record_by_task(db, task_id)
    if not record or record.status != "completed":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="导出文件不存在或未完成")
    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文件已被删除")
    filename = os.path.basename(record.file_path)
    return FileResponse(path=record.file_path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
