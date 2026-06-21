from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.attachment import Attachment, AttachmentCategory
from ..models.user import User
from ..schemas.attachment import AttachmentResponse, AttachmentUpdate
from ..schemas.base import PaginatedResponse, SuccessResponse
from ..utils.file_upload import save_upload_file

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AttachmentResponse])
async def list_attachments(
    quote_id: Optional[str] = None,
    exception_id: Optional[str] = None,
    payment_id: Optional[str] = None,
    category: Optional[AttachmentCategory] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Attachment)
    if quote_id:
        stmt = stmt.where(Attachment.quote_id == quote_id)
    if exception_id:
        stmt = stmt.where(Attachment.exception_id == exception_id)
    if payment_id:
        stmt = stmt.where(Attachment.payment_id == payment_id)
    if category:
        stmt = stmt.where(Attachment.category == category)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(Attachment.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    attachments = result.scalars().all()

    return PaginatedResponse(
        items=list(attachments),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    quote_id: Optional[str] = Form(None),
    exception_id: Optional[str] = Form(None),
    payment_id: Optional[str] = Form(None),
    category: AttachmentCategory = Form(AttachmentCategory.OTHER),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not quote_id and not exception_id and not payment_id:
        raise HTTPException(status_code=400, detail="必须指定关联的报价单、异常记录或支付流水")

    file_path, safe_name, file_size = await save_upload_file(file, sub_dir=quote_id or exception_id or payment_id or "general")

    attachment = Attachment(
        quote_id=quote_id,
        exception_id=exception_id,
        payment_id=payment_id,
        file_name=file.filename or safe_name,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type,
        category=category,
        description=description,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.post("/batch-upload", response_model=List[AttachmentResponse])
async def batch_upload_attachments(
    files: List[UploadFile] = File(...),
    quote_id: Optional[str] = Form(None),
    exception_id: Optional[str] = Form(None),
    payment_id: Optional[str] = Form(None),
    category: AttachmentCategory = Form(AttachmentCategory.OTHER),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not quote_id and not exception_id and not payment_id:
        raise HTTPException(status_code=400, detail="必须指定关联的报价单、异常记录或支付流水")

    attachments = []
    for file in files:
        file_path, safe_name, file_size = await save_upload_file(
            file, sub_dir=quote_id or exception_id or payment_id or "general"
        )
        attachment = Attachment(
            quote_id=quote_id,
            exception_id=exception_id,
            payment_id=payment_id,
            file_name=file.filename or safe_name,
            file_path=file_path,
            file_size=file_size,
            content_type=file.content_type,
            category=category,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(attachment)
        attachments.append(attachment)

    await db.commit()
    for a in attachments:
        await db.refresh(a)
    return attachments


@router.put("/{attachment_id}", response_model=AttachmentResponse)
async def update_attachment(
    attachment_id: str,
    req: AttachmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachment = await db.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attachment, field, value)
    attachment.updated_by = current_user.id
    from datetime import datetime
    attachment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.delete("/{attachment_id}", response_model=SuccessResponse)
async def delete_attachment(
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachment = await db.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")

    import os
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass

    await db.delete(attachment)
    await db.commit()
    return SuccessResponse(message="删除成功")
