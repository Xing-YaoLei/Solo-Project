from celery import shared_task
from datetime import datetime, date, timedelta
from sqlalchemy import and_
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, name="app.tasks.oversold.detect_oversold_globally",
             max_retries=3, default_retry_delay=60)
def detect_oversold_globally(self):
    from ..core.database import SessionLocal
    from ..models import PackageInventory, Package, Order, OrderStatus, AnomalyOrder, AnomalyType
    from ..services import generate_anomaly_no

    db = SessionLocal()
    try:
        today = date.today()
        end = today + timedelta(days=60)
        anomalies_created = 0

        inventories = db.query(PackageInventory).filter(
            PackageInventory.inventory_date >= today,
            PackageInventory.inventory_date <= end,
            PackageInventory.sold_quantity > PackageInventory.total_quantity
        ).all()

        for inv in inventories:
            oversold_count = inv.sold_quantity - inv.total_quantity
            if oversold_count <= 0:
                continue

            affected_orders = db.query(Order).filter(
                Order.package_id == inv.package_id,
                Order.check_in_date <= inv.inventory_date,
                Order.check_out_date > inv.inventory_date,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN])
            ).order_by(Order.created_at.asc()).all()

            existing = db.query(AnomalyOrder).filter(
                AnomalyOrder.package_id == inv.package_id,
                AnomalyOrder.anomaly_type == AnomalyType.OVERSOLD,
                AnomalyOrder.description.ilike(f"%{inv.inventory_date.isoformat()}%")
            ).first()

            if not existing and affected_orders:
                pkg = db.query(Package).filter(Package.id == inv.package_id).first()
                pkg_name = pkg.name if pkg else "未知套餐"
                order_nos = [o.order_no for o in affected_orders]

                anom = AnomalyOrder(
                    anomaly_no=generate_anomaly_no(),
                    package_id=inv.package_id,
                    order_id=affected_orders[0].id if affected_orders else None,
                    anomaly_type=AnomalyType.OVERSOLD,
                    status="open",
                    title=f"自动超卖检测 - {pkg_name} @{inv.inventory_date.isoformat()}",
                    description=(f"Celery任务检测到套餐【{pkg_name}】在{inv.inventory_date.isoformat()} "
                                 f"超卖{oversold_count}间：总库存{inv.total_quantity}, "
                                 f"已售{inv.sold_quantity}。涉及订单：{', '.join(order_nos)}。"),
                    impact_scope={
                        "date": inv.inventory_date.isoformat(),
                        "oversold_count": oversold_count,
                        "inventory_total": inv.total_quantity,
                        "inventory_sold": inv.sold_quantity,
                        "orders": order_nos,
                        "customers": [o.customer_name for o in affected_orders]
                    },
                    impact_level="high" if oversold_count >= 3 else "medium",
                    reported_by="celery_oversold_detect"
                )
                db.add(anom)
                anomalies_created += 1

        db.commit()
        logger.info(f"[detect_oversold_globally] 完成，生成异常单数：{anomalies_created}")
        return {"anomalies_created": anomalies_created, "scanned_inventories": len(inventories)}

    except Exception as exc:
        logger.error(f"[detect_oversold_globally] 错误: {exc}")
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@shared_task(bind=True, name="app.tasks.oversold.detect_daily_snapshot",
             max_retries=2)
def detect_daily_snapshot(self, snapshot_date: str = None):
    target = date.fromisoformat(snapshot_date) if snapshot_date else date.today()
    logger.info(f"[detect_daily_snapshot] 针对日期 {target.isoformat()} 执行快照")
    result = detect_oversold_globally.apply()
    return {"target_date": target.isoformat(), "result": result.result if result.successful() else None}
