from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_worker, get_current_active_admin
from app.models.user import User
from app.schemas.repair import (
    RepairOrder as RepairOrderSchema,
    RepairOrderCreate,
    RepairCaliberVersion as RepairCaliberVersionSchema,
    RepairCaliberVersionCreate,
)
from app.services.repair_service import RepairService
from app.api.deps import get_repair_service

router = APIRouter()


@router.post("/caliber", response_model=RepairCaliberVersionSchema)
def create_caliber_version(
    caliber_in: RepairCaliberVersionCreate,
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_admin),
):
    return repair_service.create_caliber_version(caliber_in)


@router.get("/caliber", response_model=List[RepairCaliberVersionSchema])
def list_caliber_versions(
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    return repair_service.list_caliber_versions()


@router.get("/caliber/active", response_model=Optional[RepairCaliberVersionSchema])
def get_active_caliber(
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    return repair_service.get_active_caliber_version()


@router.post("", response_model=RepairOrderSchema)
def create_repair_order(
    repair_in: RepairOrderCreate,
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    return repair_service.create_repair_order(repair_in)


@router.get("", response_model=List[RepairOrderSchema])
def list_repair_orders(
    status: Optional[str] = None,
    repair_type: Optional[str] = None,
    caliber_version: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    worker_id = None
    if current_user.role == "worker":
        worker_id = current_user.id
    
    return repair_service.list_repair_orders(
        worker_id=worker_id,
        status=status,
        repair_type=repair_type,
        caliber_version=caliber_version,
        skip=skip,
        limit=limit,
    )


@router.get("/{repair_id}", response_model=RepairOrderSchema)
def get_repair_order(
    repair_id: int,
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    repair = repair_service.get_repair_order(repair_id)
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair order not found",
        )
    
    if current_user.role == "worker" and repair.worker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return repair


@router.put("/{repair_id}/status", response_model=RepairOrderSchema)
def update_repair_status(
    repair_id: int,
    status: str,
    worker_id: Optional[int] = None,
    repair_service: RepairService = Depends(get_repair_service),
    current_user: User = Depends(get_current_active_worker),
):
    repair = repair_service.get_repair_order(repair_id)
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair order not found",
        )
    
    if current_user.role == "worker":
        if repair.worker_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        worker_id = current_user.id
    
    if status not in ["pending", "assigned", "processing", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status",
        )
    
    updated_repair = repair_service.update_repair_status(repair_id, status, worker_id)
    if not updated_repair:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update repair status",
        )
    
    return updated_repair
