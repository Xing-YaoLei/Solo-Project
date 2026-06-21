import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Tuple
from database.db import get_db_session
from database.models import (
    Order, PaymentTransaction, RiderTrajectory, 
    WarningThreshold, RiskAlert, RiderRejection,
    SubsidyRule, ReviewMaterial
)
from sqlalchemy import func, and_


def get_date_range(time_range: str) -> Tuple[datetime, datetime]:
    end_time = datetime.now()
    
    if time_range == 'today':
        start_time = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == 'yesterday':
        start_time = (end_time - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == '7days':
        start_time = end_time - timedelta(days=7)
    elif time_range == '30days':
        start_time = end_time - timedelta(days=30)
    else:
        start_time = end_time - timedelta(hours=1)
    
    return start_time, end_time


def get_orders_data(start_time: datetime, end_time: datetime) -> pd.DataFrame:
    with get_db_session() as session:
        query = session.query(Order).filter(
            Order.create_time >= start_time,
            Order.create_time <= end_time
        )
        orders = query.all()
        
        data = []
        for o in orders:
            data.append({
                'order_id': o.order_id,
                'order_no': o.order_no,
                'user_id': o.user_id,
                'rider_id': o.rider_id,
                'merchant_id': o.merchant_id,
                'order_type': o.order_type,
                'order_status': o.order_status,
                'pickup_address': o.pickup_address,
                'pickup_lng': float(o.pickup_lng) if o.pickup_lng else None,
                'pickup_lat': float(o.pickup_lat) if o.pickup_lat else None,
                'delivery_address': o.delivery_address,
                'delivery_lng': float(o.delivery_lng) if o.delivery_lng else None,
                'delivery_lat': float(o.delivery_lat) if o.delivery_lat else None,
                'distance_km': float(o.distance_km) if o.distance_km else None,
                'estimated_amount': float(o.estimated_amount) if o.estimated_amount else 0,
                'actual_amount': float(o.actual_amount) if o.actual_amount else 0,
                'subsidy_amount': float(o.subsidy_amount) if o.subsidy_amount else 0,
                'create_time': o.create_time,
                'accept_time': o.accept_time,
                'pickup_time': o.pickup_time,
                'delivery_time': o.delivery_time,
                'cancel_time': o.cancel_time,
                'cancel_reason': o.cancel_reason,
                'is_risk_order': o.is_risk_order,
                'risk_level': o.risk_level,
                'data_source': o.data_source
            })
        
        return pd.DataFrame(data)


def get_payments_data(start_time: datetime, end_time: datetime) -> pd.DataFrame:
    with get_db_session() as session:
        query = session.query(PaymentTransaction).filter(
            PaymentTransaction.pay_time >= start_time,
            PaymentTransaction.pay_time <= end_time
        )
        payments = query.all()
        
        data = []
        for p in payments:
            data.append({
                'txn_id': p.txn_id,
                'order_id': p.order_id,
                'user_id': p.user_id,
                'pay_type': p.pay_type,
                'pay_amount': float(p.pay_amount),
                'pay_status': p.pay_status,
                'pay_time': p.pay_time,
                'refund_amount': float(p.refund_amount) if p.refund_amount else 0,
                'refund_time': p.refund_time,
                'data_source': p.data_source
            })
        
        return pd.DataFrame(data)


def get_trajectories_data(rider_id: Optional[str] = None,
                          order_id: Optional[str] = None,
                          start_time: Optional[datetime] = None,
                          end_time: Optional[datetime] = None) -> pd.DataFrame:
    with get_db_session() as session:
        query = session.query(RiderTrajectory)
        
        conditions = []
        if rider_id:
            conditions.append(RiderTrajectory.rider_id == rider_id)
        if order_id:
            conditions.append(RiderTrajectory.order_id == order_id)
        if start_time:
            conditions.append(RiderTrajectory.record_time >= start_time)
        if end_time:
            conditions.append(RiderTrajectory.record_time <= end_time)
        
        if conditions:
            query = query.filter(and_(*conditions))
        
        query = query.order_by(RiderTrajectory.record_time)
        trajectories = query.all()
        
        data = []
        for t in trajectories:
            data.append({
                'traj_id': t.traj_id,
                'rider_id': t.rider_id,
                'order_id': t.order_id,
                'lng': float(t.lng),
                'lat': float(t.lat),
                'speed_kmh': float(t.speed_kmh) if t.speed_kmh else None,
                'heading': float(t.heading) if t.heading else None,
                'accuracy_m': float(t.accuracy_m) if t.accuracy_m else None,
                'record_time': t.record_time
            })
        
        return pd.DataFrame(data)


def get_thresholds_data() -> List[Dict]:
    with get_db_session() as session:
        thresholds = session.query(WarningThreshold).all()
        
        data = []
        for t in thresholds:
            data.append({
                'threshold_id': t.threshold_id,
                'metric_code': t.metric_code,
                'metric_name': t.metric_name,
                'metric_category': t.metric_category,
                'warning_level': t.warning_level,
                'operator': t.operator,
                'threshold_value': float(t.threshold_value),
                'unit': t.unit,
                'description': t.description,
                'is_active': t.is_active,
                'updated_by': t.updated_by,
                'created_at': t.created_at,
                'updated_at': t.updated_at
            })
        
        return data


def get_alerts_data(start_time: Optional[datetime] = None,
                    end_time: Optional[datetime] = None,
                    limit: int = 100) -> List[Dict]:
    with get_db_session() as session:
        query = session.query(RiskAlert).order_by(RiskAlert.alert_time.desc())
        
        conditions = []
        if start_time:
            conditions.append(RiskAlert.alert_time >= start_time)
        if end_time:
            conditions.append(RiskAlert.alert_time <= end_time)
        
        if conditions:
            query = query.filter(and_(*conditions))
        
        alerts = query.limit(limit).all()
        
        data = []
        for a in alerts:
            data.append({
                'alert_id': a.alert_id,
                'alert_type': a.alert_type,
                'alert_level': a.alert_level,
                'order_id': a.order_id,
                'rider_id': a.rider_id,
                'metric_code': a.metric_code,
                'alert_value': float(a.alert_value) if a.alert_value else None,
                'threshold_value': float(a.threshold_value) if a.threshold_value else None,
                'alert_message': a.alert_message,
                'alert_time': a.alert_time.strftime('%Y-%m-%d %H:%M:%S'),
                'is_handled': '已处理' if a.is_handled else '待处理',
                'handled_by': a.handled_by,
                'handled_time': a.handled_time,
                'handle_note': a.handle_note
            })
        
        return data


def get_subsidy_rules() -> List[Dict]:
    with get_db_session() as session:
        rules = session.query(SubsidyRule).order_by(SubsidyRule.priority.desc()).all()
        
        data = []
        for r in rules:
            data.append({
                'rule_id': r.rule_id,
                'rule_name': r.rule_name,
                'rule_type': r.rule_type,
                'effective_start': r.effective_start.strftime('%Y-%m-%d %H:%M'),
                'effective_end': r.effective_end.strftime('%Y-%m-%d %H:%M'),
                'condition_params': r.condition_params,
                'subsidy_calc': r.subsidy_calc,
                'max_subsidy_per_order': float(r.max_subsidy_per_order) if r.max_subsidy_per_order else 0,
                'daily_quota': float(r.daily_quota) if r.daily_quota else 0,
                'used_amount': float(r.used_amount) if r.used_amount else 0,
                'is_active': '启用' if r.is_active else '禁用',
                'priority': r.priority
            })
        
        return data


def get_rejections_data(start_time: datetime, end_time: datetime,
                        rider_id: Optional[str] = None) -> pd.DataFrame:
    with get_db_session() as session:
        query = session.query(RiderRejection).filter(
            RiderRejection.reject_time >= start_time,
            RiderRejection.reject_time <= end_time
        )
        
        if rider_id:
            query = query.filter(RiderRejection.rider_id == rider_id)
        
        rejections = query.all()
        
        data = []
        for r in rejections:
            data.append({
                'rejection_id': r.rejection_id,
                'order_id': r.order_id,
                'rider_id': r.rider_id,
                'reject_reason': r.reject_reason,
                'reject_time': r.reject_time,
                'dispatch_count': r.dispatch_count,
                'compensation_amount': float(r.compensation_amount) if r.compensation_amount else 0,
                'is_verified': r.is_verified,
                'verification_note': r.verification_note
            })
        
        return pd.DataFrame(data)


def calculate_overview_metrics(orders_df: pd.DataFrame, 
                               payments_df: pd.DataFrame,
                               rejections_df: pd.DataFrame,
                               alerts: List[Dict]) -> Dict:
    if orders_df.empty:
        return {
            'total_orders': 0,
            'completed_orders': 0,
            'cancelled_orders': 0,
            'risk_orders': 0,
            'completion_rate': '0%',
            'cancel_rate': '0%',
            'risk_rate': '0%',
            'total_revenue': '0',
            'total_subsidy': '0',
            'subsidy_per_order': '0 元/单',
            'total_compensation': '0',
            'compensation_per_rejection': '0 元/次',
            'avg_order_value': '0',
            'avg_delivery_time': '0',
            'delivery_p95': '0',
            'rejection_rate': '0%',
            'rejection_count': '0 次',
            'alert_count': '0',
            'unhandled_alerts': '0 条未处理'
        }
    
    total_orders = len(orders_df)
    completed = len(orders_df[orders_df['order_status'] == 'delivered'])
    cancelled = len(orders_df[orders_df['order_status'] == 'cancelled'])
    risk_orders = len(orders_df[orders_df['is_risk_order'] == True])
    
    total_revenue = payments_df['pay_amount'].sum() if not payments_df.empty else 0
    total_subsidy = orders_df['subsidy_amount'].sum()
    total_compensation = rejections_df['compensation_amount'].sum() if not rejections_df.empty else 0
    
    completed_orders = orders_df[orders_df['order_status'] == 'delivered']
    delivery_times = []
    for _, row in completed_orders.iterrows():
        if pd.notna(row['pickup_time']) and pd.notna(row['delivery_time']):
            duration = (row['delivery_time'] - row['pickup_time']).total_seconds() / 60
            delivery_times.append(duration)
    
    avg_delivery_time = np.mean(delivery_times) if delivery_times else 0
    delivery_p95 = np.percentile(delivery_times, 95) if delivery_times else 0
    
    rejection_count = len(rejections_df) if not rejections_df.empty else 0
    rejection_rate = rejection_count / max(total_orders, 1)
    
    unhandled_alerts = sum(1 for a in alerts if a['is_handled'] == '待处理')
    
    return {
        'total_orders': f'{total_orders:,}',
        'completed_orders': f'{completed:,}',
        'cancelled_orders': f'{cancelled:,}',
        'risk_orders': f'{risk_orders:,}',
        'completion_rate': f'{completed/total_orders:.1%}',
        'cancel_rate': f'{cancelled/total_orders:.1%}',
        'risk_rate': f'{risk_orders/total_orders:.1%}',
        'total_revenue': f'{total_revenue:,.2f}',
        'total_subsidy': f'{total_subsidy:,.2f}',
        'subsidy_per_order': f'{total_subsidy/max(total_orders,1):.2f} 元/单',
        'total_compensation': f'{total_compensation:,.2f}',
        'compensation_per_rejection': f'{total_compensation/max(rejection_count,1):.2f} 元/次',
        'avg_order_value': f'{total_revenue/max(total_orders,1):.2f}',
        'avg_delivery_time': f'{avg_delivery_time:.1f}',
        'delivery_p95': f'{delivery_p95:.1f}',
        'rejection_rate': f'{rejection_rate:.1%}',
        'rejection_count': f'{rejection_count:,} 次',
        'alert_count': f'{len(alerts):,}',
        'unhandled_alerts': f'{unhandled_alerts} 条未处理'
    }
