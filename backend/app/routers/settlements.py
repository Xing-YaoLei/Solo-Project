from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


def generate_settlement_no():
    return f"ST{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


@router.get("", response_model=schemas.PaginatedResponse)
def list_settlements(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Settlement).join(models.Order, models.Settlement.order_id == models.Order.id)
    
    if status:
        query = query.filter(models.Settlement.status == status)
    if keyword:
        query = query.filter(
            models.Settlement.settlement_no.contains(keyword) |
            models.Order.order_no.contains(keyword)
        )
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if start_date:
        query = query.filter(models.Settlement.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Settlement.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    
    from ..utils.response import orm_to_dict
    
    total = query.count()
    settlements = query.order_by(models.Settlement.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    result = []
    for st in settlements:
        st_dict = orm_to_dict(st)
        if st.order:
            st_dict["order_no"] = st.order.order_no
        result.append(st_dict)
    
    return paginated_response(result, total, page, page_size)


@router.get("/{settlement_id}", response_model=schemas.ResponseModel)
def get_settlement(settlement_id: int, db: Session = Depends(get_db)):
    from ..utils.response import orm_to_dict
    
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="结算不存在")
    
    st_dict = orm_to_dict(settlement)
    if settlement.order:
        st_dict["order_no"] = settlement.order.order_no
    
    return success_response(st_dict)


@router.post("", response_model=schemas.ResponseModel)
def create_settlement(settlement_in: schemas.SettlementCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == settlement_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    detail = []
    
    if order.base_fee > 0:
        detail.append({"type": "base", "name": "基础配送费", "amount": order.base_fee})
    if order.distance_fee > 0:
        detail.append({"type": "distance", "name": "距离加价", "amount": order.distance_fee})
    if order.weight_fee > 0:
        detail.append({"type": "weight", "name": "重量加价", "amount": order.weight_fee})
    if order.subsidy_fee > 0:
        detail.append({"type": "subsidy", "name": "补贴", "amount": order.subsidy_fee})
    
    total_income = order.total_fee
    rider_income = order.rider_income
    platform_income = order.platform_profit
    
    settlement = models.Settlement(
        order_id=settlement_in.order_id,
        settlement_no=generate_settlement_no(),
        base_fee=order.base_fee,
        distance_fee=order.distance_fee,
        weight_fee=order.weight_fee,
        subsidy_fee=order.subsidy_fee,
        appeal_compensation=0,
        penalty_fee=0,
        bonus_fee=0,
        total_income=total_income,
        rider_income=rider_income,
        platform_income=platform_income,
        detail=detail,
        remark=settlement_in.remark,
        status="pending"
    )
    
    db.add(settlement)
    db.flush()
    
    old_status = order.status
    order.status = models.OrderStatus.SETTLED
    
    from .orders import add_status_log
    add_status_log(
        db, order.id, old_status.value, models.OrderStatus.SETTLED.value,
        operator_type="system", operator_name="系统",
        reason="订单结算",
        remark=settlement_in.remark,
        extra_data={"settlement_id": settlement.id, "settlement_no": settlement.settlement_no}
    )
    
    db.commit()
    db.refresh(settlement)
    
    return success_response(settlement)


@router.put("/{settlement_id}", response_model=schemas.ResponseModel)
def update_settlement(
    settlement_id: int,
    settlement_in: schemas.SettlementUpdate,
    db: Session = Depends(get_db)
):
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="结算不存在")
    
    update_data = settlement_in.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"] == "confirmed":
        settlement.confirmed_at = datetime.utcnow()
        if "confirmed_by" not in update_data:
            settlement.confirmed_by = "管理员"
    
    for key, value in update_data.items():
        setattr(settlement, key, value)
    
    detail = settlement.detail or []
    
    if "appeal_compensation" in update_data:
        total_income = settlement.base_fee + settlement.distance_fee + settlement.weight_fee + settlement.subsidy_fee
        settlement.total_income = total_income - settlement.appeal_compensation
        settlement.platform_income = settlement.total_income - settlement.rider_income
    
    settlement.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settlement)
    
    return success_response(settlement)


@router.post("/{settlement_id}/confirm", response_model=schemas.ResponseModel)
def confirm_settlement(settlement_id: int, confirmed_by: str = "管理员", db: Session = Depends(get_db)):
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="结算不存在")
    
    settlement.status = "confirmed"
    settlement.confirmed_by = confirmed_by
    settlement.confirmed_at = datetime.utcnow()
    settlement.updated_at = datetime.utcnow()
    db.commit()
    
    return success_response({"message": "结算确认成功"})


@router.get("/summary/total", response_model=schemas.ResponseModel)
def get_settlement_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    area: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Settlement).join(models.Order, models.Settlement.order_id == models.Order.id)
    
    if start_date:
        query = query.filter(models.Settlement.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Settlement.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    
    settlements = query.all()
    
    total_income = sum(s.total_income for s in settlements)
    total_rider_income = sum(s.rider_income for s in settlements)
    total_platform_income = sum(s.platform_income for s in settlements)
    total_compensation = sum(s.appeal_compensation for s in settlements)
    total_count = len(settlements)
    
    return success_response({
        "total_count": total_count,
        "total_income": round(total_income, 2),
        "total_rider_income": round(total_rider_income, 2),
        "total_platform_income": round(total_platform_income, 2),
        "total_compensation": round(total_compensation, 2),
    })
