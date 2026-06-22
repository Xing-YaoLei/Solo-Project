import os
import uuid
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import (
    Vendor,
    SupplierMaterial,
    User,
    UserRole,
    MaterialStatus,
)
from app.schemas import (
    VendorCreate,
    VendorUpdate,
    VendorResponse,
    VendorListResponse,
    SupplierMaterialResponse,
    SupplierMaterialListResponse,
    SupplierMaterialUpdate,
)
from app.api.routers.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/vendors", tags=["供应商管理"])


@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    vendor = Vendor(**vendor_in.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("", response_model=VendorListResponse)
def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vendor)
    if keyword:
        query = query.filter(
            Vendor.name.contains(keyword) | Vendor.contact.contains(keyword) | Vendor.email.contains(keyword)
        )
    total = query.count()
    items = query.order_by(Vendor.created_at.desc()).offset(skip).limit(limit).all()
    return VendorListResponse(total=total, items=items)


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return vendor


@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor_in: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="供应商不存在")

    update_data = vendor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)

    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="供应商不存在")

    db.delete(vendor)
    db.commit()


@router.post("/{vendor_id}/materials", response_model=SupplierMaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    vendor_id: int,
    material_type: str = Form(...),
    material_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR, UserRole.VENDOR))
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="供应商不存在")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    material = SupplierMaterial(
        vendor_id=vendor_id,
        material_type=material_type,
        material_name=material_name,
        uploaded_by=current_user.username,
        file_path=file_path,
        status=MaterialStatus.PENDING
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/{vendor_id}/materials", response_model=SupplierMaterialListResponse)
def list_vendor_materials(
    vendor_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    material_type: Optional[str] = None,
    status: Optional[MaterialStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="供应商不存在")

    query = db.query(SupplierMaterial).filter(SupplierMaterial.vendor_id == vendor_id)
    if material_type:
        query = query.filter(SupplierMaterial.material_type == material_type)
    if status:
        query = query.filter(SupplierMaterial.status == status)

    total = query.count()
    items = query.order_by(SupplierMaterial.upload_date.desc()).offset(skip).limit(limit).all()
    return SupplierMaterialListResponse(total=total, items=items)


@router.get("/materials/{material_id}", response_model=SupplierMaterialResponse)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(SupplierMaterial).filter(SupplierMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="材料不存在")
    return material


@router.get("/materials/{material_id}/download")
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(SupplierMaterial).filter(SupplierMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="材料不存在")

    file_path = material.file_path
    file_ext = os.path.splitext(file_path)[1] if file_path else ".txt"

    if not file_path or not os.path.exists(file_path):
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext or ".txt", mode="w", encoding="utf-8")
        temp_file.write(f"材料名称: {material.material_name}\n")
        temp_file.write(f"材料类型: {material.material_type}\n")
        temp_file.write(f"上传时间: {material.upload_date}\n")
        temp_file.write(f"状态: {material.status.value if hasattr(material.status, 'value') else material.status}\n")
        temp_file.write("\n(注意: 原始文件已丢失，此为占位内容)\n")
        temp_file.close()
        file_path = temp_file.name
        file_ext = os.path.splitext(temp_file.name)[1]

    return FileResponse(
        path=file_path,
        filename=material.material_name + (file_ext or ".txt"),
        media_type="application/octet-stream"
    )


@router.put("/materials/{material_id}", response_model=SupplierMaterialResponse)
def update_material(
    material_id: int,
    material_in: SupplierMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR))
):
    material = db.query(SupplierMaterial).filter(SupplierMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="材料不存在")

    update_data = material_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)

    db.commit()
    db.refresh(material)
    return material


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    material = db.query(SupplierMaterial).filter(SupplierMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="材料不存在")

    if os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception:
            pass

    db.delete(material)
    db.commit()
