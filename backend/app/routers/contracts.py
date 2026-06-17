from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
import os
import uuid

from ..database import get_db
from ..models import Contract, ContractAttachment
from ..schemas import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractAttachmentCreate,
    ContractAttachmentResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..config import settings
from ..utils.timeline import create_timeline

router = APIRouter(prefix="/api/contracts", tags=["合同管理"])


def ensure_upload_dir():
    upload_dir = os.path.join(settings.UPLOAD_DIR, "contracts")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    existing = db.query(Contract).filter(Contract.contract_no == contract.contract_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"合同编号 {contract.contract_no} 已存在")

    db_contract = Contract(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)

    create_timeline(
        db=db,
        operation_type="create",
        status=db_contract.status,
        contract_id=db_contract.id,
        remark="创建合同",
    )

    return db_contract


@router.get("", response_model=PaginatedResponse[ContractResponse])
def get_contracts(
    pagination: PaginationParams = Depends(),
    client_name: Optional[str] = None,
    project_name: Optional[str] = None,
    manager_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Contract)

    if pagination.keyword:
        query = query.filter(
            or_(
                Contract.contract_no.contains(pagination.keyword),
                Contract.client_name.contains(pagination.keyword),
                Contract.project_name.contains(pagination.keyword),
            )
        )
    if pagination.status:
        query = query.filter(Contract.status == pagination.status)
    if client_name:
        query = query.filter(Contract.client_name.contains(client_name))
    if project_name:
        query = query.filter(Contract.project_name.contains(project_name))
    if manager_id:
        query = query.filter(Contract.manager_id == manager_id)
    if pagination.start_date:
        query = query.filter(Contract.sign_date >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(Contract.sign_date <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(Contract.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    previous_status = db_contract.status
    update_data = contract_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_contract, key, value)

    db.commit()
    db.refresh(db_contract)

    if "status" in update_data and previous_status != db_contract.status:
        create_timeline(
            db=db,
            operation_type="status_change",
            status=db_contract.status,
            previous_status=previous_status,
            contract_id=db_contract.id,
            remark=f"状态变更: {previous_status} -> {db_contract.status}",
        )
    else:
        create_timeline(
            db=db,
            operation_type="update",
            status=db_contract.status,
            contract_id=db_contract.id,
            remark="更新合同信息",
        )

    return db_contract


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    db.delete(db_contract)
    db.commit()

    return None


@router.post("/{contract_id}/attachments", response_model=ContractAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    contract_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Query(None),
    is_contract: bool = Query(False),
    uploaded_by: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制 {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB")

    upload_dir = ensure_upload_dir()
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    attachment_data = ContractAttachmentCreate(
        contract_id=contract_id,
        file_name=file.filename or unique_filename,
        file_path=file_path,
        file_size=file.size,
        file_type=file.content_type,
        category=category,
        is_contract=is_contract,
    )

    db_attachment = ContractAttachment(**attachment_data.model_dump(), uploaded_by=uploaded_by)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)

    create_timeline(
        db=db,
        operation_type="upload",
        status=db_contract.status,
        contract_id=contract_id,
        remark=f"上传附件: {file.filename}",
    )

    return db_attachment


@router.get("/{contract_id}/attachments", response_model=List[ContractAttachmentResponse])
def get_contract_attachments(
    contract_id: int,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    query = db.query(ContractAttachment).filter(ContractAttachment.contract_id == contract_id)
    if category:
        query = query.filter(ContractAttachment.category == category)

    return query.order_by(ContractAttachment.created_at.desc()).all()


@router.get("/{contract_id}/attachments/{attachment_id}/download")
def download_attachment(
    contract_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
):
    from fastapi.responses import FileResponse

    db_attachment = (
        db.query(ContractAttachment)
        .filter(
            and_(
                ContractAttachment.id == attachment_id,
                ContractAttachment.contract_id == contract_id,
            )
        )
        .first()
    )
    if not db_attachment:
        raise HTTPException(status_code=404, detail="附件不存在")

    if not os.path.exists(db_attachment.file_path):
        raise HTTPException(status_code=404, detail="文件已被删除")

    return FileResponse(
        path=db_attachment.file_path,
        filename=db_attachment.file_name,
        media_type=db_attachment.file_type or "application/octet-stream",
    )


@router.delete("/{contract_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    contract_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
):
    db_attachment = (
        db.query(ContractAttachment)
        .filter(
            and_(
                ContractAttachment.id == attachment_id,
                ContractAttachment.contract_id == contract_id,
            )
        )
        .first()
    )
    if not db_attachment:
        raise HTTPException(status_code=404, detail="附件不存在")

    if os.path.exists(db_attachment.file_path):
        os.remove(db_attachment.file_path)

    db.delete(db_attachment)
    db.commit()

    return None
