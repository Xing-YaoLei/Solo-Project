from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.core.deps import get_db, get_current_active_admin
from app.models.user import User
from app.schemas.batch import ImportBatch as ImportBatchSchema
from app.services.import_service import ImportService
from app.api.deps import get_import_service

router = APIRouter()


@router.post("/{source_type}", response_model=ImportBatchSchema)
def import_data(
    source_type: str,
    file: UploadFile = File(...),
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    import_service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_active_admin),
):
    if source_type not in ["crm", "payment", "contract", "inspection", "repair"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source type: {source_type}",
        )
    
    try:
        contents = file.file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please use CSV or Excel.",
            )
        
        data = {f"{source_type}s": df.to_dict("records")}
        
        batch = import_service.import_data(
            source_type=source_type,
            data=data,
            file_name=file.filename,
            imported_by=current_user.id,
            remark=remark,
        )
        
        return batch
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}",
        )


@router.post("/json/{source_type}", response_model=ImportBatchSchema)
def import_json_data(
    source_type: str,
    data: Dict[str, Any],
    file_name: str = "manual_import",
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    import_service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_active_admin),
):
    if source_type not in ["crm", "payment", "contract", "inspection", "repair"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source type: {source_type}",
        )
    
    try:
        batch = import_service.import_data(
            source_type=source_type,
            data=data,
            file_name=file_name,
            imported_by=current_user.id,
            remark=remark,
        )
        
        return batch
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}",
        )


@router.get("/batches", response_model=list[ImportBatchSchema])
def list_batches(
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    import_service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_active_admin),
):
    return import_service.list_batches(source_type=source_type, status=status, skip=skip, limit=limit)


@router.get("/batches/{batch_id}", response_model=ImportBatchSchema)
def get_batch(
    batch_id: int,
    import_service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_active_admin),
):
    batch = import_service.get_batch(batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found",
        )
    return batch
