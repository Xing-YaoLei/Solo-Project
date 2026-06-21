from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


def generate_order_no():
    return f"ED{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


def calculate_order_fee(order: models.Order, db: Session):
    base_fee = 5.0
    
    distance_fee = 0
    if order.distance and order.distance > 1000:
        extra_km = (order.distance - 1000) / 1000
        distance_fee = round(extra_km * 2, 2)
    
    weight_fee = 0
    if order.goods_weight and order.goods_weight > 5:
        extra_kg = order.goods_weight - 5
        weight_fee = round(extra_kg * 1, 2)
    
    subsidy_fee = 0
    subsidy_rules = db.query(models.SubsidyRule).filter(
        models.SubsidyRule.is_active == True
    ).order_by(models.SubsidyRule.priority.desc()).all()
    
    for rule in subsidy_rules:
        if rule.rule_type == "distance" and order.distance and order.distance >= rule.threshold:
            if rule.subsidy_unit == "yuan":
                subsidy_fee += rule.subsidy_amount
            else:
                subsidy_fee += base_fee * rule.subsidy_amount / 100
        elif rule.rule_type == "weight" and order.goods_weight and order.goods_weight >= rule.threshold:
            if rule.subsidy_unit == "yuan":
                subsidy_fee += rule.subsidy_amount
            else:
                subsidy_fee += base_fee * rule.subsidy_amount / 100
    
    total_fee = base_fee + distance_fee + weight_fee + subsidy_fee
    
    rider_income = round(total_fee * 0.8, 2)
    platform_profit = round(total_fee - rider_income, 2)
    
    order.base_fee = base_fee
    order.distance_fee = distance_fee
    order.weight_fee = weight_fee
    order.subsidy_fee = round(subsidy_fee, 2)
    order.total_fee = round(total_fee, 2)
    order.rider_income = rider_income
    order.platform_profit = platform_profit


def add_status_log(db: Session, order_id: int, from_status: Optional[str], to_status: str,
                   operator_type: str = "system", operator_id: Optional[int] = None,
                   operator_name: Optional[str] = None, reason: Optional[str] = None,
                   remark: Optional[str] = None, extra_data: Optional[dict] = None):
    log = models.OrderStatusLog(
        order_id=order_id,
        from_status=from_status,
        to_status=to_status,
        operator_type=operator_type,
        operator_id=operator_id,
        operator_name=operator_name,
        reason=reason,
        remark=remark,
        extra_data=extra_data
    )
    db.add(log)
    db.flush()


@router.get("", response_model=schemas.PaginatedResponse)
def list_orders(
    page: int = 1,
    page_size: int = 20,
    status: Optional[schemas.OrderStatus] = None,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    rider_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Order)
    
    if status:
        query = query.filter(models.Order.status == status)
    if keyword:
        query = query.filter(
            models.Order.order_no.contains(keyword) |
            models.Order.pickup_address.contains(keyword) |
            models.Order.delivery_address.contains(keyword)
        )
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if rider_id:
        query = query.filter(models.Order.rider_id == rider_id)
    if handler:
        query = query.join(
            models.OrderRejectRecord,
            models.OrderRejectRecord.order_id == models.Order.id
        ).filter(
            models.OrderRejectRecord.handler == handler
        )
    if start_date:
        query = query.filter(models.Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Order.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    
    from ..utils.response import orm_to_dict
    
    total = query.count()
    items = query.order_by(models.Order.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    result = []
    for order in items:
        order_dict = orm_to_dict(order)
        if order.rider:
            order_dict["rider_name"] = order.rider.name
        reject_handlers = db.query(models.OrderRejectRecord.handler).filter(
            models.OrderRejectRecord.order_id == order.id,
            models.OrderRejectRecord.handler.isnot(None)
        ).distinct().all()
        order_dict["handlers"] = [h[0] for h in reject_handlers]
        result.append(order_dict)
    
    return paginated_response(result, total, page, page_size)


@router.get("/{order_id}", response_model=schemas.ResponseModel)
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    from ..utils.response import orm_to_dict
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order_dict = orm_to_dict(order)
    if order.rider:
        order_dict["rider_name"] = order.rider.name
    
    order_dict["status_logs"] = orm_to_dict(order.status_logs)
    order_dict["appeals"] = orm_to_dict(order.appeals)
    order_dict["settlements"] = orm_to_dict(order.settlements)
    
    reject_records = db.query(models.OrderRejectRecord).filter(
        models.OrderRejectRecord.order_id == order_id
    ).order_by(models.OrderRejectRecord.id.desc()).all()
    
    reject_list = []
    handler_names = set()
    reminded_count = 0
    for record in reject_records:
        r_dict = orm_to_dict(record)
        if record.rider:
            r_dict["rider_name"] = record.rider.name
        reject_list.append(r_dict)
        if record.handler:
            handler_names.add(record.handler)
        if record.is_reminded:
            reminded_count += 1
    
    order_dict["reject_records"] = reject_list
    order_dict["reject_summary"] = {
        "total": len(reject_records),
        "reminded_count": reminded_count,
        "handlers": list(handler_names),
    }
    
    return success_response(order_dict)


@router.get("/meta/handlers", response_model=schemas.ResponseModel)
def get_handler_options(db: Session = Depends(get_db)):
    records = db.query(models.OrderRejectRecord.handler).filter(
        models.OrderRejectRecord.handler.isnot(None)
    ).distinct().all()
    default_handlers = ["骑手管理组", "运营组", "商家运营", "客服组", "综合处理组"]
    existing = [r[0] for r in records if r[0]]
    merged = list(dict.fromkeys(default_handlers + existing))
    return success_response(merged)


@router.post("", response_model=schemas.ResponseModel)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    order = models.Order(
        **order_in.model_dump(),
        order_no=generate_order_no(),
        status=models.OrderStatus.PENDING
    )
    
    calculate_order_fee(order, db)
    
    db.add(order)
    db.flush()
    
    add_status_log(
        db, order.id, None, models.OrderStatus.PENDING.value,
        operator_type="system", operator_name="系统",
        reason="订单创建"
    )
    
    db.commit()
    db.refresh(order)
    
    return success_response(order)


@router.put("/{order_id}", response_model=schemas.ResponseModel)
def update_order(order_id: int, order_in: schemas.OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    old_status = order.status
    update_data = order_in.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"] != old_status:
        new_status = update_data["status"]
        add_status_log(
            db, order.id, old_status.value, new_status.value,
            operator_type="admin", operator_name="管理员",
            reason="状态更新"
        )
        
        if new_status == models.OrderStatus.COMPLETED:
            order.complete_time = datetime.utcnow()
    
    for key, value in update_data.items():
        if key != "status":
            setattr(order, key, value)
        else:
            setattr(order, key, value)
    
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    
    return success_response(order)


@router.post("/{order_id}/assign", response_model=schemas.ResponseModel)
def assign_order(order_id: int, rider_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    rider = db.query(models.Rider).filter(models.Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="骑手不存在")
    
    old_status = order.status
    order.rider_id = rider_id
    order.assign_time = datetime.utcnow()
    order.status = models.OrderStatus.ACCEPTED
    
    add_status_log(
        db, order.id, old_status.value, models.OrderStatus.ACCEPTED.value,
        operator_type="admin", operator_name="管理员",
        reason=f"分派给骑手: {rider.name}"
    )
    
    rider.total_orders += 1
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    
    return success_response(order)


@router.post("/reject", response_model=schemas.ResponseModel)
def reject_order(reject_req: schemas.OrderRejectRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == reject_req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    rider = db.query(models.Rider).filter(models.Rider.id == reject_req.rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="骑手不存在")
    
    responsibility = "rider"
    if reject_req.reject_reason == models.RejectReason.SYSTEM_FAULT:
        responsibility = "platform"
    elif reject_req.reject_reason == models.RejectReason.MERCHANT_FAULT:
        responsibility = "merchant"
    elif reject_req.reject_reason == models.RejectReason.CUSTOMER_FAULT:
        responsibility = "customer"
    
    handler_map = {
        "rider": "骑手管理组",
        "platform": "运营组",
        "merchant": "商家运营",
        "customer": "客服组",
        "other": "综合处理组",
    }
    handler = handler_map.get(responsibility, "综合处理组")
    
    reject_record = models.OrderRejectRecord(
        order_id=reject_req.order_id,
        rider_id=reject_req.rider_id,
        reject_reason=reject_req.reject_reason,
        reject_detail=reject_req.reject_detail,
        responsibility=responsibility,
        is_reminded=True,
        reminded_at=datetime.utcnow(),
        handler=handler
    )
    db.add(reject_record)
    
    old_status = order.status
    order.reject_count += 1
    order.last_reject_reason = reject_req.reject_detail
    order.last_reject_time = datetime.utcnow()
    order.status = models.OrderStatus.REJECTED
    order.rider_id = None
    order.assign_time = None
    
    add_status_log(
        db, order.id, old_status.value, models.OrderStatus.REJECTED.value,
        operator_type="rider", operator_id=rider.id, operator_name=rider.name,
        reason=f"拒单: {reject_req.reject_reason.value}",
        remark=reject_req.reject_detail,
        extra_data={"responsibility": responsibility, "handler": handler, "reminded": True}
    )
    
    rider.reject_count += 1
    order.updated_at = datetime.utcnow()
    db.commit()
    
    try:
        from ..celery.tasks import handle_order_reject
        handle_order_reject.delay(order.id, responsibility)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Celery任务发送失败，已同步处理: {e}")
    
    return success_response({
        "message": "拒单成功",
        "responsibility": responsibility,
        "handler": handler,
        "is_reminded": True
    })


@router.post("/supplement", response_model=schemas.ResponseModel)
def supplement_order(supplement_req: schemas.OrderSupplementRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == supplement_req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    add_status_log(
        db, order.id, order.status.value, order.status.value,
        operator_type="admin", operator_name=supplement_req.operator_name,
        reason="补录信息",
        remark=supplement_req.remark,
        extra_data={
            "field_name": supplement_req.field_name,
            "field_value": supplement_req.field_value
        }
    )
    
    if hasattr(order, supplement_req.field_name):
        setattr(order, supplement_req.field_name, supplement_req.field_value)
    
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return success_response({"message": "补录成功"})


@router.post("/{order_id}/close", response_model=schemas.ResponseModel)
def close_order(order_id: int, reason: str, operator_name: str = "管理员", db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    old_status = order.status
    order.status = models.OrderStatus.CANCELLED
    
    add_status_log(
        db, order.id, old_status.value, models.OrderStatus.CANCELLED.value,
        operator_type="admin", operator_name=operator_name,
        reason="订单关闭",
        remark=reason
    )
    
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return success_response({"message": "订单已关闭"})


@router.get("/status/count", response_model=schemas.ResponseModel)
def get_order_status_count(db: Session = Depends(get_db)):
    statuses = [
        schemas.OrderStatus.PENDING,
        schemas.OrderStatus.ACCEPTED,
        schemas.OrderStatus.PICKED,
        schemas.OrderStatus.DELIVERING,
        schemas.OrderStatus.DELIVERED,
        schemas.OrderStatus.COMPLETED,
        schemas.OrderStatus.REJECTED,
        schemas.OrderStatus.APPEALED,
        schemas.OrderStatus.CANCELLED,
    ]
    
    counts = {}
    for status in statuses:
        count = db.query(models.Order).filter(models.Order.status == status).count()
        counts[status.value] = count
    
    return success_response(counts)
