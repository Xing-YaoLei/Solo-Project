import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, and_, text

from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.material_batch import MaterialBatch
from app.models.inventory_record import InventoryRecord
from app.models.shortage_order import ShortageOrder
from app.models.safety_stock import SafetyStockConfig
from app.models.shortage_action_log import ShortageActionLog

logger = logging.getLogger(__name__)


@celery_app.task(name="inventory.check_safety_stock", bind=True, max_retries=3)
def check_safety_stock_task(self):
    """
    巡检安全库存：当实际库存低于安全库存下限时，自动创建短缺工单。
    每天凌晨执行。
    """
    db = SessionLocal()
    try:
        safety_items = db.query(SafetyStockConfig).all()
        created_count = 0

        for item in safety_items:
            if item.current_stock > item.min_stock:
                continue

            existing = db.query(ShortageOrder).filter(
                and_(
                    ShortageOrder.material_name == item.material_name,
                    ShortageOrder.region == item.region,
                    ShortageOrder.status.in_(["pending", "processing"]),
                )
            ).first()

            if existing:
                continue

            shortage_qty = int(max(item.warning_stock - item.current_stock, item.min_stock))
            order = ShortageOrder(
                material_name=item.material_name,
                region=item.region,
                unit=item.unit,
                shortage_quantity=shortage_qty,
                responsible_person="系统自动分派",
                priority="high" if item.current_stock < item.min_stock else "medium",
                status="pending",
                deadline=(datetime.now(timezone.utc) + timedelta(days=3)).date(),
            )
            db.add(order)
            db.flush()

            log = ShortageActionLog(
                shortage_order_id=order.id,
                action="create",
                operator="系统自动检测",
                remark=f"安全库存自动触发：{item.region} {item.material_name} 当前库存 {item.current_stock} {item.unit}，低于下限 {item.min_stock} {item.unit}",
            )
            db.add(log)
            created_count += 1

        db.commit()
        logger.info(f"安全库存巡检完成，新建短缺工单 {created_count} 张")
        return {"created": created_count, "checked": len(safety_items)}
    except Exception as e:
        db.rollback()
        logger.error(f"安全库存巡检失败: {e}")
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()


@celery_app.task(name="inventory.calc_turnover_days", bind=True)
def calc_turnover_days_task(self):
    """
    计算已完结批次的实际周转天数（入库日期到出库完结日期）。
    每天凌晨执行。
    """
    db = SessionLocal()
    try:
        batches = db.query(MaterialBatch).filter(
            MaterialBatch.actual_turnover_days.is_(None),
            MaterialBatch.status == "completed",
        ).all()

        updated = 0
        for batch in batches:
            if not batch.in_date:
                continue

            out_records = db.query(InventoryRecord).filter(
                InventoryRecord.batch_id == batch.id,
                InventoryRecord.type == "out",
            ).order_by(InventoryRecord.created_at.desc()).first()

            if out_records:
                out_date = out_records.created_at.date()
                days = (out_date - batch.in_date).days
                if days > 0:
                    batch.actual_turnover_days = days
                    updated += 1

        db.commit()
        logger.info(f"周转天数计算完成，更新 {updated} 个批次")
        return {"updated": updated}
    except Exception as e:
        db.rollback()
        logger.error(f"周转天数计算失败: {e}")
        raise self.retry(exc=e, countdown=120)
    finally:
        db.close()


@celery_app.task(name="inventory.daily_snapshot", bind=True)
def daily_snapshot_task(self):
    """
    每日库存快照：保存当日关键库存指标，用于趋势分析报表。
    """
    db = SessionLocal()
    try:
        total_batches = db.query(func.count(MaterialBatch.id)).scalar() or 0
        in_stock_batches = (
            db.query(func.count(MaterialBatch.id))
            .filter(MaterialBatch.status == "in_stock")
            .scalar()
            or 0
        )
        total_qty = (
            db.query(func.sum(MaterialBatch.quantity))
            .filter(MaterialBatch.status == "in_stock")
            .scalar()
            or 0
        )
        pending_shortages = (
            db.query(func.count(ShortageOrder.id))
            .filter(ShortageOrder.status.in_(["pending", "processing"]))
            .scalar()
            or 0
        )

        result = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "total_batches": int(total_batches),
            "in_stock_batches": int(in_stock_batches),
            "total_quantity": float(total_qty),
            "pending_shortages": int(pending_shortages),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"每日库存快照: {result}")
        return result
    except Exception as e:
        logger.error(f"每日快照失败: {e}")
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()


@celery_app.task(name="inventory.test_connection")
def test_connection_task():
    """测试任务：验证Celery worker和数据库连接正常"""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "time": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
