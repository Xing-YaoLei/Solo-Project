from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.deps import require_role
from app.models.user import User
from app.schemas.caliber import CaliberVersionCreate, CaliberVersion
from app.services.caliber_service import CaliberService

router = APIRouter(prefix="/caliber", tags=["口径管理"])


@router.get("/versions", response_model=List[CaliberVersion])
def get_versions(
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    service = CaliberService(db)
    return service.get_versions()


@router.post("/versions", response_model=CaliberVersion)
def create_version(
    data: CaliberVersionCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    try:
        service = CaliberService(db)
        return service.create_version(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/versions/{version}/activate", response_model=CaliberVersion)
def activate_version(
    version: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    try:
        service = CaliberService(db)
        return service.activate_version(version)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
