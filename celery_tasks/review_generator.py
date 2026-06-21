import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from celery_tasks.celery_app import celery
from database.db import get_db_session
from database.models import Order, RiderRejection, ReviewMaterial, PaymentTransaction, RiskAlert
import uuid
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@celery.task
def generate_daily_review(review_date: str = None):
    try:
        if review_date:
            review_date_obj = datetime.strptime(review_date, '%Y-%m-%d').date()
        else:
            review_date_obj = (datetime.now() - timedelta(days=1)).date()
        
        logger.info(f"Generating daily review for {review_date_obj}")
        
        start_date = review_date_obj
        end_date = review_date_obj
        
        result = generate_review_material('daily', start_date, end_date)
        
        return {
            'status': 'success',
            'review_id': result['review_id'],
            'date': str(review_date_obj),
            'summary': result['summary']
        }
        
    except Exception as e:
        logger.error(f"Error generating daily review: {str(e)}")
        raise


@celery.task
def generate_weekly_review(year: int, week: int):
    try:
        start_date = date.fromisocalendar(year, week, 1)
        end_date = date.fromisocalendar(year, week, 7)
        
        logger.info(f"Generating weekly review for {start_date} to {end_date}")
        
        result = generate_review_material('weekly', start_date, end_date)
        
        return {
            'status': 'success',
            'review_id': result['review_id'],
            'start_date': str(start_date),
            'end_date': str(end_date),
            'summary': result['summary']
        }
        
    except Exception as e:
        logger.error(f"Error generating weekly review: {str(e)}")
        raise


@celery.task
def generate_rider_review(rider_id: str, start_date: str, end_date: str):
    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        logger.info(f"Generating rider review for {rider_id} from {start_date_obj} to {end_date_obj}")
        
        result = generate_review_material('rider', start_date_obj, end_date_obj, rider_id)
        
        return {
            'status': 'success',
            'review_id': result['review_id'],
            'rider_id': rider_id,
            'start_date': str(start_date_obj),
            'end_date': str(end_date_obj),
            'summary': result['summary']
        }
        
    except Exception as e:
        logger.error(f"Error generating rider review: {str(e)}")
        raise


def generate_review_material(review_type: str, start_date: date, end_date: date, 
                             rider_id: Optional[str] = None, 
                             created_by: str = 'system') -> Dict[str, Any]:
    with get_db_session() as session:
        order_query = session.query(Order).filter(
            Order.create_time >= datetime.combine(start_date, datetime.min.time()),
            Order.create_time <= datetime.combine(end_date, datetime.max.time())
        )
        
        if rider_id:
            order_query = order_query.filter(Order.rider_id == rider_id)
        
        orders = order_query.all()
        order_ids = [o.order_id for o in orders]
        
        total_orders = len(orders)
        
        rejection_query = session.query(RiderRejection).filter(
            RiderRejection.reject_time >= datetime.combine(start_date, datetime.min.time()),
            RiderRejection.reject_time <= datetime.combine(end_date, datetime.max.time())
        )
        if rider_id:
            rejection_query = rejection_query.filter(RiderRejection.rider_id == rider_id)
        
        rejections = rejection_query.all()
        rejection_count = len(rejections)
        rejection_rate = rejection_count / max(total_orders, 1)
        
        total_compensation = sum(float(r.compensation_amount or 0) for r in rejections)
        avg_compensation = total_compensation / max(rejection_count, 1)
        
        risk_query = session.query(Order).filter(
            Order.order_id.in_(order_ids),
            Order.is_risk_order == True
        )
        risk_orders = risk_query.count()
        
        payment_query = session.query(PaymentTransaction).filter(
            PaymentTransaction.order_id.in_(order_ids)
        )
        total_payments = payment_query.count()
        total_paid = sum(float(p.pay_amount or 0) for p in payment_query.all())
        total_refund = sum(float(p.refund_amount or 0) for p in payment_query.all())
        
        alert_query = session.query(RiskAlert).filter(
            RiskAlert.alert_time >= datetime.combine(start_date, datetime.min.time()),
            RiskAlert.alert_time <= datetime.combine(end_date, datetime.max.time())
        )
        if rider_id:
            alert_query = alert_query.filter(RiskAlert.rider_id == rider_id)
        
        alerts = alert_query.all()
        critical_alerts = [a for a in alerts if a.alert_level == 'critical']
        warning_alerts = [a for a in alerts if a.alert_level == 'warning']
        
        delivered_orders = [o for o in orders if o.order_status == 'delivered']
        cancelled_orders = [o for o in orders if o.order_status == 'cancelled']
        
        delivery_durations = []
        for o in delivered_orders:
            if o.pickup_time and o.delivery_time:
                duration = (o.delivery_time - o.pickup_time).total_seconds() / 60
                delivery_durations.append(duration)
        
        avg_delivery_time = np.mean(delivery_durations) if delivery_durations else 0
        delivery_time_p95 = np.percentile(delivery_durations, 95) if delivery_durations else 0
        
        subsidy_total = sum(float(o.subsidy_amount or 0) for o in orders)
        subsidy_per_order = subsidy_total / max(total_orders, 1)
        
        material_data = {
            'order_statistics': {
                'total_orders': total_orders,
                'delivered_count': len(delivered_orders),
                'cancelled_count': len(cancelled_orders),
                'delivery_rate': len(delivered_orders) / max(total_orders, 1),
                'cancel_rate': len(cancelled_orders) / max(total_orders, 1)
            },
            'rejection_analysis': {
                'total_rejections': rejection_count,
                'rejection_rate': rejection_rate,
                'total_compensation': total_compensation,
                'avg_compensation_per_rejection': avg_compensation,
                'rejection_reasons': _analyze_rejection_reasons(rejections),
                'top_rejected_riders': _get_top_rejected_riders(rejections, rider_id)
            },
            'compensation_breakdown': _calculate_compensation_breakdown(rejections),
            'delivery_performance': {
                'avg_delivery_time': avg_delivery_time,
                'delivery_time_p95': delivery_time_p95,
                'delivery_time_distribution': _calculate_delivery_time_distribution(delivery_durations)
            },
            'financial_summary': {
                'total_paid': total_paid,
                'total_refund': total_refund,
                'total_subsidy': subsidy_total,
                'subsidy_per_order': subsidy_per_order,
                'avg_order_value': total_paid / max(total_orders, 1)
            },
            'risk_analysis': {
                'total_risk_orders': risk_orders,
                'risk_order_ratio': risk_orders / max(total_orders, 1),
                'total_alerts': len(alerts),
                'critical_alerts': len(critical_alerts),
                'warning_alerts': len(warning_alerts),
                'unhandled_alerts': len([a for a in alerts if not a.is_handled]),
                'top_risk_factors': _get_top_risk_factors(alerts)
            },
            'order_type_distribution': _calculate_order_type_distribution(orders),
            'time_distribution': _calculate_time_distribution(orders)
        }
        
        summary = _generate_summary_text(
            review_type, start_date, end_date, total_orders, rejection_count,
            rejection_rate, total_compensation, avg_compensation,
            risk_orders, len(alerts), rider_id
        )
        
        review = ReviewMaterial(
            review_id=str(uuid.uuid4()),
            review_type=review_type,
            rider_id=rider_id,
            start_date=start_date,
            end_date=end_date,
            total_orders=total_orders,
            rejection_count=rejection_count,
            rejection_rate=rejection_rate,
            total_compensation=total_compensation,
            avg_compensation=avg_compensation,
            risk_orders=risk_orders,
            material_data=material_data,
            summary=summary,
            created_by=created_by
        )
        
        session.add(review)
        session.commit()
        
        return {
            'review_id': review.review_id,
            'summary': summary,
            'material_data': material_data
        }


def _analyze_rejection_reasons(rejections: List[RiderRejection]) -> Dict[str, int]:
    reasons = {}
    for r in rejections:
        reason = r.reject_reason or '未说明原因'
        reasons[reason] = reasons.get(reason, 0) + 1
    return dict(sorted(reasons.items(), key=lambda x: x[1], reverse=True)[:10])


def _get_top_rejected_riders(rejections: List[RiderRejection], exclude_rider: Optional[str]) -> List[Dict]:
    rider_counts = {}
    rider_compensation = {}
    
    for r in rejections:
        if exclude_rider and r.rider_id != exclude_rider:
            continue
        rider_counts[r.rider_id] = rider_counts.get(r.rider_id, 0) + 1
        rider_compensation[r.rider_id] = rider_compensation.get(r.rider_id, 0) + float(r.compensation_amount or 0)
    
    result = []
    for rider_id, count in sorted(rider_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        result.append({
            'rider_id': rider_id,
            'rejection_count': count,
            'total_compensation': rider_compensation[rider_id]
        })
    
    return result


def _calculate_compensation_breakdown(rejections: List[RiderRejection]) -> Dict[str, Any]:
    total = sum(float(r.compensation_amount or 0) for r in rejections)
    
    reason_compensation = {}
    for r in rejections:
        reason = r.reject_reason or '未说明原因'
        reason_compensation[reason] = reason_compensation.get(reason, 0) + float(r.compensation_amount or 0)
    
    return {
        'total': total,
        'by_reason': dict(sorted(reason_compensation.items(), key=lambda x: x[1], reverse=True)),
        'distribution': _calculate_compensation_distribution(rejections)
    }


def _calculate_compensation_distribution(rejections: List[RiderRejection]) -> Dict[str, int]:
    ranges = {'0-5元': 0, '5-10元': 0, '10-20元': 0, '20-50元': 0, '50元以上': 0}
    
    for r in rejections:
        comp = float(r.compensation_amount or 0)
        if comp <= 5:
            ranges['0-5元'] += 1
        elif comp <= 10:
            ranges['5-10元'] += 1
        elif comp <= 20:
            ranges['10-20元'] += 1
        elif comp <= 50:
            ranges['20-50元'] += 1
        else:
            ranges['50元以上'] += 1
    
    return ranges


def _calculate_delivery_time_distribution(durations: List[float]) -> Dict[str, int]:
    ranges = {'<15分钟': 0, '15-30分钟': 0, '30-45分钟': 0, '45-60分钟': 0, '>60分钟': 0}
    
    for d in durations:
        if d < 15:
            ranges['<15分钟'] += 1
        elif d < 30:
            ranges['15-30分钟'] += 1
        elif d < 45:
            ranges['30-45分钟'] += 1
        elif d < 60:
            ranges['45-60分钟'] += 1
        else:
            ranges['>60分钟'] += 1
    
    return ranges


def _calculate_order_type_distribution(orders: List[Order]) -> Dict[str, int]:
    types = {}
    for o in orders:
        otype = o.order_type or 'unknown'
        types[otype] = types.get(otype, 0) + 1
    return types


def _calculate_time_distribution(orders: List[Order]) -> Dict[str, int]:
    hours = {f'{h:02d}:00': 0 for h in range(24)}
    
    for o in orders:
        if o.create_time:
            hour_key = f'{o.create_time.hour:02d}:00'
            hours[hour_key] = hours.get(hour_key, 0) + 1
    
    return hours


def _get_top_risk_factors(alerts: List[RiskAlert]) -> List[Dict]:
    factors = {}
    for a in alerts:
        if a.metric_code:
            factors[a.metric_code] = factors.get(a.metric_code, 0) + 1
        elif a.alert_type:
            factors[a.alert_type] = factors.get(a.alert_type, 0) + 1
    
    result = []
    for code, count in sorted(factors.items(), key=lambda x: x[1], reverse=True)[:10]:
        result.append({
            'factor': code,
            'count': count
        })
    
    return result


def _generate_summary_text(review_type: str, start_date: date, end_date: date,
                           total_orders: int, rejection_count: int,
                           rejection_rate: float, total_compensation: float,
                           avg_compensation: float, risk_orders: int,
                           alert_count: int, rider_id: Optional[str]) -> str:
    if rider_id:
        subject = f"骑手 {rider_id}"
    elif review_type == 'daily':
        subject = f"{start_date}"
    elif review_type == 'weekly':
        subject = f"{start_date} 至 {end_date}"
    else:
        subject = f"{start_date} 至 {end_date}"
    
    summary_parts = [
        f"【{subject}】跑腿订单风险复盘报告",
        f"",
        f"一、订单概况",
        f"  总订单量: {total_orders} 单",
        f"  风险订单: {risk_orders} 单 (占比 {risk_orders/max(total_orders,1):.2%})",
        f"",
        f"二、拒单与赔付分析",
        f"  拒单次数: {rejection_count} 次",
        f"  拒单率: {rejection_rate:.2%}",
        f"  赔付总额: {total_compensation:.2f} 元",
        f"  次均赔付: {avg_compensation:.2f} 元",
        f"",
        f"三、风险预警",
        f"  预警总数: {alert_count} 条",
        f"",
        f"四、优化建议",
    ]
    
    if rejection_rate > 0.1:
        summary_parts.append(f"  - 拒单率偏高，建议分析骑手派单合理性，优化派单算法")
    if total_compensation > total_orders * 2:
        summary_parts.append(f"  - 赔付成本较高，建议核查拒单原因，完善补贴规则")
    if risk_orders / max(total_orders, 1) > 0.05:
        summary_parts.append(f"  - 风险订单占比偏高，建议加强实时监控，及时干预")
    
    if len(summary_parts) == 8:
        summary_parts.append(f"  - 整体运营指标正常，继续保持监控")
    
    return "\n".join(summary_parts)


def get_review_materials(review_type: Optional[str] = None, 
                         rider_id: Optional[str] = None,
                         start_date: Optional[date] = None,
                         end_date: Optional[date] = None,
                         limit: int = 100) -> List[Dict]:
    with get_db_session() as session:
        query = session.query(ReviewMaterial)
        
        if review_type:
            query = query.filter(ReviewMaterial.review_type == review_type)
        if rider_id:
            query = query.filter(ReviewMaterial.rider_id == rider_id)
        if start_date:
            query = query.filter(ReviewMaterial.start_date >= start_date)
        if end_date:
            query = query.filter(ReviewMaterial.end_date <= end_date)
        
        materials = query.order_by(ReviewMaterial.created_at.desc()).limit(limit).all()
        
        return [{
            'review_id': m.review_id,
            'review_type': m.review_type,
            'rider_id': m.rider_id,
            'start_date': str(m.start_date),
            'end_date': str(m.end_date),
            'total_orders': m.total_orders,
            'rejection_count': m.rejection_count,
            'rejection_rate': float(m.rejection_rate) if m.rejection_rate else 0,
            'total_compensation': float(m.total_compensation) if m.total_compensation else 0,
            'avg_compensation': float(m.avg_compensation) if m.avg_compensation else 0,
            'risk_orders': m.risk_orders,
            'summary': m.summary,
            'created_at': str(m.created_at)
        } for m in materials]
