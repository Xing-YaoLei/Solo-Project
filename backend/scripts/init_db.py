import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import Base, engine, SessionLocal
from app.models.models import (
    Property, OTAOrder, PaymentTransaction, DoorRecord,
    Complaint, ComplaintLog, CallbackRecord,
    SyncNode, SyncBatch, SyncLog
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("开始初始化数据库...")

    if db.query(Property).count() > 0:
        print("数据库已初始化，跳过数据生成。")
        db.close()
        sys.exit(0)

    regions = ["华东区", "华南区", "华北区", "西南区", "西北区", "华中区", "东北区"]
    property_names = [
        "西湖畔民宿", "鼓浪屿小院", "丽江古城客栈", "阳朔山水民宿",
        "三亚海景别墅", "黄山云端民宿", "成都宽窄巷子民宿", "西安古城民宿",
        "苏州园林民宿", "杭州茶韵民宿", "南京秦淮河民宿", "北京胡同民宿"
    ]

    properties = []
    for i, name in enumerate(property_names):
        prop = Property(
            name=name,
            region=regions[i % len(regions)],
            address=f"{regions[i % len(regions)]}某某路{i+1}号",
            contact=f"138{random.randint(10000000, 99999999)}"
        )
        db.add(prop)
        properties.append(prop)
    db.flush()

    print(f"已创建 {len(properties)} 个民宿")

    categories = ["卫生问题", "设施故障", "服务态度", "噪音问题", "预订纠纷", "安全问题", "其他"]
    severities = ["low", "medium", "high", "critical"]
    statuses = ["pending", "processing", "escalated", "resolved", "closed"]
    callback_results = ["satisfied", "unsatisfied", "pending"]
    responsibilities = ["客房部", "前台", "工程部", "安保部", "保洁部", "管理层"]
    handlers = ["张三", "李四", "王五", "赵六", "钱七", "孙八"]

    ota_orders = []
    for i in range(200):
        prop = random.choice(properties)
        check_in = datetime.now() - timedelta(days=random.randint(1, 60))
        check_out = check_in + timedelta(days=random.randint(1, 7))
        order = OTAOrder(
            platform_order_no=f"OTA{random.randint(10000000, 99999999)}",
            property_id=prop.id,
            guest_name=f"客人{i+1}",
            check_in=check_in,
            check_out=check_out,
            amount=round(random.uniform(200, 2000), 2),
            source=random.choice(["携程", "美团", "飞猪", " Airbnb", "途家"]),
            synced_at=check_in - timedelta(hours=random.randint(1, 48))
        )
        db.add(order)
        ota_orders.append(order)
    db.flush()
    print(f"已创建 {len(ota_orders)} 个OTA订单")

    for i in range(150):
        order = random.choice(ota_orders)
        trans = PaymentTransaction(
            transaction_no=f"PAY{random.randint(1000000000, 9999999999)}",
            order_id=order.id,
            property_id=order.property_id,
            amount=order.amount,
            payment_method=random.choice(["微信支付", "支付宝", "银行卡", "现金"]),
            status="success",
            transacted_at=order.check_in,
            synced_at=order.check_in + timedelta(minutes=random.randint(1, 60))
        )
        db.add(trans)
    db.flush()
    print("已创建150条收款流水")

    for i in range(300):
        prop = random.choice(properties)
        door = DoorRecord(
            property_id=prop.id,
            room_no=f"{random.randint(1, 5):02d}{random.randint(1, 20):02d}",
            card_no=f"CARD{random.randint(1000, 9999)}",
            action_type=random.choice(["开门", "关门", "刷卡失败", "反锁"]),
            action_time=datetime.now() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23)),
            synced_at=datetime.now() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
        )
        db.add(door)
    db.flush()
    print("已创建300条门锁记录")

    complaints = []
    for i in range(120):
        prop = random.choice(properties)
        order = random.choice([o for o in ota_orders if o.property_id == prop.id] or ota_orders)
        created_at = datetime.now() - timedelta(days=random.randint(0, 60))
        status = random.choices(statuses, weights=[0.1, 0.2, 0.1, 0.2, 0.4])[0]
        
        assigned_at = created_at + timedelta(minutes=random.randint(5, 60))
        resolved_at = None
        closed_at = None
        processing_time = 0
        escalated = random.random() < 0.25
        escalated_at = None
        escalation_level = 0
        is_overdue = False
        callback_result = None
        target_time = random.choice([60, 120, 360, 720, 1440])

        if status in ["resolved", "closed"]:
            resolved_at = assigned_at + timedelta(minutes=random.randint(30, 4320))
            processing_time = int((resolved_at - assigned_at).total_seconds() / 60)
            is_overdue = processing_time > target_time
            if status == "closed":
                closed_at = resolved_at + timedelta(hours=random.randint(1, 24))
                callback_result = random.choices(callback_results, weights=[0.6, 0.2, 0.2])[0]

        if escalated:
            escalated_at = assigned_at + timedelta(minutes=random.randint(60, 720))
            escalation_level = random.randint(1, 3)
            if not is_overdue and status not in ["pending"]:
                is_overdue = True

        complaint = Complaint(
            order_id=order.id,
            property_id=prop.id,
            region=prop.region,
            category=random.choice(categories),
            severity=random.choice(severities),
            status=status,
            description=f"客人投诉{random.choice(categories)}相关问题，需要尽快处理。",
            created_at=created_at,
            assigned_at=assigned_at,
            resolved_at=resolved_at,
            closed_at=closed_at,
            handler=random.choice(handlers),
            escalated=escalated,
            escalated_at=escalated_at,
            escalation_level=escalation_level,
            processing_time=processing_time,
            target_time=target_time,
            is_overdue=is_overdue,
            callback_result=callback_result,
            callback_note="客人反馈处理结果" if callback_result and callback_result != "pending" else None,
            responsibility=random.choice(responsibilities) if callback_result else None,
            responsibility_dept=random.choice(responsibilities) if callback_result else None
        )
        db.add(complaint)
        complaints.append(complaint)
    db.flush()
    print(f"已创建 {len(complaints)} 条客诉记录")

    for complaint in complaints:
        log1 = ComplaintLog(
            complaint_id=complaint.id,
            action="创建客诉",
            operator="系统自动",
            note="客诉单已创建"
        )
        db.add(log1)
        if complaint.assigned_at:
            log2 = ComplaintLog(
                complaint_id=complaint.id,
                action="分配处理人",
                operator=complaint.handler,
                note=f"已分配给{complaint.handler}处理"
            )
            db.add(log2)
        if complaint.escalated and complaint.escalated_at:
            log3 = ComplaintLog(
                complaint_id=complaint.id,
                action="升级处理",
                operator="系统自动",
                note=f"客诉已升级至{complaint.escalation_level}级"
            )
            db.add(log3)
        if complaint.callback_result:
            log4 = ComplaintLog(
                complaint_id=complaint.id,
                action="客户回访",
                operator="客服专员",
                note=f"回访结果：{complaint.callback_result}"
            )
            db.add(log4)
            callback = CallbackRecord(
                complaint_id=complaint.id,
                result=complaint.callback_result,
                note=complaint.callback_note or "",
                operator="客服专员"
            )
            db.add(callback)
    db.flush()
    print("已创建客诉处理日志和回访记录")

    sync_node_data = [
        ("门锁数据采集", "door_lock", 1),
        ("门锁格式校验", "door_lock", 2),
        ("门锁去重处理", "door_lock", 3),
        ("门锁数据转换", "door_lock", 4),
        ("门锁业务校验", "door_lock", 5),
        ("门锁入库持久化", "door_lock", 6),
        ("门锁DuckDB同步", "door_lock", 7),
        ("收款数据采集", "payment", 1),
        ("收款格式校验", "payment", 2),
        ("收款去重处理", "payment", 3),
        ("收款数据转换", "payment", 4),
        ("收款业务校验", "payment", 5),
        ("收款入库持久化", "payment", 6),
        ("收款DuckDB同步", "payment", 7),
        ("OTA数据采集", "ota", 1),
        ("OTA格式校验", "ota", 2),
        ("OTA去重处理", "ota", 3),
        ("OTA数据转换", "ota", 4),
        ("OTA业务校验", "ota", 5),
        ("OTA入库持久化", "ota", 6),
        ("OTADuckDB同步", "ota", 7),
    ]

    sync_nodes = []
    for name, source_type, seq_order in sync_node_data:
        node = SyncNode(
            name=name,
            source_type=source_type,
            status=random.choice(["success", "success", "success", "running", "failed"]),
            seq_order=seq_order,
            last_sync_time=datetime.now() - timedelta(minutes=random.randint(1, 120))
        )
        db.add(node)
        sync_nodes.append(node)
    db.flush()
    print(f"已创建 {len(sync_nodes)} 个同步节点")

    for batch_i in range(10):
        for source_type in ["door_lock", "payment", "ota"]:
            batch = SyncBatch(
                source_type=source_type,
                started_at=datetime.now() - timedelta(hours=batch_i * 2),
                ended_at=datetime.now() - timedelta(hours=batch_i * 2, minutes=random.randint(2, 10)),
                status="success",
                total_count=random.randint(50, 200),
                success_count=random.randint(48, 200),
                fail_count=random.randint(0, 2)
            )
            db.add(batch)
            db.flush()

            source_nodes = [n for n in sync_nodes if n.source_type == source_type]
            for node in source_nodes:
                log = SyncLog(
                    node_id=node.id,
                    batch_id=batch.id,
                    status=random.choice(["success", "success", "success", "failed"]),
                    record_count=random.randint(30, 150),
                    duration_ms=random.randint(50, 5000),
                    started_at=batch.started_at + timedelta(seconds=node.seq_order * 5),
                    ended_at=batch.started_at + timedelta(seconds=node.seq_order * 5, milliseconds=random.randint(50, 5000)),
                    error_detail=None if random.random() > 0.1 else "数据格式校验失败",
                    raw_data_sample={"sample_id": random.randint(1, 1000), "timestamp": datetime.now().isoformat()} if random.random() > 0.5 else None
                )
                db.add(log)
    db.flush()
    print("已创建同步批次和日志")

    db.commit()
    print("数据库初始化完成！")

except Exception as e:
    db.rollback()
    print(f"初始化失败: {e}")
    raise
finally:
    db.close()
