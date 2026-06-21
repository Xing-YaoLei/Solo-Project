import sys
import os
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app import models
from app.config import get_settings
from datetime import datetime, timedelta
import random
import psycopg


def ensure_database():
    settings = get_settings()
    db_url = settings.database_url

    parsed = urlparse(db_url.replace("postgresql+psycopg://", "postgresql://"))
    user = parsed.username or "postgres"
    password = parsed.password or ""
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    db_name = parsed.path.lstrip("/") or "errand_db"

    admin_conn_str = f"host={host} port={port} user={user}"
    if password:
        admin_conn_str += f" password={password}"
    admin_conn_str += " dbname=postgres"

    conn = psycopg.connect(admin_conn_str, autocommit=True)
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        if exists:
            print(f"数据库 {db_name} 已存在，跳过创建")
        else:
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f"数据库 {db_name} 创建成功")
        cur.close()
    finally:
        conn.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")


def seed_data():
    db = SessionLocal()
    
    try:
        if db.query(models.AddressDict).count() > 0:
            print("数据已存在，跳过种子数据")
            return
        
        areas = ["朝阳区", "海淀区", "西城区", "东城区", "丰台区"]
        
        addresses = [
            {"name": "国贸大厦", "address": "朝阳区建国门外大街1号", "area": "朝阳区", "contact_person": "张经理", "contact_phone": "13800138001"},
            {"name": "中关村软件园", "address": "海淀区东北旺西路8号", "area": "海淀区", "contact_person": "李主管", "contact_phone": "13800138002"},
            {"name": "金融街购物中心", "address": "西城区金城坊街2号", "area": "西城区", "contact_person": "王经理", "contact_phone": "13800138003"},
            {"name": "王府井百货", "address": "东城区王府井大街255号", "area": "东城区", "contact_person": "赵主任", "contact_phone": "13800138004"},
            {"name": "总部基地", "address": "丰台区南四环西路188号", "area": "丰台区", "contact_person": "孙经理", "contact_phone": "13800138005"},
            {"name": "三里屯太古里", "address": "朝阳区三里屯路19号", "area": "朝阳区", "contact_person": "周主管", "contact_phone": "13800138006"},
            {"name": "五道口购物中心", "address": "海淀区成府路28号", "area": "海淀区", "contact_person": "吴经理", "contact_phone": "13800138007"},
            {"name": "西单大悦城", "address": "西城区西单北大街131号", "area": "西城区", "contact_person": "郑主任", "contact_phone": "13800138008"},
        ]
        
        for addr in addresses:
            db.add(models.AddressDict(**addr, lng=116.4 + random.uniform(-0.1, 0.1), lat=39.9 + random.uniform(-0.1, 0.1)))
        
        track_rules = [
            {"name": "市区标准配送", "area": None, "max_distance": 10000, "expected_duration": 45, "warning_duration": 60, "track_interval": 60},
            {"name": "朝阳区快速配送", "area": "朝阳区", "max_distance": 8000, "expected_duration": 35, "warning_duration": 50, "track_interval": 30},
            {"name": "海淀区标准配送", "area": "海淀区", "max_distance": 12000, "expected_duration": 50, "warning_duration": 65, "track_interval": 60},
        ]
        
        for rule in track_rules:
            db.add(models.TrackRule(**rule))
        
        subsidy_rules = [
            {"name": "远距离补贴", "rule_type": "distance", "threshold": 5000, "subsidy_amount": 3, "subsidy_unit": "yuan", "priority": 10, "description": "距离超过5公里补贴3元"},
            {"name": "超远距离补贴", "rule_type": "distance", "threshold": 10000, "subsidy_amount": 5, "subsidy_unit": "yuan", "priority": 20, "description": "距离超过10公里补贴5元"},
            {"name": "重量补贴", "rule_type": "weight", "threshold": 10, "subsidy_amount": 2, "subsidy_unit": "yuan", "priority": 5, "description": "重量超过10kg补贴2元"},
            {"name": "高峰时段补贴", "rule_type": "peak", "threshold": 1, "subsidy_amount": 10, "subsidy_unit": "percent", "priority": 15, "description": "高峰时段补贴10%"},
            {"name": "夜间补贴", "rule_type": "night", "threshold": 22, "subsidy_amount": 3, "subsidy_unit": "yuan", "priority": 15, "description": "22点后订单补贴3元"},
        ]
        
        for rule in subsidy_rules:
            db.add(models.SubsidyRule(**rule))
        
        riders = [
            {"name": "张三", "phone": "13900139001", "area": "朝阳区", "level": "senior"},
            {"name": "李四", "phone": "13900139002", "area": "海淀区", "level": "normal"},
            {"name": "王五", "phone": "13900139003", "area": "朝阳区", "level": "normal"},
            {"name": "赵六", "phone": "13900139004", "area": "西城区", "level": "junior"},
            {"name": "钱七", "phone": "13900139005", "area": "东城区", "level": "normal"},
            {"name": "孙八", "phone": "13900139006", "area": "丰台区", "level": "senior"},
        ]
        
        for rider in riders:
            db.add(models.Rider(**rider, rating=round(random.uniform(4.0, 5.0), 1), total_orders=random.randint(50, 500), reject_count=random.randint(0, 20)))
        
        db.commit()
        
        for i in range(20):
            pickup_idx = random.randint(0, len(addresses) - 1)
            delivery_idx = random.randint(0, len(addresses) - 1)
            while delivery_idx == pickup_idx:
                delivery_idx = random.randint(0, len(addresses) - 1)
            
            pickup = addresses[pickup_idx]
            delivery = addresses[delivery_idx]
            
            statuses = list(models.OrderStatus)
            status = random.choice(statuses)
            
            distance = random.randint(1000, 15000)
            goods_weight = round(random.uniform(0.5, 20), 1)
            
            order = models.Order(
                order_no=f"ED{datetime.now().strftime('%Y%m%d')}{i+1:06d}",
                status=status,
                pickup_address_id=pickup_idx + 1,
                delivery_address_id=delivery_idx + 1,
                pickup_address=pickup["address"],
                delivery_address=delivery["address"],
                pickup_area=pickup["area"],
                delivery_area=delivery["area"],
                distance=distance,
                goods_name=f"物品{i+1}",
                goods_weight=goods_weight,
                goods_amount=round(random.uniform(10, 500), 2),
                customer_name=f"客户{i+1}",
                customer_phone=f"136001360{i+1:02d}",
                reject_count=random.randint(0, 3),
                created_at=datetime.now() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
            )
            
            base_fee = 5.0
            distance_fee = 0
            if distance > 1000:
                extra_km = (distance - 1000) / 1000
                distance_fee = round(extra_km * 2, 2)
            
            weight_fee = 0
            if goods_weight > 5:
                extra_kg = goods_weight - 5
                weight_fee = round(extra_kg * 1, 2)
            
            subsidy_fee = 0
            if distance > 5000:
                subsidy_fee += 3
            if distance > 10000:
                subsidy_fee += 2
            
            total_fee = base_fee + distance_fee + weight_fee + subsidy_fee
            
            order.base_fee = base_fee
            order.distance_fee = distance_fee
            order.weight_fee = weight_fee
            order.subsidy_fee = round(subsidy_fee, 2)
            order.total_fee = round(total_fee, 2)
            order.rider_income = round(total_fee * 0.8, 2)
            order.platform_profit = round(total_fee * 0.2, 2)
            
            if status in [models.OrderStatus.ACCEPTED, models.OrderStatus.PICKED, models.OrderStatus.DELIVERING, models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED, models.OrderStatus.SETTLED]:
                order.rider_id = random.randint(1, len(riders))
                order.assign_time = order.created_at + timedelta(minutes=random.randint(1, 10))
            
            if status in [models.OrderStatus.PICKED, models.OrderStatus.DELIVERING, models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED, models.OrderStatus.SETTLED]:
                order.accept_time = order.assign_time + timedelta(minutes=random.randint(1, 5))
            
            if status in [models.OrderStatus.DELIVERING, models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED, models.OrderStatus.SETTLED]:
                order.pickup_time = order.accept_time + timedelta(minutes=random.randint(5, 20))
            
            if status in [models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED, models.OrderStatus.SETTLED]:
                order.delivery_time = order.pickup_time + timedelta(minutes=random.randint(15, 60))
            
            if status in [models.OrderStatus.COMPLETED, models.OrderStatus.SETTLED]:
                order.complete_time = order.delivery_time + timedelta(minutes=random.randint(0, 10))
            
            db.add(order)
        
        db.commit()
        print("种子数据插入完成")
        
    except Exception as e:
        db.rollback()
        print(f"种子数据插入失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ensure_database()
    init_db()
    seed_data()
