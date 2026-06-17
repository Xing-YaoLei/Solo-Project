import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, get_db_session, require_role
from api.models import User
from api.schemas import (
    BatchStatusUpdate,
    MarkExceptionRequest,
    PaginatedResponse,
    PrescriptionCreate,
    PrescriptionDetail,
    PrescriptionListParams,
    PrescriptionOut,
    PrescriptionUpdate,
)
from api.services import prescription_service

router = APIRouter(prefix="/prescriptions", tags=["处方管理"])


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    body: PrescriptionCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    rx = await prescription_service.create_prescription(db, body, current_user.id)
    await db.commit()
    await db.refresh(rx)
    return rx


@router.get("", response_model=PaginatedResponse)
async def list_prescriptions(
    params: PrescriptionListParams = Depends(),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    items, total = await prescription_service.list_prescriptions(db, params)
    return PaginatedResponse(
        items=[PrescriptionOut.model_validate(p) for p in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=math.ceil(total / params.page_size) if total > 0 else 0,
    )


@router.get("/{rx_id}", response_model=PrescriptionDetail)
async def get_prescription(
    rx_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    rx = await prescription_service.get_prescription(db, rx_id)
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="处方不存在")
    return rx


@router.patch("/{rx_id}", response_model=PrescriptionOut)
async def update_prescription(
    rx_id: str,
    body: PrescriptionUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    rx = await prescription_service.get_prescription(db, rx_id)
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="处方不存在")

    if body.status:
        valid_transitions = {
            "pending": ["in_review", "exception"],
            "in_review": ["approved", "rejected", "exception"],
        }
        allowed = valid_transitions.get(rx.status, [])
        if body.status not in allowed and body.status != rx.status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不允许从 {rx.status} 变更为 {body.status}",
            )
        rx = await prescription_service.update_prescription_status(db, rx, body.status, current_user.id)

    if body.priority:
        rx.priority = body.priority
    if body.diagnosis is not None:
        rx.diagnosis = body.diagnosis

    await db.commit()
    await db.refresh(rx)
    return rx


@router.post("/{rx_id}/mark-exception", response_model=PrescriptionDetail)
async def mark_exception(
    rx_id: str,
    body: MarkExceptionRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    rx = await prescription_service.get_prescription(db, rx_id)
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="处方不存在")
    if rx.status == "exception":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="处方已处于异常状态")
    rx, exc = await prescription_service.mark_exception(db, rx, body, current_user.id)
    await db.commit()
    await db.refresh(rx)
    await db.refresh(exc)
    return rx


@router.post("/batch-status", response_model=list[PrescriptionOut])
async def batch_update_status(
    body: BatchStatusUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_role("admin", "regional_manager", "store_manager")),
):
    updated = await prescription_service.batch_update_status(
        db, body.prescription_ids, body.status, current_user.id
    )
    await db.commit()
    return updated
