import random
import json
from datetime import datetime, timedelta, date

from sqlalchemy import and_

from tasks.celery_app import celery_app
from tasks.utils import sync_task_decorator
from models import WorkOrder, WorkOrderItem, Part, AnomalyRecord


@celery_app.task(bind=True, name="tasks.sync_work_orders")
@sync_task_decorator("维修工单同步", "work_order_system")
def sync_work_orders(self, sync_type="incremental", db=None):
    records_count = 0
    error_count = 0

    orders_data = _fetch_work_orders_from_source(sync_type)

    for order_data in orders_data:
        try:
            order = db.query(WorkOrder).filter(WorkOrder.order_no == order_data["order_no"]).first()

            if order:
                order.status = order_data["status"]
                order.technician = order_data["technician"]
                order.advisor = order_data["advisor"]
                order.total_amount = order_data["total_amount"]
                order.has_parts_shortage = order_data["has_parts_shortage"]
                order.is_rework = order_data["is_rework"]
                order.rework_count = order_data["rework_count"]
                order.updated_at = datetime.now()

                if order_data["status"] == "completed" and order.complete_time is None:
                    order.complete_time = datetime.now()
            else:
                order = WorkOrder(
                    order_no=order_data["order_no"],
                    appointment_id=order_data.get("appointment_id"),
                    license_plate=order_data["license_plate"],
                    vehicle_model=order_data["vehicle_model"],
                    customer_name=order_data["customer_name"],
                    phone=order_data["phone"],
                    mileage=order_data["mileage"],
                    repair_type=order_data["repair_type"],
                    fault_description=order_data["fault_description"],
                    status=order_data["status"],
                    priority=order_data["priority"],
                    technician=order_data["technician"],
                    advisor=order_data["advisor"],
                    start_time=order_data.get("start_time"),
                    complete_time=order_data.get("complete_time"),
                    total_amount=order_data["total_amount"],
                    is_rework=order_data["is_rework"],
                    rework_count=order_data["rework_count"],
                    original_order_id=order_data.get("original_order_id"),
                    has_parts_shortage=order_data["has_parts_shortage"],
                )
                db.add(order)
                db.flush()

                for item_data in order_data["items"]:
                    item = WorkOrderItem(
                        work_order_id=order.id,
                        item_type=item_data["item_type"],
                        item_code=item_data["item_code"],
                        item_name=item_data["item_name"],
                        quantity=item_data["quantity"],
                        unit_price=item_data["unit_price"],
                        amount=item_data["amount"],
                        technician=item_data.get("technician"),
                        status=item_data.get("status", "pending"),
                        part_id=item_data.get("part_id"),
                    )
                    db.add(item)

            if order_data["has_parts_shortage"]:
                _create_parts_shortage_anomaly(db, order)

            if order_data["is_rework"] and order_data["rework_count"] >= 2:
                _create_rework_anomaly(db, order)

            records_count += 1
        except Exception as e:
            error_count += 1
            continue

    db.commit()
    return {"records_count": records_count, "error_count": error_count}


def _fetch_work_orders_from_source(sync_type):
    technicians = ["张师傅", "李师傅", "王师傅", "赵师傅", "陈师傅"]
    advisors = ["刘顾问", "周顾问", "吴顾问"]
    repair_types = ["常规保养", "发动机维修", "底盘维修", "电气维修", "钣金喷漆", "空调维修", "轮胎更换", "制动系统维修"]
    priorities = ["low", "normal", "high", "urgent"]
    statuses = ["pending", "in_progress", "parts_pending", "completed", "cancelled"]

    orders = []
    today = date.today()

    for i in range(1, 16):
        order_no = f"WO{today.strftime('%Y%m')}{i:04d}"
        status = random.choice(statuses)
        is_rework = random.random() < 0.15
        rework_count = random.randint(0, 2) if is_rework else 0
        has_parts_shortage = random.random() < 0.2

        start_time = None
        complete_time = None
        base_date = today - timedelta(days=random.randint(0, 30))

        if status in ["in_progress", "parts_pending", "completed"]:
            start_time = datetime.combine(base_date, datetime.min.time()) + timedelta(hours=9)

        if status == "completed":
            complete_time = start_time + timedelta(hours=random.randint(2, 8))

        items = _generate_order_items(has_parts_shortage)
        total_amount = sum(item["amount"] for item in items)

        orders.append({
            "order_no": order_no,
            "appointment_id": None,
            "license_plate": f"京A{random.randint(10000, 99999)}",
            "vehicle_model": random.choice(["大众帕萨特", "丰田凯美瑞", "本田雅阁", "奥迪A4L", "宝马3系", "奔驰C级", "别克君威", "日产天籁"]),
            "customer_name": random.choice(["王先生", "李先生", "张女士", "刘先生", "陈女士", "杨先生", "黄先生", "周女士"]),
            "phone": f"138{random.randint(10000000, 99999999)}",
            "mileage": random.randint(5000, 150000),
            "repair_type": random.choice(repair_types),
            "fault_description": random.choice(["发动机异响", "刹车抖动", "空调不制冷", "保养到期", "电瓶亏电", "轮胎磨损", "变速箱顿挫", "灯光故障"]),
            "status": status,
            "priority": random.choice(priorities),
            "technician": random.choice(technicians),
            "advisor": random.choice(advisors),
            "start_time": start_time,
            "complete_time": complete_time,
            "total_amount": total_amount,
            "is_rework": is_rework,
            "rework_count": rework_count,
            "original_order_id": None,
            "has_parts_shortage": has_parts_shortage,
            "items": items,
        })

    if sync_type == "incremental":
        random.shuffle(orders)
        return orders[:random.randint(3, len(orders))]

    return orders


def _generate_order_items(has_parts_shortage):
    labor_items = [
        {"item_code": "L001", "item_name": "换机油工时", "item_type": "labor", "quantity": 1, "unit_price": 80, "amount": 80, "status": "completed"},
        {"item_code": "L002", "item_name": "更换刹车片工时", "item_type": "labor", "quantity": 1, "unit_price": 150, "amount": 150, "status": "pending"},
        {"item_code": "L003", "item_name": "发动机检测工时", "item_type": "labor", "quantity": 1, "unit_price": 200, "amount": 200, "status": "pending"},
        {"item_code": "L004", "item_name": "四轮定位", "item_type": "labor", "quantity": 1, "unit_price": 180, "amount": 180, "status": "pending"},
        {"item_code": "L005", "item_name": "空调清洗工时", "item_type": "labor", "quantity": 1, "unit_price": 120, "amount": 120, "status": "pending"},
    ]

    part_items = [
        {"item_code": "P007", "item_name": "全合成机油 5W-30", "item_type": "part", "quantity": 1, "unit_price": 280, "amount": 280, "part_id": 7, "status": "completed"},
        {"item_code": "P001", "item_name": "机油滤清器", "item_type": "part", "quantity": 1, "unit_price": 45, "amount": 45, "part_id": 1, "status": "completed"},
        {"item_code": "P002", "item_name": "空气滤清器", "item_type": "part", "quantity": 1, "unit_price": 89, "amount": 89, "part_id": 2, "status": "pending"},
        {"item_code": "P004", "item_name": "前刹车片", "item_type": "part", "quantity": 1, "unit_price": 580, "amount": 580, "part_id": 4, "status": "pending"},
        {"item_code": "P009", "item_name": "火花塞", "item_type": "part", "quantity": 4, "unit_price": 75, "amount": 300, "part_id": 9, "status": "pending"},
    ]

    selected = []
    selected.append(random.choice(labor_items))

    num_parts = random.randint(1, 3)
    random.shuffle(part_items)
    selected.extend(part_items[:num_parts])

    if has_parts_shortage:
        for item in selected:
            if item["item_type"] == "part":
                item["status"] = "shortage"
                break

    return selected


def _create_parts_shortage_anomaly(db, order):
    existing = db.query(AnomalyRecord).filter(
        and_(
            AnomalyRecord.anomaly_type == "parts_shortage",
            AnomalyRecord.related_table == "work_orders",
            AnomalyRecord.related_id == order.id,
            AnomalyRecord.status.in_(["open", "in_progress"]),
        )
    ).first()

    if not existing:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
            anomaly_type="parts_shortage",
            severity="high",
            status="open",
            source="sync",
            related_table="work_orders",
            related_id=order.id,
            related_no=order.order_no,
            title=f"工单配件缺货: {order.order_no}",
            description=f"工单 {order.order_no} 存在配件缺货情况，请及时处理",
            detected_at=datetime.now(),
        )
        db.add(anomaly)


def _create_rework_anomaly(db, order):
    existing = db.query(AnomalyRecord).filter(
        and_(
            AnomalyRecord.anomaly_type == "review_flag",
            AnomalyRecord.related_table == "work_orders",
            AnomalyRecord.related_id == order.id,
            AnomalyRecord.status.in_(["open", "in_progress"]),
        )
    ).first()

    if not existing:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
            anomaly_type="review_flag",
            severity="high" if order.rework_count >= 2 else "medium",
            status="open",
            source="sync",
            related_table="work_orders",
            related_id=order.id,
            related_no=order.order_no,
            title=f"高返修工单预警: {order.order_no}",
            description=f"工单 {order.order_no} 返修次数达 {order.rework_count} 次，需重点关注",
            detected_at=datetime.now(),
        )
        db.add(anomaly)
