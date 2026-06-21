import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
from celery_tasks.celery_app import celery
from database.db import get_db_session
from database.models import Order, RiderTrajectory, WarningThreshold, RiskAlert, RiderRejection, PaymentTransaction
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@celery.task(bind=True)
def calculate_realtime_risk(self, lookback_minutes: int = 30):
    try:
        logger.info(f"Calculating real-time risk for last {lookback_minutes} minutes")
        
        risk_results = []
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=lookback_minutes)
        
        with get_db_session() as session:
            orders = session.query(Order).filter(
                Order.create_time >= start_time,
                Order.create_time <= end_time
            ).all()
            
            for order in orders:
                risk_score, risk_level, risk_factors = _assess_order_risk(order, session)
                
                if risk_level != 'normal':
                    order.is_risk_order = True
                    order.risk_level = risk_level
                    
                    if risk_score > 0.7:
                        alert = RiskAlert(
                            alert_id=str(uuid.uuid4()),
                            alert_type='order_risk',
                            alert_level='critical' if risk_score > 0.85 else 'warning',
                            order_id=order.order_id,
                            rider_id=order.rider_id,
                            alert_value=float(risk_score),
                            threshold_value=0.7,
                            alert_message=f"订单风险评分: {risk_score:.2f}, 风险因素: {', '.join(risk_factors)}",
                            alert_time=datetime.now()
                        )
                        session.add(alert)
                    
                    risk_results.append({
                        'order_id': order.order_id,
                        'risk_score': risk_score,
                        'risk_level': risk_level,
                        'risk_factors': risk_factors
                    })
            
            session.commit()
        
        logger.info(f"Risk calculation completed. Found {len(risk_results)} high-risk orders")
        return {
            'status': 'success',
            'total_orders': len(orders),
            'high_risk_orders': len(risk_results),
            'risk_details': risk_results
        }
        
    except Exception as e:
        logger.error(f"Error calculating real-time risk: {str(e)}")
        raise


def _assess_order_risk(order: Order, session) -> tuple:
    risk_score = 0.0
    risk_factors = []
    weights = {
        'rejection_rate': 0.25,
        'abnormal_amount': 0.2,
        'short_delivery': 0.15,
        'cancel_rate': 0.2,
        'location_anomaly': 0.2
    }

    if order.rider_id:
        rider_rejection_rate = _get_rider_rejection_rate(order.rider_id, session)
        if rider_rejection_rate > 0.3:
            risk_score += weights['rejection_rate'] * (rider_rejection_rate / 0.5)
            risk_factors.append(f'骑手拒单率过高({rider_rejection_rate:.2%})')

    if order.estimated_amount and order.actual_amount:
        amount_ratio = abs(order.actual_amount - order.estimated_amount) / order.estimated_amount
        if amount_ratio > 0.3:
            risk_score += weights['abnormal_amount'] * min(amount_ratio, 1)
            risk_factors.append(f'金额异常(偏差{amount_ratio:.2%})')

    if order.distance_km and order.delivery_time and order.pickup_time:
        delivery_duration = (order.delivery_time - order.pickup_time).total_seconds() / 60
        if delivery_duration > 0:
            expected_duration = order.distance_km * 8 + 10
            if delivery_duration < expected_duration * 0.5:
                risk_score += weights['short_delivery']
                risk_factors.append('配送时长过短')

    if order.rider_id:
        rider_cancel_rate = _get_rider_cancel_rate(order.rider_id, session)
        if rider_cancel_rate > 0.2:
            risk_score += weights['cancel_rate'] * (rider_cancel_rate / 0.4)
            risk_factors.append(f'骑手取消率过高({rider_cancel_rate:.2%})')

    if order.pickup_lng and order.delivery_lng:
        distance = _calculate_distance(
            float(order.pickup_lng), float(order.pickup_lat),
            float(order.delivery_lng), float(order.delivery_lat)
        )
        if order.distance_km and abs(distance - float(order.distance_km)) / float(order.distance_km) > 0.5:
            risk_score += weights['location_anomaly']
            risk_factors.append('地址距离异常')

    if risk_score >= 0.8:
        risk_level = 'critical'
    elif risk_score >= 0.5:
        risk_level = 'high'
    elif risk_score >= 0.3:
        risk_level = 'medium'
    else:
        risk_level = 'normal'

    return risk_score, risk_level, risk_factors


def _get_rider_rejection_rate(rider_id: str, session) -> float:
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    total_dispatches = session.query(RiderRejection).filter(
        RiderRejection.rider_id == rider_id,
        RiderRejection.reject_time >= start_time,
        RiderRejection.reject_time <= end_time
    ).count()
    
    if total_dispatches == 0:
        return 0.0
    
    rejections = session.query(RiderRejection).filter(
        RiderRejection.rider_id == rider_id,
        RiderRejection.reject_time >= start_time,
        RiderRejection.reject_time <= end_time
    ).count()
    
    return rejections / max(total_dispatches, 1)


def _get_rider_cancel_rate(rider_id: str, session) -> float:
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    total_orders = session.query(Order).filter(
        Order.rider_id == rider_id,
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    if total_orders == 0:
        return 0.0
    
    cancelled_orders = session.query(Order).filter(
        Order.rider_id == rider_id,
        Order.order_status == 'cancelled',
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    return cancelled_orders / total_orders


def _calculate_distance(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371.0
    
    lng1, lat1, lng2, lat2 = map(radians, [lng1, lat1, lng2, lat2])
    
    d_lng = lng2 - lng1
    d_lat = lat2 - lat1
    
    a = sin(d_lat / 2)**2 + cos(lat1) * cos(lat2) * sin(d_lng / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c


@celery.task(bind=True)
def check_warning_thresholds(self):
    try:
        logger.info("Checking warning thresholds")
        
        alerts = []
        
        with get_db_session() as session:
            thresholds = session.query(WarningThreshold).filter(
                WarningThreshold.is_active == True
            ).all()
            
            for threshold in thresholds:
                current_value = _get_metric_value(threshold.metric_code, session)
                
                if current_value is None:
                    continue
                
                is_alert = _evaluate_threshold(current_value, threshold)
                
                if is_alert:
                    alert = RiskAlert(
                        alert_id=str(uuid.uuid4()),
                        alert_type='threshold_breach',
                        alert_level=threshold.warning_level,
                        metric_code=threshold.metric_code,
                        alert_value=float(current_value),
                        threshold_value=float(threshold.threshold_value),
                        alert_message=f"{threshold.metric_name} {threshold.operator} {threshold.threshold_value}{threshold.unit or ''}, 当前值: {current_value:.2f}{threshold.unit or ''}",
                        alert_time=datetime.now()
                    )
                    session.add(alert)
                    alerts.append({
                        'metric_code': threshold.metric_code,
                        'metric_name': threshold.metric_name,
                        'current_value': current_value,
                        'threshold': float(threshold.threshold_value),
                        'level': threshold.warning_level
                    })
            
            session.commit()
        
        logger.info(f"Threshold check completed. Generated {len(alerts)} alerts")
        return {
            'status': 'success',
            'alerts_generated': len(alerts),
            'alert_details': alerts
        }
        
    except Exception as e:
        logger.error(f"Error checking warning thresholds: {str(e)}")
        raise


def _get_metric_value(metric_code: str, session) -> float:
    end_time = datetime.now()
    
    metrics = {
        'realtime_rejection_rate': lambda: _calc_realtime_rejection_rate(session, end_time),
        'hourly_cancel_rate': lambda: _calc_hourly_cancel_rate(session, end_time),
        'avg_delivery_time': lambda: _calc_avg_delivery_time(session, end_time),
        'subsidy_per_order': lambda: _calc_subsidy_per_order(session, end_time),
        'risk_order_ratio': lambda: _calc_risk_order_ratio(session, end_time),
        'payment_failure_rate': lambda: _calc_payment_failure_rate(session, end_time)
    }
    
    calc_func = metrics.get(metric_code)
    if calc_func:
        return calc_func()
    return None


def _calc_realtime_rejection_rate(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(minutes=30)
    
    dispatches = session.query(RiderRejection).filter(
        RiderRejection.reject_time >= start_time,
        RiderRejection.reject_time <= end_time
    ).count()
    
    if dispatches == 0:
        return 0.0
    
    rejections = dispatches
    total_orders = session.query(Order).filter(
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    return rejections / max(total_orders, 1)


def _calc_hourly_cancel_rate(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(hours=1)
    
    total_orders = session.query(Order).filter(
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    if total_orders == 0:
        return 0.0
    
    cancelled = session.query(Order).filter(
        Order.order_status == 'cancelled',
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    return cancelled / total_orders


def _calc_avg_delivery_time(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(hours=1)
    
    orders = session.query(Order).filter(
        Order.order_status == 'delivered',
        Order.delivery_time >= start_time,
        Order.delivery_time <= end_time,
        Order.pickup_time.isnot(None)
    ).all()
    
    if not orders:
        return 0.0
    
    durations = []
    for order in orders:
        if order.pickup_time and order.delivery_time:
            duration = (order.delivery_time - order.pickup_time).total_seconds() / 60
            durations.append(duration)
    
    return np.mean(durations) if durations else 0.0


def _calc_subsidy_per_order(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(hours=1)
    
    result = session.query(
        func.avg(Order.subsidy_amount)
    ).filter(
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).scalar()
    
    return float(result or 0)


def _calc_risk_order_ratio(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(hours=1)
    
    total = session.query(Order).filter(
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    if total == 0:
        return 0.0
    
    risk_orders = session.query(Order).filter(
        Order.is_risk_order == True,
        Order.create_time >= start_time,
        Order.create_time <= end_time
    ).count()
    
    return risk_orders / total


def _calc_payment_failure_rate(session, end_time: datetime) -> float:
    start_time = end_time - timedelta(hours=1)
    
    total = session.query(PaymentTransaction).filter(
        PaymentTransaction.pay_time >= start_time,
        PaymentTransaction.pay_time <= end_time
    ).count()
    
    if total == 0:
        return 0.0
    
    failures = session.query(PaymentTransaction).filter(
        PaymentTransaction.pay_status == 'failed',
        PaymentTransaction.pay_time >= start_time,
        PaymentTransaction.pay_time <= end_time
    ).count()
    
    return failures / total


def _evaluate_threshold(value: float, threshold: WarningThreshold) -> bool:
    op = threshold.operator
    threshold_val = float(threshold.threshold_value)
    
    operators = {
        '>': lambda v, t: v > t,
        '>=': lambda v, t: v >= t,
        '<': lambda v, t: v < t,
        '<=': lambda v, t: v <= t,
        '==': lambda v, t: v == t,
        '!=': lambda v, t: v != t
    }
    
    eval_func = operators.get(op)
    return eval_func(value, threshold_val) if eval_func else False


from sqlalchemy import func
