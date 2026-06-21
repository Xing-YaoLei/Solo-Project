import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import AppealPhoto, AppealTicket, FlowLog
from app.schemas import (
    AppealPhotoResponse,
    AppealTicketCreate,
    AppealTicketResponse,
    FlowLogResponse,
    RejectRequest,
    SupplementRequest,
    TransferRequest,
)
from app.services.flow_log import FlowLogService

router = APIRouter(prefix="/api/appeals", tags=["appeals"])


@router.get("", response_model=dict)
async def list_appeals(
    status: Optional[str] = None,
    rider_id: Optional[uuid.UUID] = None,
    appeal_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket)
    if status:
        stmt = stmt.where(AppealTicket.status == status)
    if rider_id:
        stmt = stmt.where(AppealTicket.rider_id == rider_id)
    if appeal_type:
        stmt = stmt.where(AppealTicket.appeal_type == appeal_type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(AppealTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [AppealTicketResponse.model_validate(a).model_dump() for a in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{appeal_id}", response_model=dict)
async def get_appeal(appeal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(AppealTicket).options(selectinload(AppealTicket.photos)).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")

    logs = await FlowLogService.get_logs(db, appeal_id, ticket_type="appeal")

    appeal_data = AppealTicketResponse.model_validate(appeal).model_dump()
    appeal_data["photos"] = [AppealPhotoResponse.model_validate(p).model_dump() for p in appeal.photos]
    appeal_data["logs"] = [FlowLogResponse.model_validate(l).model_dump() for l in logs]
    return appeal_data


@router.post("", response_model=AppealTicketResponse, status_code=201)
async def create_appeal(
    data: AppealTicketCreate,
    db: AsyncSession = Depends(get_db),
):
    appeal = AppealTicket(**data.model_dump(), status="pending")
    db.add(appeal)
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="created",
        operator_id=data.rider_id,
        operator_role="rider",
        comment="Appeal ticket created",
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/review", response_model=AppealTicketResponse)
async def review_appeal(
    appeal_id: uuid.UUID,
    reviewer_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending appeals can be reviewed")
    appeal.status = "in_review"
    if reviewer_id:
        appeal.handler_id = reviewer_id
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="reviewed",
        operator_id=reviewer_id,
        operator_role="operator",
        comment="Appeal moved to in_review",
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/request-supplement", response_model=AppealTicketResponse)
async def request_supplement(
    appeal_id: uuid.UUID,
    data: SupplementRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status not in ("in_review", "pending"):
        raise HTTPException(status_code=400, detail="Cannot request supplement for this appeal status")
    appeal.status = "supplement_requested"
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="supplement_requested",
        operator_id=operator_id,
        operator_role="operator",
        comment=data.description,
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/upload-supplement", response_model=AppealPhotoResponse, status_code=201)
async def upload_supplement(
    appeal_id: uuid.UUID,
    photo_url: str = Form(...),
    uploaded_by: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")

    photo = AppealPhoto(
        appeal_id=appeal_id,
        photo_url=photo_url,
        photo_type="supplement",
        uploaded_by=uploaded_by,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal_id,
        action="supplement_uploaded",
        operator_id=uploaded_by,
        operator_role="rider",
        comment="Supplement photo uploaded",
        ticket_type="appeal",
    )
    return photo


@router.post("/{appeal_id}/approve", response_model=AppealTicketResponse)
async def approve_appeal(
    appeal_id: uuid.UUID,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status not in ("in_review", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot approve appeal in current status")
    from datetime import datetime
    appeal.status = "approved"
    appeal.resolved_at = datetime.now()
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="approved",
        operator_id=operator_id,
        operator_role="operator",
        comment="Appeal approved",
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/reject", response_model=AppealTicketResponse)
async def reject_appeal(
    appeal_id: uuid.UUID,
    data: RejectRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status not in ("in_review", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot reject appeal in current status")
    from datetime import datetime
    appeal.status = "rejected"
    appeal.resolved_at = datetime.now()
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="rejected",
        operator_id=operator_id,
        operator_role="operator",
        comment=data.reason,
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/transfer", response_model=AppealTicketResponse)
async def transfer_appeal(
    appeal_id: uuid.UUID,
    data: TransferRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status not in ("in_review", "pending", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot transfer appeal in current status")
    appeal.transfer_from = appeal.handler_id
    appeal.handler_id = data.transfer_to
    appeal.transfer_reason = data.reason
    appeal.status = "transferred"
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="transferred",
        operator_id=operator_id,
        operator_role="operator",
        comment=f"Transferred: {data.reason}",
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/escalate", response_model=AppealTicketResponse)
async def escalate_appeal(
    appeal_id: uuid.UUID,
    reason: str = None,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")
    if appeal.status not in ("in_review", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot escalate appeal in current status")
    appeal.status = "escalated"
    appeal.escalation_reason = reason
    await db.flush()
    await db.refresh(appeal)

    await FlowLogService.create_log(
        db=db,
        ticket_id=appeal.id,
        action="escalated",
        operator_id=operator_id,
        operator_role="operator",
        comment=f"Escalated: {reason}",
        ticket_type="appeal",
    )
    return appeal


@router.post("/{appeal_id}/photos", response_model=AppealPhotoResponse, status_code=201)
async def upload_appeal_photo(
    appeal_id: uuid.UUID,
    photo_url: str = Form(...),
    photo_type: str = Form("evidence"),
    uploaded_by: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AppealTicket).where(AppealTicket.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="AppealTicket not found")

    photo = AppealPhoto(
        appeal_id=appeal_id,
        photo_url=photo_url,
        photo_type=photo_type,
        uploaded_by=uploaded_by,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return photo
