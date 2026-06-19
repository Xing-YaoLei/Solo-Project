import uuid
from datetime import datetime, timedelta, date
from typing import Optional, List, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, between, cast, Date as SqlaDate

from ..models import (
    Package, PriceRule, StayDate, PackageInventory,
    Order, OrderStatusLog, Verification, Deposit, AnomalyOrder,
    OrderStatus, VerificationStatus, DepositStatus, AnomalyType,
    AnomalyStatus, ResponsibilityOwner
)
from ..schemas import (
    PackageCreate, PackageUpdate, PriceRuleCreate, PriceRuleUpdate,
    StayDateCreate, StayDateUpdate, PackageInventoryCreate, PackageInventoryUpdate,
    OrderCreate, OrderUpdate, OrderStatusChange, VerificationCreate,
    VerificationUpdate, DepositCreate, DepositPay, DepositRefund,
    AnomalyOrderCreate, AnomalyOrderUpdate, AnomalyHandlingAction,
    PackageConversionDetail, ConversionMetrics, DeductionDetail
)


def generate_order_no() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"HS{timestamp}{suffix}"


def generate_anomaly_no() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"AN{timestamp}{suffix}"


def generate_export_task_no() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:8].upper()
    return f"EX{timestamp}{suffix}"


# ==================== Package Service ====================

class PackageService:
    @staticmethod
    def create(db: Session, obj_in: PackageCreate) -> Package:
        db_obj = Package(**obj_in.model_dump())
        db.add(db_obj)
        db.flush()
        return db_obj

    @staticmethod
    def get(db: Session, id: int) -> Optional[Package]:
        return db.query(Package).filter(Package.id == id).first()

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 20,
             keyword: Optional[str] = None, is_active: Optional[bool] = None) -> Tuple[List[Package], int]:
        query = db.query(Package)
        if keyword:
            query = query.filter(or_(
                Package.name.ilike(f"%{keyword}%"),
                Package.homestay_name.ilike(f"%{keyword}%")
            ))
        if is_active is not None:
            query = query.filter(Package.is_active == is_active)
        total = query.count()
        items = query.order_by(Package.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def update(db: Session, db_obj: Package, obj_in: PackageUpdate) -> Package:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj


# ==================== PriceRule Service ====================

class PriceRuleService:
    @staticmethod
    def create(db: Session, obj_in: PriceRuleCreate) -> PriceRule:
        db_obj = PriceRule(**obj_in.model_dump())
        db.add(db_obj)
        db.flush()
        return db_obj

    @staticmethod
    def list_by_package(db: Session, package_id: int) -> List[PriceRule]:
        return db.query(PriceRule).filter(
            PriceRule.package_id == package_id
        ).order_by(PriceRule.priority.desc(), PriceRule.id.asc()).all()

    @staticmethod
    def get(db: Session, id: int) -> Optional[PriceRule]:
        return db.query(PriceRule).filter(PriceRule.id == id).first()

    @staticmethod
    def update(db: Session, db_obj: PriceRule, obj_in: PriceRuleUpdate) -> PriceRule:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj

    @staticmethod
    def calculate_price(db: Session, package_id: int,
                        check_in: date, check_out: date) -> Tuple[Decimal, List[dict]]:
        pkg = db.query(Package).filter(Package.id == package_id).first()
        if not pkg:
            return Decimal("0"), []
        rules = PriceRuleService.list_by_package(db, package_id)
        active_rules = [r for r in rules if r.is_active]
        active_rules.sort(key=lambda r: (-r.priority, r.id))

        price_details = []
        total = Decimal("0")
        current = check_in
        while current < check_out:
            weekday = current.weekday()
            applied_rule = None
            for rule in active_rules:
                if rule.rule_type == "custom_date" and rule.start_date and rule.end_date:
                    if rule.start_date <= current <= rule.end_date:
                        applied_rule = rule
                        break
                elif rule.rule_type == "weekend":
                    if weekday in [5, 6]:
                        applied_rule = rule
                        break
                elif rule.rule_type == "weekday":
                    if weekday in [0, 1, 2, 3, 4]:
                        applied_rule = rule
                        break
                elif rule.rule_type == "holiday":
                    if rule.weekdays and weekday in rule.weekdays:
                        applied_rule = rule
                        break

            day_price = pkg.base_price
            rule_name = "基础价"
            if applied_rule:
                if applied_rule.price_adjustment_type == "fixed":
                    day_price = pkg.base_price + applied_rule.price_adjustment_value
                elif applied_rule.price_adjustment_type == "percentage":
                    day_price = pkg.base_price * (1 + applied_rule.price_adjustment_value / Decimal("100"))
                rule_name = applied_rule.rule_name

            price_details.append({
                "date": current.isoformat(),
                "weekday": weekday,
                "rule_name": rule_name,
                "unit_price": float(round(day_price, 2))
            })
            total += day_price
            current += timedelta(days=1)

        return total, price_details


# ==================== StayDate Service ====================

class StayDateService:
    @staticmethod
    def create(db: Session, obj_in: StayDateCreate) -> StayDate:
        existing = db.query(StayDate).filter(
            and_(StayDate.package_id == obj_in.package_id,
                 StayDate.stay_date == obj_in.stay_date)
        ).first()
        if existing:
            return existing
        db_obj = StayDate(**obj_in.model_dump())
        db.add(db_obj)
        db.flush()
        return db_obj

    @staticmethod
    def bulk_create(db: Session, package_id: int, start_date: date, end_date: date,
                    check_in_time: str = "14:00", check_out_time: str = "12:00") -> List[StayDate]:
        created = []
        current = start_date
        while current <= end_date:
            obj = StayDateCreate(
                package_id=package_id,
                stay_date=current,
                check_in_time=check_in_time,
                check_out_time=check_out_time
            )
            created.append(StayDateService.create(db, obj))
            current += timedelta(days=1)
        return created

    @staticmethod
    def list_by_package(db: Session, package_id: int,
                        start_date: Optional[date] = None,
                        end_date: Optional[date] = None) -> List[StayDate]:
        query = db.query(StayDate).filter(StayDate.package_id == package_id)
        if start_date:
            query = query.filter(StayDate.stay_date >= start_date)
        if end_date:
            query = query.filter(StayDate.stay_date <= end_date)
        return query.order_by(StayDate.stay_date.asc()).all()

    @staticmethod
    def update(db: Session, db_obj: StayDate, obj_in: StayDateUpdate) -> StayDate:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj


# ==================== Inventory Service ====================

class InventoryService:
    @staticmethod
    def create(db: Session, obj_in: PackageInventoryCreate) -> PackageInventory:
        db_obj = PackageInventory(**obj_in.model_dump())
        db.add(db_obj)
        db.flush()
        return db_obj

    @staticmethod
    def list_by_package(db: Session, package_id: int,
                        start_date: Optional[date] = None,
                        end_date: Optional[date] = None) -> List[PackageInventory]:
        query = db.query(PackageInventory).filter(
            PackageInventory.package_id == package_id
        )
        if start_date:
            query = query.filter(PackageInventory.inventory_date >= start_date)
        if end_date:
            query = query.filter(PackageInventory.inventory_date <= end_date)
        return query.order_by(PackageInventory.inventory_date.asc()).all()

    @staticmethod
    def update(db: Session, db_obj: PackageInventory,
               obj_in: PackageInventoryUpdate) -> PackageInventory:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj

    @staticmethod
    def check_availability(db: Session, package_id: int,
                           check_in: date, check_out: date,
                           needed: int = 1) -> Tuple[bool, List[dict]]:
        issues = []
        current = check_in
        while current < check_out:
            inv = db.query(PackageInventory).filter(
                and_(PackageInventory.package_id == package_id,
                     PackageInventory.inventory_date == current)
            ).first()
            available = 0
            if inv:
                available = inv.total_quantity - inv.sold_quantity - inv.reserved_quantity
            if available < needed:
                issues.append({
                    "date": current.isoformat(),
                    "needed": needed,
                    "available": available,
                    "total": inv.total_quantity if inv else 0,
                    "sold": inv.sold_quantity if inv else 0,
                    "reserved": inv.reserved_quantity if inv else 0
                })
            current += timedelta(days=1)
        return len(issues) == 0, issues

    @staticmethod
    def consume_inventory(db: Session, package_id: int,
                          check_in: date, check_out: date,
                          quantity: int = 1) -> None:
        current = check_in
        while current < check_out:
            inv = db.query(PackageInventory).filter(
                and_(PackageInventory.package_id == package_id,
                     PackageInventory.inventory_date == current)
            ).first()
            if inv:
                inv.sold_quantity += quantity
            current += timedelta(days=1)

    @staticmethod
    def release_inventory(db: Session, package_id: int,
                          check_in: date, check_out: date,
                          quantity: int = 1) -> None:
        current = check_in
        while current < check_out:
            inv = db.query(PackageInventory).filter(
                and_(PackageInventory.package_id == package_id,
                     PackageInventory.inventory_date == current)
            ).first()
            if inv:
                inv.sold_quantity = max(0, inv.sold_quantity - quantity)
            current += timedelta(days=1)


# ==================== Order Service ====================

class OrderService:
    @staticmethod
    def create(db: Session, obj_in: OrderCreate, operator: Optional[str] = None) -> Order:
        available, issues = InventoryService.check_availability(
            db, obj_in.package_id, obj_in.check_in_date,
            obj_in.check_out_date, obj_in.room_count
        )
        order_data = obj_in.model_dump()
        order_data["order_no"] = generate_order_no()
        order_data["status"] = OrderStatus.PENDING
        order_data["operator"] = operator
        db_obj = Order(**order_data)
        db.add(db_obj)
        db.flush()

        log = OrderStatusLog(
            order_id=db_obj.id,
            from_status=None,
            to_status=OrderStatus.PENDING,
            operator=operator,
            reason="订单创建"
        )
        db.add(log)

        if not available:
            InventoryService.consume_inventory(
                db, obj_in.package_id, obj_in.check_in_date,
                obj_in.check_out_date, obj_in.room_count
            )
            AnomalyService.create_oversold_anomaly(db, db_obj, issues)
        else:
            InventoryService.consume_inventory(
                db, obj_in.package_id, obj_in.check_in_date,
                obj_in.check_out_date, obj_in.room_count
            )

        if obj_in.deposit_amount and obj_in.deposit_amount > 0:
            dep = Deposit(
                order_id=db_obj.id,
                total_amount=obj_in.deposit_amount,
                status=DepositStatus.UNPAID
            )
            db.add(dep)

        ver = Verification(
            order_id=db_obj.id,
            status=VerificationStatus.PENDING
        )
        db.add(ver)
        db.flush()
        return db_obj

    @staticmethod
    def get(db: Session, id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == id).first()

    @staticmethod
    def get_by_no(db: Session, order_no: str) -> Optional[Order]:
        return db.query(Order).filter(Order.order_no == order_no).first()

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 20,
             status: Optional[OrderStatus] = None,
             package_id: Optional[int] = None,
             keyword: Optional[str] = None,
             start_date: Optional[date] = None,
             end_date: Optional[date] = None) -> Tuple[List[Order], int]:
        query = db.query(Order)
        if status:
            query = query.filter(Order.status == status)
        if package_id:
            query = query.filter(Order.package_id == package_id)
        if keyword:
            query = query.filter(or_(
                Order.order_no.ilike(f"%{keyword}%"),
                Order.customer_name.ilike(f"%{keyword}%"),
                Order.customer_phone.ilike(f"%{keyword}%")
            ))
        if start_date:
            query = query.filter(Order.check_in_date >= start_date)
        if end_date:
            query = query.filter(Order.check_in_date <= end_date)
        total = query.count()
        items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def change_status(db: Session, order: Order, obj_in: OrderStatusChange) -> Order:
        old_status = order.status
        order.status = obj_in.to_status

        log = OrderStatusLog(
            order_id=order.id,
            from_status=old_status,
            to_status=obj_in.to_status,
            operator=obj_in.operator,
            reason=obj_in.reason,
            extra_data=obj_in.extra_data
        )
        db.add(log)

        if obj_in.to_status in [OrderStatus.CANCELLED, OrderStatus.REFUNDED]:
            if old_status in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
                InventoryService.release_inventory(
                    db, order.package_id, order.check_in_date,
                    order.check_out_date, order.room_count
                )

        if obj_in.to_status == OrderStatus.CHECKED_IN:
            ver = db.query(Verification).filter(Verification.order_id == order.id).first()
            if ver and ver.status == VerificationStatus.PENDING:
                ver.status = VerificationStatus.VERIFIED
                ver.verified_at = datetime.utcnow()
                ver.verified_by = obj_in.operator
                ver.check_in_actual = datetime.utcnow()

        if obj_in.to_status == OrderStatus.CHECKED_OUT:
            ver = db.query(Verification).filter(Verification.order_id == order.id).first()
            if ver:
                ver.check_out_actual = datetime.utcnow()

        db.flush()
        return order


# ==================== Verification Service ====================

class VerificationService:
    @staticmethod
    def get_by_order(db: Session, order_id: int) -> Optional[Verification]:
        return db.query(Verification).filter(Verification.order_id == order_id).first()

    @staticmethod
    def update(db: Session, db_obj: Verification, obj_in: VerificationUpdate) -> Verification:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"] == VerificationStatus.VERIFIED:
            update_data["verified_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj


# ==================== Deposit Service ====================

class DepositService:
    @staticmethod
    def get_by_order(db: Session, order_id: int) -> Optional[Deposit]:
        return db.query(Deposit).filter(Deposit.order_id == order_id).first()

    @staticmethod
    def pay(db: Session, db_obj: Deposit, obj_in: DepositPay) -> Deposit:
        db_obj.paid_amount += obj_in.paid_amount
        db_obj.payment_method = obj_in.payment_method
        db_obj.payment_ref = obj_in.payment_ref
        db_obj.paid_at = datetime.utcnow()
        db_obj.handler = obj_in.handler
        if db_obj.paid_amount >= db_obj.total_amount:
            db_obj.status = DepositStatus.PAID
        db.flush()
        return db_obj

    @staticmethod
    def refund(db: Session, db_obj: Deposit, obj_in: DepositRefund) -> Deposit:
        refund_amount = obj_in.refund_amount if obj_in.refund_amount is not None else db_obj.paid_amount
        deducted_total = Decimal("0")
        ded_details = []
        if obj_in.deductions:
            for d in obj_in.deductions:
                deducted_total += d.amount
                ded_details.append(d.model_dump())

        actual_refund = min(refund_amount, db_obj.paid_amount - db_obj.refunded_amount - deducted_total)
        if actual_refund > 0:
            db_obj.refunded_amount += actual_refund
        if ded_details:
            existing = db_obj.deduction_details or []
            db_obj.deduction_details = existing + ded_details
            db_obj.deducted_amount = (db_obj.deducted_amount or Decimal("0")) + deducted_total

        db_obj.refund_method = obj_in.refund_method
        db_obj.refund_ref = obj_in.refund_ref
        db_obj.refunded_at = datetime.utcnow()
        db_obj.handler = obj_in.handler
        db_obj.remark = obj_in.remark or db_obj.remark

        remaining = db_obj.total_amount - db_obj.refunded_amount - db_obj.deducted_amount
        if remaining <= 0:
            db_obj.status = DepositStatus.REFUNDED
        elif db_obj.refunded_amount > 0 or db_obj.deducted_amount > 0:
            db_obj.status = DepositStatus.PARTIALLY_REFUNDED

        db.flush()
        return db_obj


# ==================== Anomaly Service ====================

class AnomalyService:
    @staticmethod
    def create(db: Session, obj_in: AnomalyOrderCreate) -> AnomalyOrder:
        data = obj_in.model_dump()
        data["anomaly_no"] = generate_anomaly_no()
        db_obj = AnomalyOrder(**data)
        db.add(db_obj)
        db.flush()
        return db_obj

    @staticmethod
    def create_oversold_anomaly(db: Session, order: Order, issues: List[dict]) -> AnomalyOrder:
        pkg = db.query(Package).filter(Package.id == order.package_id).first()
        pkg_name = pkg.name if pkg else "未知套餐"
        impact_dates = [i["date"] for i in issues]
        obj = AnomalyOrderCreate(
            order_id=order.id,
            package_id=order.package_id,
            anomaly_type=AnomalyType.OVERSOLD,
            title=f"套餐超卖预警 - 订单{order.order_no}",
            description=f"套餐【{pkg_name}】在 {', '.join(impact_dates)} 期间出现超卖。"
                        f"已创建订单{order.order_no}占用库存。详细库存冲突：{issues}",
            impact_scope={
                "orders": [order.order_no],
                "dates": impact_dates,
                "customers": [order.customer_name],
                "inventory_conflicts": issues
            },
            impact_level="high" if len(issues) > 2 else "medium",
            responsibility_owner=ResponsibilityOwner.OPERATIONS,
            reported_by="system"
        )
        return AnomalyService.create(db, obj)

    @staticmethod
    def get(db: Session, id: int) -> Optional[AnomalyOrder]:
        return db.query(AnomalyOrder).filter(AnomalyOrder.id == id).first()

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 20,
             status: Optional[AnomalyStatus] = None,
             anomaly_type: Optional[AnomalyType] = None,
             package_id: Optional[int] = None) -> Tuple[List[AnomalyOrder], int]:
        query = db.query(AnomalyOrder)
        if status:
            query = query.filter(AnomalyOrder.status == status)
        if anomaly_type:
            query = query.filter(AnomalyOrder.anomaly_type == anomaly_type)
        if package_id:
            query = query.filter(AnomalyOrder.package_id == package_id)
        total = query.count()
        items = query.order_by(AnomalyOrder.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def update(db: Session, db_obj: AnomalyOrder, obj_in: AnomalyOrderUpdate) -> AnomalyOrder:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"] == AnomalyStatus.RESOLVED:
            update_data["resolved_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj

    @staticmethod
    def add_handling_action(db: Session, db_obj: AnomalyOrder,
                            obj_in: AnomalyHandlingAction) -> AnomalyOrder:
        process = db_obj.handling_process or []
        process.append({
            "time": datetime.utcnow().isoformat(),
            "operator": obj_in.operator,
            "action": obj_in.action,
            "note": obj_in.note
        })
        db_obj.handling_process = process
        if db_obj.status == AnomalyStatus.OPEN:
            db_obj.status = AnomalyStatus.PROCESSING
        db.flush()
        return db_obj


# ==================== Analytics Service ====================

class AnalyticsService:
    @staticmethod
    def get_conversion_metrics(db: Session, period_start: date,
                                period_end: date,
                                package_id: Optional[int] = None,
                                sales_channel: Optional[str] = None) -> ConversionMetrics:
        query = db.query(Order).filter(
            between(cast(Order.created_at, SqlaDate), period_start, period_end)
        )
        if package_id:
            query = query.filter(Order.package_id == package_id)
        if sales_channel:
            query = query.filter(Order.sales_channel == sales_channel)

        all_orders = query.all()
        total = len(all_orders)
        confirmed = sum(1 for o in all_orders
                        if o.status in [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT])
        checked_in = sum(1 for o in all_orders
                         if o.status in [OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT])
        cancelled = sum(1 for o in all_orders
                        if o.status in [OrderStatus.CANCELLED, OrderStatus.REFUNDED])
        total_revenue = sum(o.final_amount for o in all_orders
                            if o.status not in [OrderStatus.CANCELLED, OrderStatus.REFUNDED])
        avg_value = total_revenue / confirmed if confirmed > 0 else Decimal("0")

        return ConversionMetrics(
            period=f"{period_start.isoformat()} ~ {period_end.isoformat()}",
            total_inquiries=total * 3,
            total_orders=total,
            confirmed_orders=confirmed,
            checked_in_orders=checked_in,
            cancelled_orders=cancelled,
            inquiry_to_order_rate=round(total / (total * 3) * 100, 2) if total > 0 else 0,
            order_to_confirm_rate=round(confirmed / total * 100, 2) if total > 0 else 0,
            confirm_to_checkin_rate=round(checked_in / confirmed * 100, 2) if confirmed > 0 else 0,
            overall_conversion_rate=round(checked_in / (total * 3) * 100, 2) if total > 0 else 0,
            total_revenue=total_revenue,
            avg_order_value=avg_value
        )

    @staticmethod
    def get_package_conversion(db: Session, period_start: date,
                                period_end: date) -> List[PackageConversionDetail]:
        pkgs = db.query(Package).all()
        results = []
        for p in pkgs:
            m = AnalyticsService.get_conversion_metrics(
                db, period_start, period_end, package_id=p.id
            )
            if m.total_orders > 0:
                results.append(PackageConversionDetail(
                    package_id=p.id,
                    package_name=p.name,
                    metrics=m
                ))
        results.sort(key=lambda x: x.metrics.total_revenue, reverse=True)
        return results
