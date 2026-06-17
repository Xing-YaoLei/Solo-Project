from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os
import shutil
import uuid

from app.db.session import get_db
from app import schemas, models
from app.core.config import settings

router = APIRouter(tags=["记录管理"])


@router.get("/stores", response_model=List[schemas.Store])
def list_stores(
    region: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Store)
    if region:
        query = query.filter(models.Store.region == region)
    if city:
        query = query.filter(models.Store.city == city)
    return query.order_by(models.Store.store_code).all()


@router.get("/promotions", response_model=List[schemas.Promotion])
def list_promotions(
    store_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Promotion)
    if store_id:
        query = query.filter(models.Promotion.store_id == store_id)
    if start_date:
        query = query.filter(models.Promotion.end_date >= start_date)
    if end_date:
        query = query.filter(models.Promotion.start_date <= end_date)
    return query.order_by(models.Promotion.start_date.desc()).all()


@router.get("/rectifications", response_model=List[schemas.Rectification])
def list_rectifications(
    promotion_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Rectification)
    if promotion_id:
        query = query.filter(models.Rectification.promotion_id == promotion_id)
    if status:
        query = query.filter(models.Rectification.rectification_status == status)
    return query.order_by(models.Rectification.require_rectification_date.desc()).all()


@router.post("/rectifications", response_model=schemas.Rectification)
def create_rectification(
    payload: schemas.RectificationCreate,
    db: Session = Depends(get_db),
):
    rect = models.Rectification(**payload.model_dump())
    db.add(rect)
    db.commit()
    db.refresh(rect)
    return rect


@router.put("/rectifications/{rect_id}", response_model=schemas.Rectification)
def update_rectification(
    rect_id: int,
    payload: schemas.RectificationCreate,
    db: Session = Depends(get_db),
):
    rect = (
        db.query(models.Rectification)
        .filter(models.Rectification.id == rect_id)
        .first()
    )
    if not rect:
        raise HTTPException(status_code=404, detail="整改记录不存在")

    for key, value in payload.model_dump().items():
        setattr(rect, key, value)
    db.commit()
    db.refresh(rect)
    return rect


@router.get("/inspections", response_model=List[schemas.DisplayInspection])
def list_inspections(
    promotion_id: Optional[int] = Query(None),
    store_id: Optional[int] = Query(None),
    is_qualified: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.DisplayInspection)
    if promotion_id:
        query = query.filter(models.DisplayInspection.promotion_id == promotion_id)
    if store_id:
        query = query.filter(models.DisplayInspection.store_id == store_id)
    if is_qualified is not None:
        query = query.filter(models.DisplayInspection.is_qualified == is_qualified)
    inspections = query.order_by(
        models.DisplayInspection.inspection_date.desc()
    ).all()

    results = []
    for ins in inspections:
        photos = (
            db.query(models.DisplayPhoto)
            .filter(models.DisplayPhoto.inspection_id == ins.id)
            .all()
        )
        results.append(
            schemas.DisplayInspection(
                id=ins.id,
                promotion_id=ins.promotion_id,
                store_id=ins.store_id,
                inspection_date=ins.inspection_date,
                is_qualified=ins.is_qualified,
                position_score=ins.position_score,
                pop_score=ins.pop_score,
                price_score=ins.price_score,
                stock_score=ins.stock_score,
                overall_score=ins.overall_score,
                inspector=ins.inspector,
                remark=ins.remark,
                photos=[
                    schemas.DisplayPhotoInfo(
                        id=p.id,
                        file_path=p.file_path,
                        file_name=p.file_name,
                        upload_by=p.upload_by,
                        photo_type=p.photo_type,
                        created_at=p.created_at,
                    )
                    for p in photos
                ],
                created_at=ins.created_at,
                updated_at=ins.updated_at,
            )
        )
    return results


@router.post("/inspections", response_model=schemas.DisplayInspection)
def create_inspection(
    payload: schemas.DisplayInspectionCreate,
    db: Session = Depends(get_db),
):
    ins = models.DisplayInspection(**payload.model_dump())
    db.add(ins)
    db.commit()
    db.refresh(ins)
    return schemas.DisplayInspection(
        id=ins.id,
        promotion_id=ins.promotion_id,
        store_id=ins.store_id,
        inspection_date=ins.inspection_date,
        is_qualified=ins.is_qualified,
        position_score=ins.position_score,
        pop_score=ins.pop_score,
        price_score=ins.price_score,
        stock_score=ins.stock_score,
        overall_score=ins.overall_score,
        inspector=ins.inspector,
        remark=ins.remark,
        photos=[],
        created_at=ins.created_at,
        updated_at=ins.updated_at,
    )


@router.post("/inspections/{inspection_id}/photos", response_model=schemas.DisplayPhotoInfo)
def upload_inspection_photo(
    inspection_id: int,
    file: UploadFile = File(...),
    upload_by: str = Form(...),
    photo_type: str = Form("display"),
    db: Session = Depends(get_db),
):
    ins = (
        db.query(models.DisplayInspection)
        .filter(models.DisplayInspection.id == inspection_id)
        .first()
    )
    if not ins:
        raise HTTPException(status_code=404, detail="巡检记录不存在")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    photo = models.DisplayPhoto(
        inspection_id=inspection_id,
        file_path=file_path,
        file_name=file.filename or unique_name,
        upload_by=upload_by,
        photo_type=photo_type,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return schemas.DisplayPhotoInfo(
        id=photo.id,
        file_path=photo.file_path,
        file_name=photo.file_name,
        upload_by=photo.upload_by,
        photo_type=photo.photo_type,
        created_at=photo.created_at,
    )


@router.get("/annotations", response_model=List[schemas.ExceptionAnnotation])
def list_annotations(
    promotion_id: Optional[int] = Query(None),
    exception_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.ExceptionAnnotation)
    if promotion_id:
        query = query.filter(models.ExceptionAnnotation.promotion_id == promotion_id)
    if exception_type:
        query = query.filter(models.ExceptionAnnotation.exception_type == exception_type)
    return query.order_by(models.ExceptionAnnotation.annotation_date.desc()).all()


@router.post("/annotations", response_model=schemas.ExceptionAnnotation)
def create_annotation(
    payload: schemas.ExceptionAnnotationCreate,
    db: Session = Depends(get_db),
):
    ann = models.ExceptionAnnotation(**payload.model_dump())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.put("/annotations/{ann_id}", response_model=schemas.ExceptionAnnotation)
def update_annotation(
    ann_id: int,
    review_note: str = Form(...),
    review_by: str = Form(...),
    db: Session = Depends(get_db),
):
    ann = (
        db.query(models.ExceptionAnnotation)
        .filter(models.ExceptionAnnotation.id == ann_id)
        .first()
    )
    if not ann:
        raise HTTPException(status_code=404, detail="异常标注不存在")
    ann.review_note = review_note
    ann.review_by = review_by
    db.commit()
    db.refresh(ann)
    return ann


@router.get("/refresh-logs", response_model=List[schemas.RefreshLogInfo])
def list_refresh_logs(
    limit: int = Query(20),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.RefreshLog)
        .order_by(models.RefreshLog.started_at.desc())
        .limit(limit)
        .all()
    )
