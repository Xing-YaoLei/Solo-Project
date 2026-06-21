import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AppealPhoto, VerificationPhoto
from app.schemas import VerificationPhotoResponse

router = APIRouter(prefix="/api/photos", tags=["photos"])


@router.post("/upload", response_model=VerificationPhotoResponse, status_code=201)
async def upload_photo(
    order_id: uuid.UUID = Form(...),
    photo_url: str = Form(...),
    photo_type: str = Form(...),
    uploaded_by: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    photo = VerificationPhoto(
        order_id=order_id,
        photo_url=photo_url,
        photo_type=photo_type,
        uploaded_by=uploaded_by,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return photo


@router.get("", response_model=dict)
async def list_photos(
    ticket_id: Optional[uuid.UUID] = None,
    ticket_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    if ticket_type == "appeal":
        stmt = select(AppealPhoto)
        if ticket_id:
            stmt = stmt.where(AppealPhoto.appeal_id == ticket_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(AppealPhoto.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        item_list = [
            {
                "id": str(p.id),
                "ticket_id": str(p.appeal_id),
                "ticket_type": "appeal",
                "photo_url": p.photo_url,
                "photo_type": p.photo_type,
                "uploaded_by": str(p.uploaded_by) if p.uploaded_by else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in items
        ]
    else:
        stmt = select(VerificationPhoto)
        if ticket_id:
            stmt = stmt.where(VerificationPhoto.order_id == ticket_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(VerificationPhoto.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        item_list = [
            {
                "id": str(p.id),
                "ticket_id": str(p.order_id),
                "ticket_type": "verification",
                "photo_url": p.photo_url,
                "photo_type": p.photo_type,
                "uploaded_by": str(p.uploaded_by) if p.uploaded_by else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in items
        ]

    return {
        "items": item_list,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{photo_id}", response_model=dict)
async def get_photo(photo_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(VerificationPhoto).where(VerificationPhoto.id == photo_id)
    result = await db.execute(stmt)
    photo = result.scalar_one_or_none()
    if photo:
        return VerificationPhotoResponse.model_validate(photo).model_dump()

    stmt = select(AppealPhoto).where(AppealPhoto.id == photo_id)
    result = await db.execute(stmt)
    appeal_photo = result.scalar_one_or_none()
    if appeal_photo:
        return {
            "id": str(appeal_photo.id),
            "ticket_id": str(appeal_photo.appeal_id),
            "ticket_type": "appeal",
            "photo_url": appeal_photo.photo_url,
            "photo_type": appeal_photo.photo_type,
            "uploaded_by": str(appeal_photo.uploaded_by) if appeal_photo.uploaded_by else None,
            "created_at": appeal_photo.created_at.isoformat(),
        }

    raise HTTPException(status_code=404, detail="Photo not found")
