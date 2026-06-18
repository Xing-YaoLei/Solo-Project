import os
import uuid
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.enums import InspectionResult, InspectionType
from app.models.inspection import InspectionPhoto, InspectionRecord
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.inspection import (
    InspectionPhotoResponse,
    InspectionRecordCreate,
    InspectionRecordResponse,
)

router = APIRouter(prefix="/inspections", tags=["质检管理"])

UPLOAD_DIR = settings.UPLOAD_DIR


@router.get("", response_model=list[InspectionRecordResponse])
async def list_inspections(
    work_order_id: Optional[UUID] = Query(None),
    type_filter: Optional[str] = Query(None, alias="type"),
    result_filter: Optional[str] = Query(None, alias="result"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(InspectionRecord).options(
        selectinload(InspectionRecord.photos),
        selectinload(InspectionRecord.inspector),
    )
    conditions = []

    if work_order_id:
        conditions.append(InspectionRecord.work_order_id == work_order_id)
    if type_filter:
        conditions.append(InspectionRecord.type == type_filter)
    if result_filter:
        conditions.append(InspectionRecord.result == result_filter)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query.order_by(InspectionRecord.created_at.desc()))
    records = result.scalars().all()

    return [_build_inspection_response(r) for r in records]


@router.post("", response_model=InspectionRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    data: InspectionRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_result = await db.execute(select(WorkOrder).where(WorkOrder.id == data.work_order_id))
    if not order_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    record = InspectionRecord(
        id=uuid.uuid4(),
        work_order_id=data.work_order_id,
        type=data.type,
        result=data.result,
        notes=data.notes,
        inspector_id=current_user.id,
    )
    db.add(record)
    await db.flush()

    if data.photo_urls:
        for url in data.photo_urls:
            photo = InspectionPhoto(
                id=uuid.uuid4(),
                inspection_id=record.id,
                photo_url=url,
            )
            db.add(photo)

    await db.commit()

    result = await db.execute(
        select(InspectionRecord)
        .options(selectinload(InspectionRecord.photos), selectinload(InspectionRecord.inspector))
        .where(InspectionRecord.id == record.id)
    )
    return _build_inspection_response(result.scalar_one())


@router.get("/{inspection_id}", response_model=InspectionRecordResponse)
async def get_inspection(
    inspection_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InspectionRecord)
        .options(selectinload(InspectionRecord.photos), selectinload(InspectionRecord.inspector))
        .where(InspectionRecord.id == inspection_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="质检记录不存在")
    return _build_inspection_response(record)


@router.post("/{inspection_id}/photos", response_model=list[InspectionPhotoResponse], status_code=status.HTTP_201_CREATED)
async def add_inspection_photos(
    inspection_id: UUID,
    files: list[UploadFile] = File(...),
    descriptions: Optional[list[str]] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InspectionRecord).where(InspectionRecord.id == inspection_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="质检记录不存在")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    photos = []

    for i, file in enumerate(files):
        ext = os.path.splitext(file.filename or "image.jpg")[1]
        filename = f"{inspection_id}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        desc = descriptions[i] if descriptions and i < len(descriptions) else None
        photo = InspectionPhoto(
            id=uuid.uuid4(),
            inspection_id=inspection_id,
            photo_url=f"/{UPLOAD_DIR}/{filename}",
            description=desc,
        )
        db.add(photo)
        photos.append(photo)

    await db.commit()

    return [InspectionPhotoResponse.model_validate(p) for p in photos]


def _build_inspection_response(record: InspectionRecord) -> InspectionRecordResponse:
    inspector_name = None
    if record.inspector:
        inspector_name = record.inspector.display_name

    photos = [InspectionPhotoResponse.model_validate(p) for p in record.photos]

    return InspectionRecordResponse(
        id=record.id,
        work_order_id=record.work_order_id,
        type=record.type.value if hasattr(record.type, "value") else str(record.type),
        result=record.result.value if hasattr(record.result, "value") else str(record.result),
        notes=record.notes,
        inspector_id=record.inspector_id,
        inspector_name=inspector_name,
        created_at=record.created_at,
        photos=photos,
    )
