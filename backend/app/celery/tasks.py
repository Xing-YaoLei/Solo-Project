from .celery_app import celery_app
from ..database import SessionLocal
from .. import models
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="handle_order_reject")
def handle_order_reject(order_id: int, responsibility: str):
    """处理拒单，按责任范围分派提醒"""
    db = SessionLocal()
    try:
        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order:
            return
        
        reject_records = db.query(models.OrderRejectRecord).filter(
            models.OrderRejectRecord.order_id == order_id,
            models.OrderRejectRecord.is_reminded == False
        ).all()
        
        for record in reject_records:
            record.is_reminded = True
            record.reminded_at = datetime.utcnow()
            
            if responsibility == "rider":
                record.handler = "骑手管理组"
            elif responsibility == "platform":
                record.handler = "运营组"
            elif responsibility == "merchant":
                record.handler = "商家运营"
            elif responsibility == "customer":
                record.handler = "客服组"
            else:
                record.handler = "综合处理组"
            
            logger.info(f"拒单提醒: 订单 {order.order_no}, 责任方 {responsibility}, 处理人 {record.handler}")
        
        db.commit()
        return {"status": "success", "order_id": order_id, "responsibility": responsibility}
    except Exception as e:
        logger.error(f"处理拒单失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="check_order_timeout")
def check_order_timeout():
    """检查订单超时，定时任务"""
    db = SessionLocal()
    try:
        timeout_threshold = datetime.utcnow() - timedelta(minutes=30)
        
        pending_orders = db.query(models.Order).filter(
            models.Order.status == models.OrderStatus.PENDING,
            models.Order.created_at < timeout_threshold
        ).all()
        
        for order in pending_orders:
            logger.warning(f"订单超时待接单: {order.order_no}")
        
        return {"status": "success", "timeout_count": len(pending_orders)}
    except Exception as e:
        logger.error(f"检查订单超时失败: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="generate_compensate_stats")
def generate_compensate_stats(date_str: str = None):
    """生成赔付统计数据"""
    db = SessionLocal()
    try:
        if date_str:
            stat_date = datetime.strptime(date_str, "%Y-%m-%d")
        else:
            stat_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        day_start = stat_date
        day_end = stat_date + timedelta(days=1)
        
        orders = db.query(models.Order).filter(
            models.Order.created_at >= day_start,
            models.Order.created_at < day_end
        ).all()
        
        appeals = db.query(models.Appeal).join(
            models.Order, models.Appeal.order_id == models.Order.id
        ).filter(
            models.Appeal.created_at >= day_start,
            models.Appeal.created_at < day_end
        ).all()
        
        total_orders = len(orders)
        appeal_count = len(appeals)
        appeal_rate = round(appeal_count / total_orders * 100, 2) if total_orders > 0 else 0
        
        resolved_appeals = [a for a in appeals if a.status == "resolved"]
        compensate_amount = sum(a.compensate_amount for a in resolved_appeals)
        compensate_count = len(resolved_appeals)
        
        late_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "late")
        damage_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "damage")
        lost_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "lost")
        other_compensate = sum(
            a.compensate_amount for a in resolved_appeals
            if a.appeal_type not in ["late", "damage", "lost"]
        )
        
        existing_stat = db.query(models.CompensateStat).filter(
            models.CompensateStat.stat_date == stat_date,
            models.CompensateStat.area == None,
            models.CompensateStat.handler == None
        ).first()
        
        if existing_stat:
            existing_stat.total_orders = total_orders
            existing_stat.appeal_count = appeal_count
            existing_stat.appeal_rate = appeal_rate
            existing_stat.compensate_amount = compensate_amount
            existing_stat.compensate_count = compensate_count
            existing_stat.late_compensate = late_compensate
            existing_stat.damage_compensate = damage_compensate
            existing_stat.lost_compensate = lost_compensate
            existing_stat.other_compensate = other_compensate
        else:
            stat = models.CompensateStat(
                stat_date=stat_date,
                total_orders=total_orders,
                appeal_count=appeal_count,
                appeal_rate=appeal_rate,
                compensate_amount=compensate_amount,
                compensate_count=compensate_count,
                late_compensate=late_compensate,
                damage_compensate=damage_compensate,
                lost_compensate=lost_compensate,
                other_compensate=other_compensate
            )
            db.add(stat)
        
        db.commit()
        return {"status": "success", "date": date_str or "today"}
    except Exception as e:
        logger.error(f"生成赔付统计失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="calculate_settlement")
def calculate_settlement(settlement_id: int):
    """计算结算明细"""
    db = SessionLocal()
    try:
        settlement = db.query(models.Settlement).filter(
            models.Settlement.id == settlement_id
        ).first()
        
        if not settlement:
            return
        
        order = settlement.order
        if not order:
            return
        
        detail = []
        
        if order.base_fee > 0:
            detail.append({"type": "base", "name": "基础配送费", "amount": order.base_fee})
        if order.distance_fee > 0:
            detail.append({"type": "distance", "name": "距离加价", "amount": order.distance_fee})
        if order.weight_fee > 0:
            detail.append({"type": "weight", "name": "重量加价", "amount": order.weight_fee})
        if order.subsidy_fee > 0:
            detail.append({"type": "subsidy", "name": "补贴", "amount": order.subsidy_fee})
        if settlement.appeal_compensation > 0:
            detail.append({"type": "compensation", "name": "申诉赔付扣除", "amount": -settlement.appeal_compensation})
        if settlement.penalty_fee > 0:
            detail.append({"type": "penalty", "name": "罚款", "amount": settlement.penalty_fee})
        if settlement.bonus_fee > 0:
            detail.append({"type": "bonus", "name": "奖金", "amount": -settlement.bonus_fee})
        
        total_income = sum(d["amount"] for d in detail)
        settlement.detail = detail
        settlement.total_income = round(total_income, 2)
        
        rider_ratio = 0.8
        settlement.rider_income = round(total_income * rider_ratio, 2)
        settlement.platform_income = round(total_income - settlement.rider_income, 2)
        
        db.commit()
        return {"status": "success", "settlement_id": settlement_id}
    except Exception as e:
        logger.error(f"计算结算明细失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()
