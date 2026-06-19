from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from ..core.database import get_db
from ..services import (
    PackageService, PriceRuleService, StayDateService,
    InventoryService, OrderService, VerificationService,
    DepositService, AnomalyService, AnalyticsService
)
from ..schemas import (
    PackageCreate, PackageUpdate, PackageOut, PackageListOut,
    PriceRuleCreate, PriceRuleUpdate, PriceRuleOut,
    StayDateCreate, StayDateUpdate, StayDateOut,
    PackageInventoryCreate, PackageInventoryUpdate, PackageInventoryOut,
    OrderCreate, OrderUpdate, OrderOut, OrderListOut, OrderStatusChange,
    OrderDetailOut, OrderStatusLogOut,
    VerificationUpdate, VerificationOut,
    DepositPay, DepositRefund, DepositOut,
    AnomalyOrderCreate, AnomalyOrderUpdate, AnomalyOrderOut,
    AnomalyListOut, AnomalyHandlingAction,
    ConversionMetrics, PackageConversionDetail
)
from ..models import (
    OrderStatus, AnomalyStatus, AnomalyType,
    StayDate as StayDateModel,
    PackageInventory as InventoryModel,
    OrderStatusLog as OrderStatusLogModel,
    Verification as VerificationModel,
    Deposit as DepositModel
)

router = APIRouter()


@router.post("/packages", response_model=PackageOut, tags=["套餐管理"])
def create_package(obj: PackageCreate, db: Session = Depends(get_db)):
    pkg = PackageService.create(db, obj)
    db.commit()
    db.refresh(pkg)
    return pkg


@router.get("/packages", response_model=PackageListOut, tags=["套餐管理"])
def list_packages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    items, total = PackageService.list(
        db, skip=(page - 1) * page_size, limit=page_size,
        keyword=keyword, is_active=is_active
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/packages/{pkg_id}", response_model=PackageOut, tags=["套餐管理"])
def get_package(pkg_id: int, db: Session = Depends(get_db)):
    pkg = PackageService.get(db, pkg_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="套餐不存在")
    return pkg


@router.put("/packages/{pkg_id}", response_model=PackageOut, tags=["套餐管理"])
def update_package(pkg_id: int, obj: PackageUpdate, db: Session = Depends(get_db)):
    pkg = PackageService.get(db, pkg_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="套餐不存在")
    updated = PackageService.update(db, pkg, obj)
    db.commit()
    db.refresh(updated)
    return updated


# ==================== Price Rules ====================

@router.post("/price-rules", response_model=PriceRuleOut, tags=["价格规则"])
def create_price_rule(obj: PriceRuleCreate, db: Session = Depends(get_db)):
    rule = PriceRuleService.create(db, obj)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/price-rules", response_model=List[PriceRuleOut], tags=["价格规则"])
def list_price_rules(package_id: int, db: Session = Depends(get_db)):
    return PriceRuleService.list_by_package(db, package_id)


@router.put("/price-rules/{rule_id}", response_model=PriceRuleOut, tags=["价格规则"])
def update_price_rule(rule_id: int, obj: PriceRuleUpdate, db: Session = Depends(get_db)):
    rule = PriceRuleService.get(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")
    updated = PriceRuleService.update(db, rule, obj)
    db.commit()
    db.refresh(updated)
    return updated


@router.get("/price-rules/calculate", tags=["价格规则"])
def calculate_price(
    package_id: int,
    check_in: date,
    check_out: date,
    db: Session = Depends(get_db)
):
    total, details = PriceRuleService.calculate_price(db, package_id, check_in, check_out)
    return {"total": float(total), "details": details}


# ==================== Stay Dates ====================

@router.post("/stay-dates", response_model=StayDateOut, tags=["入住日期"])
def create_stay_date(obj: StayDateCreate, db: Session = Depends(get_db)):
    sd = StayDateService.create(db, obj)
    db.commit()
    db.refresh(sd)
    return sd


@router.post("/stay-dates/bulk", response_model=List[StayDateOut], tags=["入住日期"])
def bulk_create_stay_dates(
    package_id: int,
    start_date: date,
    end_date: date,
    check_in_time: str = "14:00",
    check_out_time: str = "12:00",
    db: Session = Depends(get_db)
):
    items = StayDateService.bulk_create(db, package_id, start_date, end_date, check_in_time, check_out_time)
    db.commit()
    for item in items:
        db.refresh(item)
    return items


@router.get("/stay-dates", response_model=List[StayDateOut], tags=["入住日期"])
def list_stay_dates(
    package_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return StayDateService.list_by_package(db, package_id, start_date, end_date)


@router.put("/stay-dates/{sd_id}", response_model=StayDateOut, tags=["入住日期"])
def update_stay_date(sd_id: int, obj: StayDateUpdate, db: Session = Depends(get_db)):
    sd = db.query(StayDateModel).filter(StayDateModel.id == sd_id).first()
    if not sd:
        raise HTTPException(status_code=404, detail="入住日期配置不存在")
    updated = StayDateService.update(db, sd, obj)
    db.commit()
    db.refresh(updated)
    return updated


# ==================== Inventory ====================

@router.post("/inventories", response_model=PackageInventoryOut, tags=["套餐库存"])
def create_inventory(obj: PackageInventoryCreate, db: Session = Depends(get_db)):
    inv = InventoryService.create(db, obj)
    db.commit()
    db.refresh(inv)
    return PackageInventoryOut(
        **{c.name: getattr(inv, c.name) for c in inv.__table__.columns},
        available_quantity=inv.total_quantity - inv.sold_quantity - inv.reserved_quantity
    )


@router.get("/inventories", tags=["套餐库存"])
def list_inventories(
    package_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    items = InventoryService.list_by_package(db, package_id, start_date, end_date)
    result = []
    for inv in items:
        d = {c.name: getattr(inv, c.name) for c in inv.__table__.columns}
        d["available_quantity"] = inv.total_quantity - inv.sold_quantity - inv.reserved_quantity
        result.append(d)
    return result


@router.put("/inventories/{inv_id}", response_model=PackageInventoryOut, tags=["套餐库存"])
def update_inventory(inv_id: int, obj: PackageInventoryUpdate, db: Session = Depends(get_db)):
    inv = db.query(InventoryModel).filter(InventoryModel.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="库存记录不存在")
    updated = InventoryService.update(db, inv, obj)
    db.commit()
    db.refresh(updated)
    return PackageInventoryOut(
        **{c.name: getattr(updated, c.name) for c in updated.__table__.columns},
        available_quantity=updated.total_quantity - updated.sold_quantity - updated.reserved_quantity
    )


@router.get("/inventories/check", tags=["套餐库存"])
def check_availability(
    package_id: int,
    check_in: date,
    check_out: date,
    needed: int = 1,
    db: Session = Depends(get_db)
):
    ok, issues = InventoryService.check_availability(db, package_id, check_in, check_out, needed)
    return {"available": ok, "issues": issues}


# ==================== Orders ====================

@router.post("/orders", response_model=OrderDetailOut, tags=["订单管理"])
def create_order(
    obj: OrderCreate,
    operator: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    order = OrderService.create(db, obj, operator=operator)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=OrderListOut, tags=["订单管理"])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    verification_status: Optional[str] = None,
    deposit_status: Optional[str] = None,
    package_id: Optional[int] = None,
    keyword: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    items, total = OrderService.list(
        db, skip=(page - 1) * page_size, limit=page_size,
        status=status, verification_status=verification_status,
        deposit_status=deposit_status,
        package_id=package_id, keyword=keyword,
        start_date=start_date, end_date=end_date
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/orders/{order_id}", response_model=OrderDetailOut, tags=["订单管理"])
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = OrderService.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.get("/orders/by-no/{order_no}", response_model=OrderDetailOut, tags=["订单管理"])
def get_order_by_no(order_no: str, db: Session = Depends(get_db)):
    order = OrderService.get_by_no(db, order_no)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/orders/{order_id}/status", response_model=OrderDetailOut, tags=["订单管理"])
def change_order_status(order_id: int, obj: OrderStatusChange, db: Session = Depends(get_db)):
    order = OrderService.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    updated = OrderService.change_status(db, order, obj)
    db.commit()
    db.refresh(updated)
    return updated


@router.get("/orders/{order_id}/status-logs", response_model=List[OrderStatusLogOut], tags=["订单管理"])
def get_order_status_logs(order_id: int, db: Session = Depends(get_db)):
    logs = db.query(OrderStatusLogModel).filter(OrderStatusLogModel.order_id == order_id).order_by(
        OrderStatusLogModel.created_at.asc()
    ).all()
    return logs


# ==================== Verification ====================

@router.get("/verifications/by-order/{order_id}", response_model=VerificationOut, tags=["核销记录"])
def get_verification_by_order(order_id: int, db: Session = Depends(get_db)):
    v = VerificationService.get_by_order(db, order_id)
    if not v:
        raise HTTPException(status_code=404, detail="核销记录不存在")
    return v


@router.put("/verifications/{ver_id}", response_model=VerificationOut, tags=["核销记录"])
def update_verification(ver_id: int, obj: VerificationUpdate, db: Session = Depends(get_db)):
    v = db.query(VerificationModel).filter(VerificationModel.id == ver_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="核销记录不存在")
    updated = VerificationService.update(db, v, obj)
    db.commit()
    db.refresh(updated)
    return updated


# ==================== Deposit ====================

@router.get("/deposits/by-order/{order_id}", response_model=DepositOut, tags=["押金管理"])
def get_deposit_by_order(order_id: int, db: Session = Depends(get_db)):
    d = DepositService.get_by_order(db, order_id)
    if not d:
        raise HTTPException(status_code=404, detail="押金记录不存在")
    return d


@router.post("/deposits/{dep_id}/pay", response_model=DepositOut, tags=["押金管理"])
def pay_deposit(dep_id: int, obj: DepositPay, db: Session = Depends(get_db)):
    d = db.query(DepositModel).filter(DepositModel.id == dep_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="押金记录不存在")
    updated = DepositService.pay(db, d, obj)
    db.commit()
    db.refresh(updated)
    return updated


@router.post("/deposits/{dep_id}/refund", response_model=DepositOut, tags=["押金管理"])
def refund_deposit(dep_id: int, obj: DepositRefund, db: Session = Depends(get_db)):
    d = db.query(DepositModel).filter(DepositModel.id == dep_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="押金记录不存在")
    updated = DepositService.refund(db, d, obj)
    db.commit()
    db.refresh(updated)
    return updated


# ==================== Anomaly Orders ====================

@router.post("/anomalies", response_model=AnomalyOrderOut, tags=["异常单管理"])
def create_anomaly(obj: AnomalyOrderCreate, db: Session = Depends(get_db)):
    a = AnomalyService.create(db, obj)
    db.commit()
    db.refresh(a)
    return a


@router.get("/anomalies", response_model=AnomalyListOut, tags=["异常单管理"])
def list_anomalies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[AnomalyStatus] = None,
    anomaly_type: Optional[AnomalyType] = None,
    package_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    items, total = AnomalyService.list(
        db, skip=(page - 1) * page_size, limit=page_size,
        status=status, anomaly_type=anomaly_type, package_id=package_id
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/anomalies/{a_id}", response_model=AnomalyOrderOut, tags=["异常单管理"])
def get_anomaly(a_id: int, db: Session = Depends(get_db)):
    a = AnomalyService.get(db, a_id)
    if not a:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return a


@router.put("/anomalies/{a_id}", response_model=AnomalyOrderOut, tags=["异常单管理"])
def update_anomaly(a_id: int, obj: AnomalyOrderUpdate, db: Session = Depends(get_db)):
    a = AnomalyService.get(db, a_id)
    if not a:
        raise HTTPException(status_code=404, detail="异常单不存在")
    updated = AnomalyService.update(db, a, obj)
    db.commit()
    db.refresh(updated)
    return updated


@router.post("/anomalies/{a_id}/actions", response_model=AnomalyOrderOut, tags=["异常单管理"])
def add_handling_action(a_id: int, obj: AnomalyHandlingAction, db: Session = Depends(get_db)):
    a = AnomalyService.get(db, a_id)
    if not a:
        raise HTTPException(status_code=404, detail="异常单不存在")
    updated = AnomalyService.add_handling_action(db, a, obj)
    db.commit()
    db.refresh(updated)
    return updated


# ==================== Analytics ====================

@router.get("/analytics/conversion", response_model=ConversionMetrics, tags=["数据分析"])
def get_conversion(
    period_start: date,
    period_end: date,
    package_id: Optional[int] = None,
    sales_channel: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_conversion_metrics(
        db, period_start, period_end, package_id, sales_channel
    )


@router.get("/analytics/package-conversion", response_model=List[PackageConversionDetail], tags=["数据分析"])
def get_package_conversion(
    period_start: date,
    period_end: date,
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_package_conversion(db, period_start, period_end)
