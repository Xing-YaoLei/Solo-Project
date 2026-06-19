import random
from datetime import datetime, timedelta

from sqlalchemy import and_

from tasks.celery_app import celery_app
from tasks.utils import sync_task_decorator
from models import Part, PartsStockRecord, AnomalyRecord
from config import RISK_THRESHOLDS


@celery_app.task(bind=True, name="tasks.sync_parts_system")
@sync_task_decorator("配件系统同步", "parts_system")
def sync_parts_system(self, sync_type="incremental", db=None):
    records_count = 0
    error_count = 0

    parts_data = _fetch_parts_from_source(sync_type)

    for part_data in parts_data:
        try:
            part = db.query(Part).filter(Part.part_code == part_data["part_code"]).first()

            if part:
                old_stock = part.stock_quantity
                part.part_name = part_data["part_name"]
                part.category = part_data["category"]
                part.brand = part_data["brand"]
                part.spec = part_data["spec"]
                part.unit_price = part_data["unit_price"]
                part.stock_quantity = part_data["stock_quantity"]
                part.safe_stock = part_data["safe_stock"]
                part.warehouse = part_data["warehouse"]
                part.location = part_data["location"]
                part.supplier = part_data["supplier"]
                part.is_shortage = part_data["stock_quantity"] <= part_data["safe_stock"]
                part.updated_at = datetime.now()

                if old_stock != part_data["stock_quantity"]:
                    stock_record = PartsStockRecord(
                        part_id=part.id,
                        part_code=part.part_code,
                        change_type="adjust",
                        quantity=part_data["stock_quantity"] - old_stock,
                        balance_before=old_stock,
                        balance_after=part_data["stock_quantity"],
                        related_order_no=f"SYNC-{datetime.now().strftime('%Y%m%d%H%M')}",
                        remark="系统同步库存更新",
                        operator="system_sync",
                    )
                    db.add(stock_record)

                if part.is_shortage and old_stock > part.safe_stock:
                    _create_shortage_anomaly(db, part)
            else:
                new_part = Part(
                    part_code=part_data["part_code"],
                    part_name=part_data["part_name"],
                    category=part_data["category"],
                    brand=part_data["brand"],
                    spec=part_data["spec"],
                    unit=part_data.get("unit", "个"),
                    unit_price=part_data["unit_price"],
                    stock_quantity=part_data["stock_quantity"],
                    safe_stock=part_data["safe_stock"],
                    warehouse=part_data["warehouse"],
                    location=part_data["location"],
                    supplier=part_data["supplier"],
                    is_shortage=part_data["stock_quantity"] <= part_data["safe_stock"],
                )
                db.add(new_part)
                db.flush()

                if new_part.is_shortage:
                    _create_shortage_anomaly(db, new_part)

                stock_record = PartsStockRecord(
                    part_id=new_part.id,
                    part_code=new_part.part_code,
                    change_type="in",
                    quantity=part_data["stock_quantity"],
                    balance_before=0,
                    balance_after=part_data["stock_quantity"],
                    related_order_no=f"INIT-{datetime.now().strftime('%Y%m%d%H%M')}",
                    remark="初始化库存",
                    operator="system_sync",
                )
                db.add(stock_record)

            records_count += 1
        except Exception:
            error_count += 1
            continue

    db.commit()
    return {"records_count": records_count, "error_count": error_count}


def _fetch_parts_from_source(sync_type):
    parts_list = [
        {"part_code": "P001", "part_name": "机油滤清器", "category": "滤清器", "brand": "博世", "spec": "OX 387D", "unit": "个", "unit_price": 45.0, "stock_quantity": 50, "safe_stock": 10, "warehouse": "A区", "location": "A-01-01", "supplier": "博世授权经销商"},
        {"part_code": "P002", "part_name": "空气滤清器", "category": "滤清器", "brand": "曼牌", "spec": "C 28 038", "unit": "个", "unit_price": 89.0, "stock_quantity": 35, "safe_stock": 8, "warehouse": "A区", "location": "A-01-02", "supplier": "曼牌代理商"},
        {"part_code": "P003", "part_name": "空调滤清器", "category": "滤清器", "brand": "马勒", "spec": "LAK 1184", "unit": "个", "unit_price": 65.0, "stock_quantity": 28, "safe_stock": 10, "warehouse": "A区", "location": "A-01-03", "supplier": "马勒授权店"},
        {"part_code": "P004", "part_name": "前刹车片", "category": "制动系统", "brand": "布雷博", "spec": "P85 088", "unit": "套", "unit_price": 580.0, "stock_quantity": 5, "safe_stock": 6, "warehouse": "B区", "location": "B-02-01", "supplier": "布雷博中国"},
        {"part_code": "P005", "part_name": "后刹车片", "category": "制动系统", "brand": "布雷博", "spec": "P85 089", "unit": "套", "unit_price": 520.0, "stock_quantity": 12, "safe_stock": 6, "warehouse": "B区", "location": "B-02-02", "supplier": "布雷博中国"},
        {"part_code": "P006", "part_name": "刹车盘", "category": "制动系统", "brand": "天合", "spec": "DF4032", "unit": "个", "unit_price": 320.0, "stock_quantity": 2, "safe_stock": 4, "warehouse": "B区", "location": "B-02-03", "supplier": "天合汽车"},
        {"part_code": "P007", "part_name": "全合成机油 5W-30", "category": "润滑油", "brand": "美孚", "spec": "银美孚1号 4L", "unit": "桶", "unit_price": 280.0, "stock_quantity": 45, "safe_stock": 20, "warehouse": "C区", "location": "C-01-01", "supplier": "美孚授权商"},
        {"part_code": "P008", "part_name": "全合成机油 0W-40", "category": "润滑油", "brand": "嘉实多", "spec": "极护 4L", "unit": "桶", "unit_price": 360.0, "stock_quantity": 18, "safe_stock": 15, "warehouse": "C区", "location": "C-01-02", "supplier": "嘉实多代理"},
        {"part_code": "P009", "part_name": "火花塞", "category": "点火系统", "brand": "NGK", "spec": "ILKAR7B11", "unit": "支", "unit_price": 75.0, "stock_quantity": 80, "safe_stock": 30, "warehouse": "D区", "location": "D-01-01", "supplier": "NGK中国"},
        {"part_code": "P010", "part_name": "电瓶", "category": "电气系统", "brand": "瓦尔塔", "spec": "L2-400 60Ah", "unit": "个", "unit_price": 450.0, "stock_quantity": 3, "safe_stock": 5, "warehouse": "E区", "location": "E-01-01", "supplier": "瓦尔塔代理商"},
        {"part_code": "P011", "part_name": "轮胎 225/55R17", "category": "轮胎", "brand": "米其林", "spec": "浩悦4 ST", "unit": "条", "unit_price": 680.0, "stock_quantity": 16, "safe_stock": 8, "warehouse": "F区", "location": "F-01-01", "supplier": "米其林驰加"},
        {"part_code": "P012", "part_name": "正时皮带套装", "category": "传动系统", "brand": "盖茨", "spec": "K015579XS", "unit": "套", "unit_price": 520.0, "stock_quantity": 8, "safe_stock": 3, "warehouse": "G区", "location": "G-01-01", "supplier": "盖茨授权商"},
    ]

    if sync_type == "incremental":
        random.shuffle(parts_list)
        return parts_list[:random.randint(3, len(parts_list))]

    return parts_list


def _create_shortage_anomaly(db, part):
    existing = db.query(AnomalyRecord).filter(
        and_(
            AnomalyRecord.anomaly_type == "parts_shortage",
            AnomalyRecord.related_table == "parts",
            AnomalyRecord.related_id == part.id,
            AnomalyRecord.status.in_(["open", "in_progress"]),
        )
    ).first()

    if not existing:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
            anomaly_type="parts_shortage",
            severity="high" if part.stock_quantity == 0 else "medium",
            status="open",
            source="sync",
            related_table="parts",
            related_id=part.id,
            related_no=part.part_code,
            title=f"配件缺货预警: {part.part_name}",
            description=f"配件 {part.part_name}({part.part_code}) 库存 {part.stock_quantity}{part.unit}，低于安全库存 {part.safe_stock}{part.unit}",
            detected_at=datetime.now(),
        )
        db.add(anomaly)
