import uuid
import random
import sys
import os
from datetime import datetime, timedelta
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_db_session
from database.models import (
    Order, PaymentTransaction, RiderTrajectory,
    SubsidyRule, RiderRejection, RiskAlert
)


CITIES = {
    'beijing': {'name': '北京', 'center_lng': 116.4074, 'center_lat': 39.9042, 'range': 0.15},
    'shanghai': {'name': '上海', 'center_lng': 121.4737, 'center_lat': 31.2304, 'range': 0.15},
    'guangzhou': {'name': '广州', 'center_lng': 113.2644, 'center_lat': 23.1291, 'range': 0.12},
    'shenzhen': {'name': '深圳', 'center_lng': 114.0579, 'center_lat': 22.5431, 'range': 0.12}
}

ORDER_TYPES = ['instant_delivery', 'same_city', 'errand', 'purchase']
ORDER_STATUS = ['pending', 'accepted', 'picked', 'delivered', 'cancelled']
PAY_TYPES = ['alipay', 'wechat', 'balance']
REJECT_REASONS = ['距离过远', '地址不详细', '订单金额低', '时间冲突', '无法联系用户']


def generate_coords(city_key):
    city = CITIES[city_key]
    return (
        round(city['center_lng'] + random.uniform(-city['range'], city['range']), 7),
        round(city['center_lat'] + random.uniform(-city['range'], city['range']), 7)
    )


def generate_orders(count=100, days=7):
    print(f"正在生成 {count} 条订单数据...")
    city_keys = list(CITIES.keys())
    orders = []
    
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    
    with get_db_session() as session:
        for i in range(count):
            order_id = str(uuid.uuid4())
            city_key = random.choice(city_keys)
            pickup_lng, pickup_lat = generate_coords(city_key)
            delivery_lng, delivery_lat = generate_coords(city_key)
            
            create_time = start_time + timedelta(
                seconds=random.randint(0, int((end_time - start_time).total_seconds()))
            )
            
            distance = round(random.uniform(0.5, 15.0), 2)
            estimated_amount = round(random.uniform(8, 80) + distance * 1.5, 2)
            actual_amount = round(estimated_amount * random.uniform(0.9, 1.1), 2)
            subsidy_amount = round(random.uniform(0, 15), 2) if random.random() < 0.4 else 0
            
            status = random.choices(
                ORDER_STATUS,
                weights=[0.05, 0.08, 0.07, 0.70, 0.10]
            )[0]
            
            accept_time = None
            pickup_time = None
            delivery_time = None
            cancel_time = None
            rider_id = f"rider_{random.randint(1, 50)}"
            
            if status != 'pending':
                accept_time = create_time + timedelta(minutes=random.randint(1, 10))
                if status in ['picked', 'delivered']:
                    pickup_time = accept_time + timedelta(minutes=random.randint(10, 30))
                if status == 'delivered':
                    delivery_time = pickup_time + timedelta(
                        minutes=random.randint(15, int(distance * 8))
                    )
                if status == 'cancelled':
                    cancel_time = create_time + timedelta(minutes=random.randint(5, 30))
                    rider_id = None
            
            is_risk = random.random() < 0.08
            risk_level = random.choice(['low', 'medium', 'high']) if is_risk else 'normal'
            
            order = Order(
                order_id=order_id,
                order_no=f"ORD{create_time.strftime('%Y%m%d')}{random.randint(10000, 99999)}",
                user_id=f"user_{random.randint(1, 1000)}",
                rider_id=rider_id,
                merchant_id=f"merchant_{random.randint(1, 200)}",
                order_type=random.choice(ORDER_TYPES),
                order_status=status,
                pickup_address=f"{CITIES[city_key]['name']}某街道{random.randint(1, 999)}号",
                pickup_lng=pickup_lng,
                pickup_lat=pickup_lat,
                delivery_address=f"{CITIES[city_key]['name']}某路{random.randint(1, 999)}号",
                delivery_lng=delivery_lng,
                delivery_lat=delivery_lat,
                distance_km=distance,
                estimated_amount=estimated_amount,
                actual_amount=actual_amount,
                subsidy_amount=subsidy_amount,
                create_time=create_time,
                accept_time=accept_time,
                pickup_time=pickup_time,
                delivery_time=delivery_time,
                cancel_time=cancel_time,
                cancel_reason=random.choice(['用户取消', '骑手取消', '系统取消']) if status == 'cancelled' else None,
                is_risk_order=is_risk,
                risk_level=risk_level,
                data_source='mock_data',
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(order)
            orders.append((order, city_key))
        
        session.commit()
        print(f"订单数据生成完成，共 {count} 条。")
        return orders


def generate_payments(orders):
    print("正在生成支付流水数据...")
    count = 0
    with get_db_session() as session:
        for order, _ in orders:
            if order.order_status != 'pending':
                payment = PaymentTransaction(
                    txn_id=str(uuid.uuid4()),
                    order_id=order.order_id,
                    user_id=order.user_id,
                    pay_type=random.choice(PAY_TYPES),
                    pay_amount=order.actual_amount,
                    pay_status='success' if order.order_status != 'cancelled' else random.choice(['success', 'refunded']),
                    pay_time=order.create_time + timedelta(seconds=random.randint(1, 60)),
                    refund_amount=order.actual_amount if order.order_status == 'cancelled' and random.random() < 0.8 else 0,
                    refund_time=order.cancel_time + timedelta(minutes=random.randint(1, 30)) if order.order_status == 'cancelled' else None,
                    third_party_txn_id=f"TP{random.randint(1000000000, 9999999999)}",
                    currency='CNY',
                    data_source='mock_data',
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                session.add(payment)
                count += 1
        session.commit()
    print(f"支付流水数据生成完成，共 {count} 条。")


def generate_trajectories(orders, points_per_order=20):
    print("正在生成骑手轨迹数据...")
    count = 0
    with get_db_session() as session:
        for order, _ in orders:
            if order.order_status == 'delivered' and order.accept_time and order.delivery_time:
                current_lng = order.pickup_lng
                current_lat = order.pickup_lat
                lng_step = (order.delivery_lng - order.pickup_lng) / points_per_order
                lat_step = (order.delivery_lat - order.pickup_lat) / points_per_order
                
                time_delta = (order.delivery_time - order.accept_time) / points_per_order
                
                for i in range(points_per_order):
                    current_time = order.accept_time + time_delta * i
                    trajectory = RiderTrajectory(
                        traj_id=str(uuid.uuid4()),
                        rider_id=order.rider_id,
                        order_id=order.order_id,
                        lng=round(current_lng + lng_step * i + random.uniform(-0.0005, 0.0005), 7),
                        lat=round(current_lat + lat_step * i + random.uniform(-0.0005, 0.0005), 7),
                        speed_kmh=round(random.uniform(15, 45), 2),
                        heading=round(random.uniform(0, 360), 2),
                        accuracy_m=round(random.uniform(1, 10), 2),
                        record_time=current_time,
                        data_source='mock_data',
                        created_at=datetime.now()
                    )
                    session.add(trajectory)
                    count += 1
        session.commit()
    print(f"骑手轨迹数据生成完成，共 {count} 条。")


def generate_subsidy_rules():
    print("正在生成补贴规则数据...")
    rules = [
        {
            'rule_name': '早高峰补贴',
            'rule_type': 'time_based',
            'start_hour': 7,
            'end_hour': 10,
            'subsidy_per_order': 3.0,
            'max_subsidy': 15.0,
            'daily_quota': 3000.0
        },
        {
            'rule_name': '晚高峰补贴',
            'rule_type': 'time_based',
            'start_hour': 17,
            'end_hour': 20,
            'subsidy_per_order': 4.0,
            'max_subsidy': 20.0,
            'daily_quota': 5000.0
        },
        {
            'rule_name': '远距离补贴',
            'rule_type': 'distance_based',
            'min_distance': 5.0,
            'subsidy_per_km': 1.0,
            'max_subsidy': 25.0,
            'daily_quota': 8000.0
        },
        {
            'rule_name': '恶劣天气补贴',
            'rule_type': 'weather_based',
            'condition': 'rain_or_snow',
            'subsidy_multiplier': 1.5,
            'max_subsidy': 30.0,
            'daily_quota': 10000.0
        },
        {
            'rule_name': '新人骑手补贴',
            'rule_type': 'new_rider',
            'rider_days': 30,
            'subsidy_per_order': 2.0,
            'max_subsidy': 50.0,
            'daily_quota': 2000.0
        }
    ]
    
    count = 0
    now = datetime.now()
    with get_db_session() as session:
        for rule_data in rules:
            rule = SubsidyRule(
                rule_id=str(uuid.uuid4()),
                rule_name=rule_data['rule_name'],
                rule_type=rule_data['rule_type'],
                effective_start=now - timedelta(days=30),
                effective_end=now + timedelta(days=180),
                condition_params=json.dumps({k: v for k, v in rule_data.items() 
                                           if k not in ['rule_name', 'rule_type', 'max_subsidy', 'daily_quota']}),
                subsidy_calc=json.dumps({
                    'method': 'fixed' if 'subsidy_per_order' in rule_data else 'distance_based',
                    'value': rule_data.get('subsidy_per_order', rule_data.get('subsidy_per_km', 0))
                }),
                max_subsidy_per_order=rule_data['max_subsidy'],
                daily_quota=rule_data['daily_quota'],
                used_amount=round(random.uniform(0, rule_data['daily_quota'] * 0.6), 2),
                is_active=True,
                priority=random.randint(1, 10),
                created_by='mock_admin',
                created_at=now,
                updated_at=now
            )
            session.add(rule)
            count += 1
        session.commit()
    print(f"补贴规则数据生成完成，共 {count} 条。")


def generate_rejections(orders, count=50):
    print("正在生成骑手拒单数据...")
    delivered_orders = [(o, c) for o, c in orders if o.order_status in ['delivered', 'picked', 'accepted']]
    rejection_count = 0
    
    with get_db_session() as session:
        for i in range(min(count, len(delivered_orders))):
            order, _ = delivered_orders[i]
            rejection_time = order.create_time - timedelta(minutes=random.randint(1, 30))
            
            for j in range(random.randint(1, 3)):
                rejection = RiderRejection(
                    rejection_id=str(uuid.uuid4()),
                    order_id=order.order_id,
                    rider_id=f"rider_{random.randint(1, 50)}",
                    reject_reason=random.choice(REJECT_REASONS),
                    reject_time=rejection_time + timedelta(seconds=j * 10),
                    dispatch_count=j + 1,
                    compensation_amount=round(random.uniform(2, 15), 2) if random.random() < 0.6 else 0,
                    is_verified=random.random() < 0.7,
                    verification_note='系统自动核验' if random.random() < 0.7 else None,
                    created_at=datetime.now()
                )
                session.add(rejection)
                rejection_count += 1
        session.commit()
    print(f"骑手拒单数据生成完成，共 {rejection_count} 条。")


def generate_risk_alerts(orders):
    print("正在生成风险预警数据...")
    risk_orders = [(o, c) for o, c in orders if o.is_risk_order]
    alert_types = ['order_rejection_rate', 'abnormal_amount', 'delivery_timeout', 
                   'subsidy_abnormal', 'address_abnormal', 'high_value_order']
    alert_levels = ['low', 'medium', 'high']
    
    count = 0
    with get_db_session() as session:
        for order, _ in risk_orders:
            alert_type = random.choice(alert_types)
            alert = RiskAlert(
                alert_id=str(uuid.uuid4()),
                alert_type=alert_type,
                alert_level=order.risk_level if order.risk_level != 'normal' else random.choice(alert_levels),
                order_id=order.order_id,
                rider_id=order.rider_id,
                metric_code=alert_type,
                alert_value=round(random.uniform(0.1, 0.5), 4),
                threshold_value=round(random.uniform(0.05, 0.15), 4),
                alert_message=f"订单{order.order_no}触发{alert_type}预警",
                alert_time=order.create_time + timedelta(minutes=random.randint(5, 60)),
                is_handled=random.random() < 0.6,
                handled_by='admin' if random.random() < 0.6 else None,
                handled_time=order.create_time + timedelta(minutes=random.randint(60, 180)) if random.random() < 0.6 else None,
                handle_note='已处理' if random.random() < 0.6 else None,
                created_at=datetime.now()
            )
            session.add(alert)
            count += 1
        session.commit()
    print(f"风险预警数据生成完成，共 {count} 条。")


def generate_all_data(order_count=200, days=14):
    print("=" * 60)
    print("开始生成模拟数据")
    print("=" * 60)
    
    orders = generate_orders(count=order_count, days=days)
    generate_payments(orders)
    generate_trajectories(orders)
    generate_subsidy_rules()
    generate_rejections(orders)
    generate_risk_alerts(orders)
    
    print("=" * 60)
    print("模拟数据生成完成！")
    print("=" * 60)


if __name__ == '__main__':
    order_count = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 14
    generate_all_data(order_count=order_count, days=days)
