from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


@router.get("", response_model=schemas.PaginatedResponse)
def list_address_dict(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.AddressDict)
    
    if keyword:
        query = query.filter(
            models.AddressDict.name.contains(keyword) | 
            models.AddressDict.address.contains(keyword)
        )
    if area:
        query = query.filter(models.AddressDict.area == area)
    if is_active is not None:
        query = query.filter(models.AddressDict.is_active == is_active)
    
    total = query.count()
    items = query.order_by(models.AddressDict.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return paginated_response(items, total, page, page_size)


@router.get("/{addr_id}", response_model=schemas.ResponseModel)
def get_address_dict(addr_id: int, db: Session = Depends(get_db)):
    addr = db.query(models.AddressDict).filter(models.AddressDict.id == addr_id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="地址不存在")
    return success_response(addr)


@router.post("", response_model=schemas.ResponseModel)
def create_address_dict(addr_in: schemas.AddressDictCreate, db: Session = Depends(get_db)):
    addr = models.AddressDict(**addr_in.model_dump())
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return success_response(addr)


@router.put("/{addr_id}", response_model=schemas.ResponseModel)
def update_address_dict(
    addr_id: int,
    addr_in: schemas.AddressDictUpdate,
    db: Session = Depends(get_db)
):
    addr = db.query(models.AddressDict).filter(models.AddressDict.id == addr_id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="地址不存在")
    
    update_data = addr_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(addr, key, value)
    
    addr.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(addr)
    return success_response(addr)


@router.delete("/{addr_id}", response_model=schemas.ResponseModel)
def delete_address_dict(addr_id: int, db: Session = Depends(get_db)):
    addr = db.query(models.AddressDict).filter(models.AddressDict.id == addr_id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="地址不存在")
    
    addr.is_active = False
    addr.updated_at = datetime.utcnow()
    db.commit()
    return success_response({"message": "删除成功"})


@router.get("/options/list", response_model=schemas.ResponseModel)
def get_address_options(
    area: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.AddressDict).filter(models.AddressDict.is_active == True)
    if area:
        query = query.filter(models.AddressDict.area == area)
    
    items = query.order_by(models.AddressDict.name).all()
    return success_response(items)


@router.get("/areas/list", response_model=schemas.ResponseModel)
def get_areas(db: Session = Depends(get_db)):
    areas = db.query(models.AddressDict.area)\
        .filter(models.AddressDict.area.isnot(None))\
        .filter(models.AddressDict.is_active == True)\
        .distinct()\
        .all()
    area_list = [a[0] for a in areas if a[0]]
    return success_response(area_list)
