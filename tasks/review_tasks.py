from datetime import date, datetime
from sqlalchemy import func, and_
from tasks.celery_app import celery_app
from data.database import SessionLocal
from data.models import ReviewMaterial, PartsUsage, RepairOrder, ReworkRecord


@celery_app.task(bind=True)
def generate_review_material_task(self, review_type: str = "parts_shortage",
                                   start_date: str = None, end_date: str = None):
    db = SessionLocal()
    try:
        if not start_date:
            start_date = date.today().replace(day=1).isoformat()
        if not end_date:
            end_date = date.today().isoformat()

        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

        shortage_parts = db.query(
            PartsUsage.part_code,
            PartsUsage.part_name,
            func.count(PartsUsage.id).label('shortage_count')
        ).join(
            RepairOrder, PartsUsage.order_id == RepairOrder.id
        ).filter(
            and_(
                RepairOrder.appointment_date >= start,
                RepairOrder.appointment_date <= end,
                PartsUsage.is_shortage == True
            )
        ).group_by(
            PartsUsage.part_code,
            PartsUsage.part_name
        ).order_by(
            func.count(PartsUsage.id).desc()
        ).limit(10).all()

        part_codes = [p.part_code for p in shortage_parts]

        related_rework = db.query(
            func.count(ReworkRecord.id)
        ).filter(
            and_(
                ReworkRecord.rework_date >= start,
                ReworkRecord.rework_date <= end,
                ReworkRecord.is_parts_related == True
            )
        ).scalar()

        total_orders = db.query(func.count(RepairOrder.id)).filter(
            and_(
                RepairOrder.appointment_date >= start,
                RepairOrder.appointment_date <= end
            )
        ).scalar()

        rework_rate = (related_rework / total_orders * 100) if total_orders > 0 else 0

        key_metrics = {
            'total_shortage_parts': len(shortage_parts),
            'top_shortage_part': shortage_parts[0].part_name if shortage_parts else '',
            'related_rework_count': related_rework,
            'related_rework_rate': round(rework_rate, 2),
            'total_orders': total_orders,
        }

        review = ReviewMaterial(
            review_date=date.today(),
            review_type=review_type,
            title=f"{start_date} 至 {end_date} 配件缺货返修复盘",
            summary="自动生成的配件缺货与返修关联分析报告",
            key_metrics=key_metrics,
            related_part_codes=part_codes,
            caliber_version="v1.0",
            status="draft",
            created_by="system"
        )

        db.add(review)
        db.commit()
        db.refresh(review)

        return {
            'review_id': review.id,
            'title': review.title,
            'key_metrics': key_metrics,
        }

    except Exception as e:
        db.rollback()
        raise self.retry(exc=e, countdown=30)
    finally:
        db.close()


@celery_app.task
def analyze_parts_rework_correlation(part_code: str, caliber_version: str = "v1.0"):
    db = SessionLocal()
    try:
        shortage_orders = db.query(
            PartsUsage.order_id
        ).filter(
            and_(
                PartsUsage.part_code == part_code,
                PartsUsage.is_shortage == True
            )
        ).distinct().all()

        shortage_order_ids = [o.order_id for o in shortage_orders]

        related_rework = db.query(func.count(ReworkRecord.id)).filter(
            and_(
                ReworkRecord.original_order_id.in_(shortage_order_ids),
                ReworkRecord.caliber_version == caliber_version
            )
        ).scalar()

        correlation_rate = (related_rework / len(shortage_order_ids) * 100) if shortage_order_ids else 0

        return {
            'part_code': part_code,
            'shortage_order_count': len(shortage_order_ids),
            'related_rework_count': related_rework,
            'correlation_rate': round(correlation_rate, 2),
            'caliber_version': caliber_version
        }
    finally:
        db.close()
