from datetime import date, datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy import and_, func

from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.models.inventory_record import InventoryRecord, InventoryRecordType
from app.models.shortage_order import ShortageOrder, ShortageOrderStatus
from app.models.safety_stock import SafetyStockConfig
from app.services.material_batch import material_batch_service
from app.services.inventory import inventory_service
from app.services.shortage import shortage_service
from app.services.analytics import analytics_service


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@celery_app.task(bind=True, name="detect_inventory_shortage")
def detect_inventory_shortage(self) -> Dict[str, Any]:
    db = next(get_db())
    try:
        shortage_batches = (
            db.query(MaterialBatch)
            .filter(
                MaterialBatch.status.notin_(
                    [MaterialBatchStatus.COMPLETED, MaterialBatchStatus.SHORTAGE]
                )
            )
            .all()
        )

        shortage_detected = []
        auto_created_orders = []

        for batch in shortage_batches:
            current_stock = material_batch_service.get_current_stock(db, batch.id)

            safety_config = (
                db.query(SafetyStockConfig)
                .filter(
                    and_(
                        SafetyStockConfig.material_name == batch.material_name,
                        SafetyStockConfig.region == batch.region,
                    )
                )
                .first()
            )

            is_shortage = False
            threshold = 0.0

            if safety_config and current_stock <= safety_config.min_stock:
                is_shortage = True
                threshold = safety_config.min_stock
            elif current_stock <= 0:
                is_shortage = True

            if is_shortage:
                batch.status = MaterialBatchStatus.SHORTAGE
                db.add(batch)

                shortage_detected.append(
                    {
                        "batch_id": batch.id,
                        "batch_no": batch.batch_no,
                        "material_name": batch.material_name,
                        "current_stock": current_stock,
                        "threshold": threshold,
                    }
                )

                order = shortage_service.auto_create_from_batch(db, batch)
                if order:
                    auto_created_orders.append(
                        {
                            "order_id": order.id,
                            "shortage_quantity": order.shortage_quantity,
                            "priority": order.priority.value,
                        }
                    )

        db.commit()

        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_batches_checked": len(shortage_batches),
            "shortage_detected_count": len(shortage_detected),
            "shortage_detected": shortage_detected,
            "auto_created_orders_count": len(auto_created_orders),
            "auto_created_orders": auto_created_orders,
        }

        return result
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }


@celery_app.task(bind=True, name="auto_create_shortage_order")
def auto_create_shortage_order(self, batch_id: int) -> Dict[str, Any]:
    db = next(get_db())
    try:
        batch = material_batch_service.get_by_id(db, batch_id)
        if not batch:
            return {
                "status": "error",
                "message": f"Batch {batch_id} not found",
            }

        order = shortage_service.auto_create_from_batch(db, batch)

        if order:
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "order_id": order.id,
                "batch_id": batch_id,
                "material_name": order.material_name,
                "shortage_quantity": order.shortage_quantity,
            }
        else:
            return {
                "status": "skipped",
                "timestamp": datetime.now().isoformat(),
                "message": "Order already exists or no shortage",
                "batch_id": batch_id,
            }
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "batch_id": batch_id,
        }


@celery_app.task(bind=True, name="calculate_turnover_rate")
def calculate_turnover_rate(self, days: int = 30) -> Dict[str, Any]:
    db = next(get_db())
    try:
        turnover_analysis = analytics_service.calculate_turnover_days(db, days)

        batches = (
            db.query(MaterialBatch)
            .filter(MaterialBatch.in_date.isnot(None))
            .all()
        )

        updated_count = 0
        for batch in batches:
            updated = material_batch_service.calculate_turnover_days(db, batch.id)
            if updated and updated.actual_turnover_days:
                updated_count += 1

        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "analysis_days": days,
            "overall_turnover_rate": turnover_analysis.overall_turnover_rate,
            "overall_turnover_days": turnover_analysis.overall_turnover_days,
            "batches_updated": updated_count,
            "category_breakdown": [
                {
                    "category": item.category,
                    "turnover_rate": item.turnover_rate,
                    "turnover_days": item.turnover_days,
                }
                for item in turnover_analysis.items
            ],
        }

        return result
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }


@celery_app.task(bind=True, name="generate_daily_report")
def generate_daily_report(self, report_date: str = None) -> Dict[str, Any]:
    db = next(get_db())
    try:
        if report_date:
            d = date.fromisoformat(report_date)
        else:
            d = date.today() - timedelta(days=1)

        daily_summary = inventory_service.get_daily_summary(db, d)

        daily_report = analytics_service.get_daily_report(db, d)

        region_dist = analytics_service.get_region_distribution(db)
        category_dist = analytics_service.get_category_distribution(db)

        pending_orders = (
            db.query(ShortageOrder)
            .filter(
                ShortageOrder.status.in_(
                    [
                        ShortageOrderStatus.PENDING,
                        ShortageOrderStatus.PROCESSING,
                        ShortageOrderStatus.RETRIED,
                    ]
                )
            )
            .count()
        )

        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "report_date": d.isoformat(),
            "daily_summary": daily_summary,
            "daily_report": daily_report,
            "pending_shortage_orders": pending_orders,
            "region_summary": [
                {"region": item.region, "percentage": item.percentage}
                for item in region_dist.items[:5]
            ],
            "category_summary": [
                {"category": item.category, "percentage": item.percentage}
                for item in category_dist.items[:5]
            ],
        }

        return result
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }


@celery_app.task(bind=True, name="update_all_safety_stocks")
def update_all_safety_stocks(self) -> Dict[str, Any]:
    db = next(get_db())
    try:
        safety_configs = db.query(SafetyStockConfig).all()
        updated_count = 0

        for config in safety_configs:
            batches = (
                db.query(MaterialBatch)
                .filter(
                    and_(
                        MaterialBatch.material_name == config.material_name,
                        MaterialBatch.region == config.region,
                        MaterialBatch.status.notin_([MaterialBatchStatus.COMPLETED]),
                    )
                )
                .all()
            )

            total_stock = 0.0
            for batch in batches:
                total_stock += material_batch_service.get_current_stock(db, batch.id)

            if config.current_stock != total_stock:
                config.current_stock = total_stock
                db.add(config)
                updated_count += 1

        db.commit()

        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_configs": len(safety_configs),
            "updated_count": updated_count,
        }

        return result
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }


@celery_app.task(bind=True, name="batch_process_shortage_orders")
def batch_process_shortage_orders(self) -> Dict[str, Any]:
    db = next(get_db())
    try:
        pending_orders = (
            db.query(ShortageOrder)
            .filter(
                ShortageOrder.status.in_(
                    [
                        ShortageOrderStatus.PENDING,
                        ShortageOrderStatus.PROCESSING,
                    ]
                )
            )
            .all()
        )

        processed = []
        for order in pending_orders:
            batch = material_batch_service.get_by_id(db, order.batch_id)
            if not batch:
                continue

            current_stock = material_batch_service.get_current_stock(db, order.batch_id)

            if current_stock >= order.shortage_quantity:
                shortage_service.supplement(
                    db,
                    order.id,
                    supplement_quantity=order.shortage_quantity,
                    operator="system",
                    remark="系统自动检测库存充足，自动补录",
                )
                processed.append(
                    {
                        "order_id": order.id,
                        "material_name": order.material_name,
                        "shortage_quantity": order.shortage_quantity,
                        "current_stock": current_stock,
                    }
                )

        db.commit()

        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "pending_orders_checked": len(pending_orders),
            "auto_processed_count": len(processed),
            "processed_orders": processed,
        }

        return result
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }
