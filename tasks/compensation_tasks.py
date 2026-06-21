from datetime import datetime, timedelta
from celery_app import celery_app
from models import get_db, Order, Anomaly, SubsidyRule
from config import Config
import logging
import pandas as pd

logger = logging.getLogger(__name__)


def calculate_compensation(order, anomaly_type=None):
    rules = Config.COMPENSATION_RULES
    compensation = 0.0
    breakdown = {}

    base_amount = rules["base_compensation_per_order"]
    distance_comp = (order.distance_km or 0) * rules["distance_rate_per_km"]

    peak_hour = 0
    if order.created_at and order.created_at.hour in rules["peak_hours"]:
        peak_hour = 1

    peak_multiplier = rules["peak_hour_multiplier"] if peak_hour else 1.0

    compensation = (base_amount + distance_comp) * peak_multiplier
    breakdown["base"] = base_amount
    breakdown["distance"] = round(distance_comp, 2)
    breakdown["peak_multiplier"] = peak_multiplier
    breakdown["peak_hour"] = peak_hour

    if anomaly_type == "system_delay":
        delay_comp = rules["system_delay_compensation"]
        compensation += delay_comp
        breakdown["system_delay_compensation"] = delay_comp

    elif anomaly_type == "payment_missing":
        refund = rules["payment_missing_refund"]
        compensation += refund
        breakdown["payment_missing_refund"] = refund

    elif anomaly_type == "rider_reject_spike":
        penalty = rules["rider_reject_penalty"] * (order.reject_count or 1)
        compensation += penalty
        breakdown["rider_reject_penalty"] = round(penalty, 2)

    elif anomaly_type == "map_calibration_change":
        adjustment = rules["map_calibration_adjustment"]
        compensation += adjustment
        breakdown["map_calibration_adjustment"] = adjustment

    if order.subsidy_amount and order.subsidy_amount > 0:
        breakdown["subsidy"] = round(order.subsidy_amount, 2)

    return round(compensation, 2), breakdown


@celery_app.task(bind=True, name="tasks.calculate_order_compensation")
def calculate_order_compensation(self, order_id):
    db = next(get_db())
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"status": "error", "message": "Order not found"}

        anomalies = db.query(Anomaly).filter(Anomaly.order_id == order_id).all()

        total_comp = 0.0
        all_breakdowns = []

        if anomalies:
            for anomaly in anomalies:
                comp, breakdown = calculate_compensation(order, anomaly.anomaly_type)
                total_comp += comp
                all_breakdowns.append({
                    "anomaly_type": anomaly.anomaly_type,
                    "compensation": comp,
                    "breakdown": breakdown,
                })

                if anomaly.compensation_applied == 0:
                    anomaly.compensation_applied = comp

        if not anomalies:
            comp, breakdown = calculate_compensation(order)
            total_comp = comp
            all_breakdowns.append({
                "anomaly_type": "normal",
                "compensation": comp,
                "breakdown": breakdown,
            })

        order.compensation_amount = round(total_comp, 2)
        db.commit()

        return {
            "status": "success",
            "order_id": order_id,
            "total_compensation": round(total_comp, 2),
            "breakdowns": all_breakdowns,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error calculating compensation for order {order_id}: {e}")
        self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        db.close()


@celery_app.task(name="tasks.bulk_calculate_compensation")
def bulk_calculate_compensation(start_date=None, end_date=None):
    db = next(get_db())
    try:
        query = db.query(Order).filter(Order.order_type == "instant")

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        orders = query.all()

        results = []
        for order in orders:
            result = calculate_order_compensation.delay(order.id).get()
            results.append(result)

        total_compensation = sum(r.get("total_compensation", 0) for r in results if r.get("status") == "success")

        return {
            "status": "success",
            "processed": len(results),
            "total_compensation": round(total_compensation, 2),
        }
    except Exception as e:
        logger.error(f"Error in bulk compensation calculation: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.ensure_subsidy_rules_exist")
def ensure_subsidy_rules_exist():
    db = next(get_db())
    try:
        existing = db.query(SubsidyRule).count()
        if existing >= 5:
            return {"status": "exists", "count": existing}

        default_rules = [
            {
                "rule_name": "新用户首单补贴",
                "rule_type": "new_user",
                "conditions": {"user_type": "new", "order_count": 1},
                "subsidy_amount": 10.0,
                "subsidy_percentage": 0,
                "saved_view_name": "新用户补贴订单",
            },
            {
                "rule_name": "远距离订单补贴",
                "rule_type": "distance",
                "conditions": {"min_distance_km": 5.0},
                "subsidy_amount": 0,
                "subsidy_percentage": 0.15,
                "saved_view_name": "远距离订单",
            },
            {
                "rule_name": "高峰时段补贴",
                "rule_type": "peak_hour",
                "conditions": {"hours": [11, 12, 13, 17, 18, 19]},
                "subsidy_amount": 3.0,
                "subsidy_percentage": 0,
                "saved_view_name": "高峰时段订单",
            },
            {
                "rule_name": "恶劣天气补贴",
                "rule_type": "weather",
                "conditions": {"weather": ["rain", "snow", "extreme_heat"]},
                "subsidy_amount": 5.0,
                "subsidy_percentage": 0,
                "saved_view_name": "恶劣天气订单",
            },
            {
                "rule_name": "夜间配送补贴",
                "rule_type": "night",
                "conditions": {"hours": [22, 23, 0, 1, 2, 3, 4, 5, 6]},
                "subsidy_amount": 4.0,
                "subsidy_percentage": 0,
                "saved_view_name": "夜间订单",
            },
        ]

        now = datetime.utcnow()
        for rule_data in default_rules:
            rule = SubsidyRule(
                **rule_data,
                is_active=True,
                effective_from=now - timedelta(days=30),
                effective_to=now + timedelta(days=365),
            )
            db.add(rule)

        db.commit()
        return {"status": "created", "count": len(default_rules)}
    except Exception as e:
        db.rollback()
        logger.error(f"Error ensuring subsidy rules exist: {e}")
        raise
    finally:
        db.close()


def get_compensation_rules_explanation():
    rules = Config.COMPENSATION_RULES
    return {
        "base_compensation": {
            "description": "基础赔付金额",
            "formula": f"固定 {rules['base_compensation_per_order']} 元/单",
            "amount": rules["base_compensation_per_order"],
        },
        "distance_compensation": {
            "description": "距离赔付",
            "formula": f"订单距离 × {rules['distance_rate_per_km']} 元/公里",
            "rate_per_km": rules["distance_rate_per_km"],
        },
        "peak_hour_multiplier": {
            "description": "高峰时段系数",
            "formula": f"高峰时段 {rules['peak_hours']} 点 × {rules['peak_hour_multiplier']}",
            "multiplier": rules["peak_hour_multiplier"],
            "hours": rules["peak_hours"],
        },
        "system_delay_compensation": {
            "description": "系统延迟赔付",
            "formula": f"系统延迟 > 5分钟时额外赔付 {rules['system_delay_compensation']} 元",
            "amount": rules["system_delay_compensation"],
        },
        "payment_missing_refund": {
            "description": "支付流水缺失赔付",
            "formula": f"支付流水缺失时补偿 {rules['payment_missing_refund']} 元",
            "amount": rules["payment_missing_refund"],
        },
        "rider_reject_penalty": {
            "description": "骑手拒单赔付",
            "formula": f"拒单次数 × {rules['rider_reject_penalty']} 元/次",
            "amount_per_reject": rules["rider_reject_penalty"],
        },
        "map_calibration_adjustment": {
            "description": "地图口径变化补偿",
            "formula": f"地图版本变更时调整 {rules['map_calibration_adjustment']} 元",
            "amount": rules["map_calibration_adjustment"],
        },
    }
