import random
import json
from datetime import datetime, timedelta, date

from models import (
    init_db,
    SessionLocal,
    Appointment,
    WorkOrder,
    WorkOrderItem,
    Part,
    PartsStockRecord,
    InsuranceDocument,
    Quote,
    AnomalyRecord,
    Remark,
    SyncLog,
)


def seed_all_data():
    db = SessionLocal()
    try:
        print("正在初始化数据库...")
        init_db()
        print("数据库表创建完成")

        print("正在生成配件数据...")
        parts = _seed_parts(db)
        print(f"  生成了 {len(parts)} 条配件数据")

        print("正在生成预约数据...")
        appointments = _seed_appointments(db)
        print(f"  生成了 {len(appointments)} 条预约数据")

        print("正在生成工单数据...")
        work_orders = _seed_work_orders(db, parts)
        print(f"  生成了 {len(work_orders)} 条工单数据")

        print("正在生成保险单据数据...")
        insurance_docs = _seed_insurance(db, work_orders)
        print(f"  生成了 {len(insurance_docs)} 条保险数据")

        print("正在生成报价单数据...")
        quotes = _seed_quotes(db, work_orders)
        print(f"  生成了 {len(quotes)} 条报价单数据")

        print("正在生成备注数据...")
        remarks = _seed_remarks(db, work_orders, parts, appointments)
        print(f"  生成了 {len(remarks)} 条备注数据")

        print("正在生成异常记录...")
        anomalies = _seed_anomalies(db, work_orders, parts, insurance_docs)
        print(f"  生成了 {len(anomalies)} 条异常记录")

        print("正在生成同步日志...")
        sync_logs = _seed_sync_logs(db)
        print(f"  生成了 {len(sync_logs)} 条同步日志")

        db.commit()
        print("\n✅ 示例数据初始化完成！")

    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
        raise
    finally:
        db.close()


def _seed_parts(db):
    parts_list = [
        {"part_code": "P001", "part_name": "机油滤清器", "category": "滤清器", "brand": "博世", "spec": "OX 387D", "unit": "个", "unit_price": 45.0, "stock_quantity": 50, "safe_stock": 10, "warehouse": "A区", "location": "A-01-01", "supplier": "博世授权经销商"},
        {"part_code": "P002", "part_name": "空气滤清器", "category": "滤清器", "brand": "曼牌", "spec": "C 28 038", "unit": "个", "unit_price": 89.0, "stock_quantity": 35, "safe_stock": 8, "warehouse": "A区", "location": "A-01-02", "supplier": "曼牌代理商"},
        {"part_code": "P003", "part_name": "空调滤清器", "category": "滤清器", "brand": "马勒", "spec": "LAK 1184", "unit": "个", "unit_price": 65.0, "stock_quantity": 28, "safe_stock": 10, "warehouse": "A区", "location": "A-01-03", "supplier": "马勒授权店"},
        {"part_code": "P004", "part_name": "前刹车片", "category": "制动系统", "brand": "布雷博", "spec": "P85 088", "unit": "套", "unit_price": 580.0, "stock_quantity": 3, "safe_stock": 6, "warehouse": "B区", "location": "B-02-01", "supplier": "布雷博中国"},
        {"part_code": "P005", "part_name": "后刹车片", "category": "制动系统", "brand": "布雷博", "spec": "P85 089", "unit": "套", "unit_price": 520.0, "stock_quantity": 12, "safe_stock": 6, "warehouse": "B区", "location": "B-02-02", "supplier": "布雷博中国"},
        {"part_code": "P006", "part_name": "刹车盘", "category": "制动系统", "brand": "天合", "spec": "DF4032", "unit": "个", "unit_price": 320.0, "stock_quantity": 2, "safe_stock": 4, "warehouse": "B区", "location": "B-02-03", "supplier": "天合汽车"},
        {"part_code": "P007", "part_name": "全合成机油 5W-30", "category": "润滑油", "brand": "美孚", "spec": "银美孚1号 4L", "unit": "桶", "unit_price": 280.0, "stock_quantity": 45, "safe_stock": 20, "warehouse": "C区", "location": "C-01-01", "supplier": "美孚授权商"},
        {"part_code": "P008", "part_name": "全合成机油 0W-40", "category": "润滑油", "brand": "嘉实多", "spec": "极护 4L", "unit": "桶", "unit_price": 360.0, "stock_quantity": 5, "safe_stock": 15, "warehouse": "C区", "location": "C-01-02", "supplier": "嘉实多代理"},
        {"part_code": "P009", "part_name": "火花塞", "category": "点火系统", "brand": "NGK", "spec": "ILKAR7B11", "unit": "支", "unit_price": 75.0, "stock_quantity": 80, "safe_stock": 30, "warehouse": "D区", "location": "D-01-01", "supplier": "NGK中国"},
        {"part_code": "P010", "part_name": "电瓶", "category": "电气系统", "brand": "瓦尔塔", "spec": "L2-400 60Ah", "unit": "个", "unit_price": 450.0, "stock_quantity": 2, "safe_stock": 5, "warehouse": "E区", "location": "E-01-01", "supplier": "瓦尔塔代理商"},
        {"part_code": "P011", "part_name": "轮胎 225/55R17", "category": "轮胎", "brand": "米其林", "spec": "浩悦4 ST", "unit": "条", "unit_price": 680.0, "stock_quantity": 16, "safe_stock": 8, "warehouse": "F区", "location": "F-01-01", "supplier": "米其林驰加"},
        {"part_code": "P012", "part_name": "正时皮带套装", "category": "传动系统", "brand": "盖茨", "spec": "K015579XS", "unit": "套", "unit_price": 520.0, "stock_quantity": 1, "safe_stock": 3, "warehouse": "G区", "location": "G-01-01", "supplier": "盖茨授权商"},
    ]

    parts = []
    for p_data in parts_list:
        part = Part(**p_data)
        part.is_shortage = part.stock_quantity <= part.safe_stock
        db.add(part)
        db.flush()

        stock_record = PartsStockRecord(
            part_id=part.id,
            part_code=part.part_code,
            change_type="in",
            quantity=part.stock_quantity,
            balance_before=0,
            balance_after=part.stock_quantity,
            related_order_no=f"INIT-{datetime.now().strftime('%Y%m%d')}",
            remark="初始化库存",
            operator="system_init",
        )
        db.add(stock_record)
        parts.append(part)

    return parts


def _seed_appointments(db):
    today = date.today()
    technicians = ["张师傅", "李师傅", "王师傅", "赵师傅", "陈师傅"]
    service_types = ["常规保养", "发动机检修", "底盘维修", "电气维修", "钣金喷漆", "空调维修", "轮胎更换", "制动系统检修"]
    statuses = ["pending", "arrived", "cancelled", "completed"]
    risk_levels = ["low", "medium", "high"]

    appointments = []
    for i in range(1, 31):
        apt_date = today - timedelta(days=random.randint(0, 20))
        apt_time = datetime.combine(apt_date, datetime.min.time()) + timedelta(hours=random.randint(8, 17), minutes=random.choice([0, 30]))

        status = random.choices(statuses, weights=[0.2, 0.1, 0.1, 0.6])[0]
        actual_arrival = None
        if status in ["arrived", "completed"]:
            actual_arrival = apt_time + timedelta(minutes=random.randint(-10, 30))

        apt = Appointment(
            appointment_no=f"APT{today.strftime('%Y%m')}{i:04d}",
            customer_name=random.choice(["王先生", "李先生", "张女士", "刘先生", "陈女士", "杨先生", "黄先生", "周女士", "吴先生", "赵女士"]),
            phone=f"13{random.choice(['8','9','7','6'])}{random.randint(10000000, 99999999)}",
            license_plate=f"京{random.choice(['A','B','C','N','Q'])}{random.randint(10000, 99999)}",
            vehicle_model=random.choice(["大众帕萨特", "丰田凯美瑞", "本田雅阁", "奥迪A4L", "宝马3系", "奔驰C级", "别克君威", "日产天籁", "大众迈腾", "福特蒙迪欧"]),
            appointment_time=apt_time,
            actual_arrival_time=actual_arrival,
            service_type=random.choice(service_types),
            description=random.choice(["常规保养", "发动机异响", "刹车抖动", "空调不制冷", "保养到期提醒", "电瓶亏电", "轮胎磨损", "变速箱顿挫", "灯光故障", "底盘异响"]),
            status=status,
            risk_level=random.choices(risk_levels, weights=[0.6, 0.3, 0.1])[0],
        )
        db.add(apt)
        appointments.append(apt)

    return appointments


def _seed_work_orders(db, parts):
    today = date.today()
    technicians = ["张师傅", "李师傅", "王师傅", "赵师傅", "陈师傅"]
    advisors = ["刘顾问", "周顾问", "吴顾问", "郑顾问"]
    repair_types = ["常规保养", "发动机维修", "底盘维修", "电气维修", "钣金喷漆", "空调维修", "轮胎更换", "制动系统维修"]
    priorities = ["low", "normal", "high", "urgent"]
    statuses = ["pending", "in_progress", "parts_pending", "completed", "cancelled"]

    work_orders = []
    part_items_pool = [
        {"item_code": "P001", "item_name": "机油滤清器", "part_id": 1, "unit_price": 45.0},
        {"item_code": "P002", "item_name": "空气滤清器", "part_id": 2, "unit_price": 89.0},
        {"item_code": "P003", "item_name": "空调滤清器", "part_id": 3, "unit_price": 65.0},
        {"item_code": "P004", "item_name": "前刹车片", "part_id": 4, "unit_price": 580.0},
        {"item_code": "P005", "item_name": "后刹车片", "part_id": 5, "unit_price": 520.0},
        {"item_code": "P007", "item_name": "全合成机油 5W-30", "part_id": 7, "unit_price": 280.0},
        {"item_code": "P009", "item_name": "火花塞", "part_id": 9, "unit_price": 75.0},
        {"item_code": "P011", "item_name": "轮胎 225/55R17", "part_id": 11, "unit_price": 680.0},
    ]

    labor_items_pool = [
        {"item_code": "L001", "item_name": "换机油工时", "unit_price": 80.0},
        {"item_code": "L002", "item_name": "更换刹车片工时", "unit_price": 150.0},
        {"item_code": "L003", "item_name": "发动机检测工时", "unit_price": 200.0},
        {"item_code": "L004", "item_name": "四轮定位", "unit_price": 180.0},
        {"item_code": "L005", "item_name": "空调清洗工时", "unit_price": 120.0},
        {"item_code": "L006", "item_name": "更换轮胎工时", "unit_price": 50.0},
        {"item_code": "L007", "item_name": "更换火花塞工时", "unit_price": 100.0},
    ]

    for i in range(1, 26):
        order_no = f"WO{today.strftime('%Y%m')}{i:04d}"
        status = random.choices(statuses, weights=[0.15, 0.2, 0.1, 0.5, 0.05])[0]
        is_rework = random.random() < 0.15
        rework_count = random.randint(1, 2) if is_rework else 0
        has_parts_shortage = status == "parts_pending" or (random.random() < 0.2 and status != "completed")

        base_date = today - timedelta(days=random.randint(0, 25))
        start_time = None
        complete_time = None

        if status in ["in_progress", "parts_pending", "completed", "cancelled"]:
            start_time = datetime.combine(base_date, datetime.min.time()) + timedelta(hours=9)

        if status == "completed":
            complete_time = start_time + timedelta(hours=random.randint(2, 8))

        order = WorkOrder(
            order_no=order_no,
            license_plate=f"京{random.choice(['A','B','C','N'])}{random.randint(10000, 99999)}",
            vehicle_model=random.choice(["大众帕萨特", "丰田凯美瑞", "本田雅阁", "奥迪A4L", "宝马3系", "奔驰C级", "别克君威", "日产天籁"]),
            customer_name=random.choice(["王先生", "李先生", "张女士", "刘先生", "陈女士", "杨先生", "黄先生"]),
            phone=f"13{random.choice(['8','9','7'])}{random.randint(10000000, 99999999)}",
            mileage=random.randint(5000, 150000),
            repair_type=random.choice(repair_types),
            fault_description=random.choice(["发动机异响", "刹车抖动", "空调不制冷", "保养到期", "电瓶亏电", "轮胎磨损", "变速箱顿挫", "灯光故障", "常规检查"]),
            status=status,
            priority=random.choices(priorities, weights=[0.1, 0.6, 0.2, 0.1])[0],
            technician=random.choice(technicians),
            advisor=random.choice(advisors),
            start_time=start_time,
            complete_time=complete_time,
            total_amount=0,
            is_rework=is_rework,
            rework_count=rework_count,
            has_parts_shortage=has_parts_shortage,
        )
        db.add(order)
        db.flush()

        items = []
        total_amount = 0

        num_labor = random.randint(1, 2)
        random.shuffle(labor_items_pool)
        for item in labor_items_pool[:num_labor]:
            qty = 1
            amount = item["unit_price"] * qty
            order_item = WorkOrderItem(
                work_order_id=order.id,
                item_type="labor",
                item_code=item["item_code"],
                item_name=item["item_name"],
                quantity=qty,
                unit_price=item["unit_price"],
                amount=amount,
                technician=order.technician,
                status="completed" if status == "completed" else "pending",
            )
            db.add(order_item)
            items.append(order_item)
            total_amount += amount

        num_parts = random.randint(1, 4)
        random.shuffle(part_items_pool)
        for item in part_items_pool[:num_parts]:
            qty = random.randint(1, 4) if item["item_code"] == "P009" or item["item_code"] == "P011" else 1
            amount = item["unit_price"] * qty

            item_status = "pending"
            if has_parts_shortage and random.random() < 0.5:
                item_status = "shortage"
            elif status == "completed":
                item_status = "completed"

            order_item = WorkOrderItem(
                work_order_id=order.id,
                item_type="part",
                item_code=item["item_code"],
                item_name=item["item_name"],
                quantity=qty,
                unit_price=item["unit_price"],
                amount=amount,
                technician=order.technician,
                status=item_status,
                part_id=item["part_id"],
            )
            db.add(order_item)
            items.append(order_item)
            total_amount += amount

        order.total_amount = round(total_amount, 2)
        work_orders.append(order)

    return work_orders


def _seed_insurance(db, work_orders):
    insurance_companies = ["中国人保", "平安保险", "太平洋保险", "中国人寿", "阳光保险", "大地保险"]
    accident_types = ["单方事故", "双方事故", "多方事故", "划痕险", "玻璃单独破碎", "涉水险"]
    statuses = ["pending", "submitted", "approved", "rejected", "paid"]
    reviewers = ["审核员A", "审核员B", "审核员C"]

    docs = []
    today = date.today()
    completed_orders = [o for o in work_orders if o.status == "completed"]
    sample_orders = random.sample(completed_orders, min(10, len(completed_orders)))

    for i, order in enumerate(sample_orders, 1):
        doc_no = f"INS{today.strftime('%Y%m')}{i:04d}"
        status = random.choice(statuses)
        estimated = round(random.uniform(500, 12000), 2)
        claim = round(estimated * random.uniform(0.6, 1.0), 2) if status in ["approved", "paid"] else 0

        review_time = None
        reviewer = None
        if status in ["approved", "rejected", "paid"]:
            review_time = datetime.now() - timedelta(days=random.randint(0, 5))
            reviewer = random.choice(reviewers)

        materials = [
            {"name": "行驶证", "status": "received"},
            {"name": "驾驶证", "status": "received"},
            {"name": "身份证", "status": "received"},
            {"name": "事故认定书", "status": random.choice(["received", "pending"])},
            {"name": "维修发票", "status": random.choice(["received", "pending"])},
            {"name": "现场照片", "status": "received"},
        ]

        doc = InsuranceDocument(
            document_no=doc_no,
            work_order_id=order.id,
            insurance_company=random.choice(insurance_companies),
            policy_no=f"POL{random.randint(100000, 999999)}",
            claim_no=f"CLM{random.randint(100000, 999999)}" if status != "pending" else None,
            license_plate=order.license_plate,
            insured_name=order.customer_name,
            accident_type=random.choice(accident_types),
            accident_date=today - timedelta(days=random.randint(1, 30)),
            estimated_amount=estimated,
            claim_amount=claim,
            deductible=round(estimated * random.uniform(0.05, 0.15), 2),
            status=status,
            materials=json.dumps(materials, ensure_ascii=False),
            reviewer=reviewer,
            review_time=review_time,
            remark=None if status != "rejected" else "材料不全，请补充事故现场照片及定损单",
        )
        db.add(doc)
        docs.append(doc)

    return docs


def _seed_quotes(db, work_orders):
    quotes = []
    today = date.today()

    for i, order in enumerate(random.sample(work_orders, min(8, len(work_orders))), 1):
        quote = Quote(
            quote_no=f"QT{today.strftime('%Y%m')}{i:04d}",
            work_order_id=order.id,
            license_plate=order.license_plate,
            customer_name=order.customer_name,
            total_amount=order.total_amount,
            parts_amount=round(order.total_amount * 0.6, 2),
            labor_amount=round(order.total_amount * 0.35, 2),
            discount=round(order.total_amount * 0.05, 2),
            status=random.choice(["draft", "submitted", "approved", "confirmed"]),
            valid_until=today + timedelta(days=30),
            created_by=order.advisor,
            confirmed_by=order.advisor if random.random() < 0.7 else None,
            confirmed_at=datetime.now() - timedelta(days=random.randint(0, 10)) if random.random() < 0.6 else None,
            items_json=json.dumps([], ensure_ascii=False),
        )
        db.add(quote)
        quotes.append(quote)

    return quotes


def _seed_remarks(db, work_orders, parts, appointments):
    remarks = []

    sample_orders = random.sample(work_orders, min(5, len(work_orders)))
    for order in sample_orders:
        remark = Remark(
            related_type="work_order",
            related_id=order.id,
            related_no=order.order_no,
            content=random.choice([
                "客户催进度，需尽快安排",
                "注意客户有投诉历史，服务需谨慎",
                "配件已到，可安排施工",
                "客户要求使用原厂配件",
                "价格有优惠审批",
                "返修工单，重点关注质量",
                "客户要求提供代步车",
            ]),
            author=random.choice(["刘顾问", "周顾问", "王师傅", "张主管"]),
            is_pinned=random.random() < 0.3,
        )
        db.add(remark)
        remarks.append(remark)

    shortage_parts = [p for p in parts if p.is_shortage]
    for part in shortage_parts[:2]:
        remark = Remark(
            related_type="part",
            related_id=part.id,
            related_no=part.part_code,
            content=random.choice([
                "已向供应商下单，预计3天到货",
                "正在调货中",
                "客户同意使用副厂件替代",
                "缺货原因：供应商延迟发货",
            ]),
            author=random.choice(["仓库管理员", "采购专员"]),
            is_pinned=True,
        )
        db.add(remark)
        remarks.append(remark)

    return remarks


def _seed_anomalies(db, work_orders, parts, insurance_docs):
    anomalies = []
    now = datetime.now()

    shortage_parts = [p for p in parts if p.is_shortage]
    for part in shortage_parts:
        severity = "critical" if part.stock_quantity == 0 else "high" if part.stock_quantity < part.safe_stock / 2 else "medium"
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-P{part.id:03d}",
            anomaly_type="parts_shortage",
            severity=severity,
            status=random.choice(["open", "in_progress", "resolved"]),
            source="detection",
            related_table="parts",
            related_id=part.id,
            related_no=part.part_code,
            title=f"配件缺货预警: {part.part_name}",
            description=f"配件 {part.part_name}({part.part_code}) 库存 {part.stock_quantity}{part.unit}，低于安全库存 {part.safe_stock}{part.unit}",
            detected_at=now - timedelta(hours=random.randint(1, 48)),
            handled_by=random.choice(["采购专员", "仓库主管"]) if random.random() < 0.5 else None,
            handled_at=now - timedelta(hours=random.randint(1, 24)) if random.random() < 0.3 else None,
            handle_result=random.choice(["已下单采购", "已调货", ""]) if random.random() < 0.3 else None,
        )
        db.add(anomaly)
        anomalies.append(anomaly)

    rework_orders = [o for o in work_orders if o.is_rework and o.rework_count >= 1]
    for order in rework_orders[:3]:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-W{order.id:03d}",
            anomaly_type="review_flag",
            severity="high" if order.rework_count >= 2 else "medium",
            status=random.choice(["open", "in_progress"]),
            source="detection",
            related_table="work_orders",
            related_id=order.id,
            related_no=order.order_no,
            title=f"高返修工单: {order.order_no}",
            description=f"工单 {order.order_no} 返修次数 {order.rework_count} 次，维修类型：{order.repair_type}，技师：{order.technician}",
            detected_at=now - timedelta(hours=random.randint(2, 24)),
        )
        db.add(anomaly)
        anomalies.append(anomaly)

    rejected_insurance = [d for d in insurance_docs if d.status == "rejected"]
    for doc in rejected_insurance[:2]:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-I{doc.id:03d}",
            anomaly_type="insurance_issue",
            severity="high",
            status="open",
            source="sync",
            related_table="insurance_documents",
            related_id=doc.id,
            related_no=doc.document_no,
            title=f"保险理赔被拒: {doc.document_no}",
            description=f"{doc.insurance_company} 拒赔，原因: {doc.remark}",
            detected_at=now - timedelta(hours=random.randint(1, 12)),
        )
        db.add(anomaly)
        anomalies.append(anomaly)

    return anomalies


def _seed_sync_logs(db):
    logs = []
    tasks = [
        ("配件系统同步", "parts_system", "success"),
        ("维修工单同步", "work_order_system", "success"),
        ("保险材料同步", "insurance_system", "success"),
    ]

    for task_name, source, status in tasks:
        for i in range(3):
            started = datetime.now() - timedelta(hours=i * 5, minutes=random.randint(0, 30))
            duration = random.randint(10, 120)
            finished = started + timedelta(seconds=duration)

            log = SyncLog(
                task_name=task_name,
                source_system=source,
                sync_type="incremental",
                status=status,
                records_count=random.randint(5, 20),
                error_count=0,
                started_at=started,
                finished_at=finished,
                duration_seconds=duration,
            )
            db.add(log)
            logs.append(log)

    return logs


if __name__ == "__main__":
    seed_all_data()
