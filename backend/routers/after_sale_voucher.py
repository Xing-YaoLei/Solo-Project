from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    AfterSaleVoucherCreate,
    AfterSaleVoucherUpdate,
    AfterSaleVoucherResponse,
    PageResponse,
    ApiResponse,
)
from services.status_log_service import StatusLogService
from models.after_sale_voucher import AfterSaleVoucher
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/after-sale-vouchers", tags=["售后凭证"])


@router.get("", response_model=ApiResponse[PageResponse[AfterSaleVoucherResponse]])
def list_after_sale_vouchers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    pickup_code_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(AfterSaleVoucher)
    if keyword:
        query = query.filter(
            (AfterSaleVoucher.voucher_no.ilike(f"%{keyword}%"))
            | (AfterSaleVoucher.applicant_phone.ilike(f"%{keyword}%"))
        )
    if status:
        query = query.filter(AfterSaleVoucher.status == status)
    if type:
        query = query.filter(AfterSaleVoucher.type == type)
    if pickup_code_id:
        query = query.filter(AfterSaleVoucher.pickup_code_id == pickup_code_id)
    total = query.count()
    items = query.order_by(AfterSaleVoucher.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{voucher_id}", response_model=ApiResponse[AfterSaleVoucherResponse])
def get_after_sale_voucher(voucher_id: int, db: Session = Depends(get_db)):
    voucher = db.query(AfterSaleVoucher).filter(AfterSaleVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="售后凭证不存在")
    return ApiResponse.success(voucher)


@router.post("", response_model=ApiResponse[AfterSaleVoucherResponse])
def create_after_sale_voucher(data: AfterSaleVoucherCreate, db: Session = Depends(get_db)):
    voucher = AfterSaleVoucher(**data.model_dump(exclude_unset=True))
    if not voucher.apply_time:
        voucher.apply_time = datetime.now()
    db.add(voucher)
    db.flush()
    StatusLogService.create_log(
        db=db,
        related_type="after_sale",
        related_id=voucher.id,
        old_status=None,
        new_status=voucher.status,
        change_reason="创建售后凭证",
        operator=data.processor,
    )
    db.commit()
    return ApiResponse.success(voucher, message="创建成功")


@router.put("/{voucher_id}", response_model=ApiResponse[AfterSaleVoucherResponse])
def update_after_sale_voucher(
    voucher_id: int, data: AfterSaleVoucherUpdate, db: Session = Depends(get_db)
):
    voucher = db.query(AfterSaleVoucher).filter(AfterSaleVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="售后凭证不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(voucher, key, value)
    if "status" in update_data:
        old_status = None
        for attr, val in vars(voucher).items():
            if attr == "status" and val != update_data["status"]:
                old_status = val
                break
        if old_status and old_status != update_data["status"]:
            StatusLogService.create_log(
                db=db,
                related_type="after_sale",
                related_id=voucher.id,
                old_status=old_status,
                new_status=update_data["status"],
                change_reason="更新售后状态",
                operator=data.processor,
            )
    db.commit()
    return ApiResponse.success(voucher, message="更新成功")


@router.delete("/{voucher_id}", response_model=ApiResponse[bool])
def delete_after_sale_voucher(voucher_id: int, db: Session = Depends(get_db)):
    voucher = db.query(AfterSaleVoucher).filter(AfterSaleVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="售后凭证不存在")
    db.delete(voucher)
    db.commit()
    return ApiResponse.success(True, message="删除成功")
