from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User
from app.schemas.import_batch import (
    ImportBatch, ImportRequest, ImportResponse,
    ProgressNoteCreate, ProgressNoteResponse
)
from app.services.data_import_service import DataImportService

router = APIRouter(prefix="/import", tags=["数据导入"])


@router.get("/batches", response_model=List[ImportBatch])
def get_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    service = DataImportService(db)
    return service.get_batches(skip, limit)


@router.post("/trigger", response_model=ImportResponse)
def trigger_import(
    request: ImportRequest,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    if request.source not in ["live", "employment", "lms"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="数据源必须是 live、employment 或 lms"
        )
    service = DataImportService(db)
    return service.trigger_import(request, current_user.id)


@router.post("/rollback/{batch_id}")
def rollback_batch(
    batch_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    service = DataImportService(db)
    success = service.rollback_batch(batch_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"批次 {batch_id} 不存在"
        )
    return {"message": f"批次 {batch_id} 已回滚"}


@router.post("/notes", response_model=ProgressNoteResponse)
def add_note(
    note_data: ProgressNoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DataImportService(db)
    return service.add_note(note_data, current_user.id)


@router.get("/notes", response_model=List[ProgressNoteResponse])
def get_notes(
    date: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DataImportService(db)
    return service.get_notes(date)
