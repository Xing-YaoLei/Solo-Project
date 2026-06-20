from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


@router.get("", response_model=schemas.PaginatedResponse)
def list_appeals(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    appeal_type: Optional[str] = None,
    appellant: Optional[str] = None,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Appeal).join(models.Order, models.Appeal.order_id == models.Order.id)
    
    if status:
        query = query.filter(models.Appeal.status == status)
    if appeal_type:
        query = query.filter(models.Appeal.appeal_type == appeal_type)
    if appellant:
        query = query.filter(models.Appeal.appellant == appellant)
    if keyword:
        query = query.filter(
            models.Order.order_no.contains(keyword) |
            models.Appeal.description.contains(keyword)
        )
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if handler:
        query = query.filter(models.Appeal.handler == handler)
    if start_date:
        query = query.filter(models.Appeal.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Appeal.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    
    from ..utils.response import orm_to_dict
    
    total = query.count()
    appeals = query.order_by(models.Appeal.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    result = []
    for appeal in appeals:
        appeal_dict = orm_to_dict(appeal)
        if appeal.order:
            appeal_dict["order_no"] = appeal.order.order_no
        result.append(appeal_dict)
    
    return paginated_response(result, total, page, page_size)


@router.get("/{appeal_id}", response_model=schemas.ResponseModel)
def get_appeal(appeal_id: int, db: Session = Depends(get_db)):
    from ..utils.response import orm_to_dict
    
    appeal = db.query(models.Appeal).filter(models.Appeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    appeal_dict = orm_to_dict(appeal)
    if appeal.order:
        appeal_dict["order_no"] = appeal.order.order_no
    
    return success_response(appeal_dict)


@router.post("", response_model=schemas.ResponseModel)
def create_appeal(appeal_in: schemas.AppealCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == appeal_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    appeal = models.Appeal(**appeal_in.model_dump())
    db.add(appeal)
    db.flush()
    
    old_status = order.status
    order.status = models.OrderStatus.APPEALED
    
    from .orders import add_status_log
    add_status_log(
        db, order.id, old_status.value, models.OrderStatus.APPEALED.value,
        operator_type=appeal_in.appellant, operator_name=appeal_in.appellant_name,
        reason="发起申诉",
        remark=appeal_in.description,
        extra_data={"appeal_id": appeal.id, "appeal_type": appeal_in.appeal_type}
    )
    
    db.commit()
    db.refresh(appeal)
    
    return success_response(appeal)


@router.put("/{appeal_id}", response_model=schemas.ResponseModel)
def update_appeal(
    appeal_id: int,
    appeal_in: schemas.AppealUpdate,
    db: Session = Depends(get_db)
):
    appeal = db.query(models.Appeal).filter(models.Appeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    update_data = appeal_in.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"] in ["resolved", "rejected"]:
        appeal.handle_time = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(appeal, key, value)
    
    appeal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(appeal)
    
    return success_response(appeal)


@router.post("/evidence", response_model=schemas.ResponseModel)
def add_evidence(evidence_req: schemas.EvidenceAddRequest, db: Session = Depends(get_db)):
    appeal = db.query(models.Appeal).filter(models.Appeal.id == evidence_req.appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    evidence_list = appeal.evidence or []
    evidence_list.append({
        "type": evidence_req.evidence_type,
        "url": evidence_req.evidence_url,
        "name": evidence_req.evidence_name or "证据文件"
    })
    
    appeal.evidence = evidence_list
    appeal.updated_at = datetime.utcnow()
    db.commit()
    
    return success_response({"message": "证据添加成功"})


@router.delete("/{appeal_id}/evidence/{index}", response_model=schemas.ResponseModel)
def remove_evidence(appeal_id: int, index: int, db: Session = Depends(get_db)):
    appeal = db.query(models.Appeal).filter(models.Appeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    evidence_list = appeal.evidence or []
    if 0 <= index < len(evidence_list):
        evidence_list.pop(index)
        appeal.evidence = evidence_list
        appeal.updated_at = datetime.utcnow()
        db.commit()
    
    return success_response({"message": "证据删除成功"})
