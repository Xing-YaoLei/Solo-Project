from sqlalchemy.orm import Session
import random
import uuid
from datetime import datetime, timedelta

from app.models.models import (
    Property, OTAOrder, PaymentTransaction, DoorRecord,
    Complaint, ComplaintLog, CallbackRecord
)


REGIONS = ["华东区", "华北区", "华南区", "西南区", "西北区", "东北区", "华中区"]
CATEGORIES = ["卫生问题", "设施故障", "服务态度", "噪音扰民", "预订纠纷", "安全问题", "其他"]
SEVERITIES = ["low", "medium", "high", "critical"]
STATUSES = ["pending", "processing", "escalated", "resolved", "closed"]
HANDLERS = ["张经理", "李主管", "王客服", "赵组长", "刘专员", "陈总监"]
DEPARTMENTS = ["客房部", "前台部", "工程部", "安保部", "保洁部", "客服中心"]
RESPONSIBILITIES = ["员工操作不当", "设备老化", "系统故障", "沟通不畅", "客人误解", "第三方问题"]
CALLBACK_RESULTS = ["satisfied", "unsatisfied", "pending"]
OTA_PLATFORMS = ["携程", "美团", "飞猪", "途家", "爱彼迎", "小猪"]


def generate_uuid():
    return str(uuid.uuid4())


def seed_database(db: Session):
    if db.query(Property).count() > 0:
        print("数据已存在，跳过初始化")
        return

    print("开始初始化模拟数据...")

    properties = []
    for i in range(12):
        region = REGIONS[i % len(REGIONS)]
        p = Property(
            id=generate_uuid(),
            name=f"{region}精品民宿-{i + 1:02d}号店",
            region=region,
            address=f"{region}某市某区街道{i + 1}号",
            contact=f"138{random.randint(10000000, 99999999)}",
            created_at=datetime.now() - timedelta(days=random.randint(100, 500))
        )
        properties.append(p)
        db.add(p)
    db.commit()
    print(f"已创建 {len(properties)} 个民宿")

    ota_orders = []
    for i in range(200):
        prop = random.choice(properties)
        platform = random.choice(OTA_PLATFORMS)
        check_in = datetime.now() - timedelta(days=random.randint(1, 90))
        check_out = check_in + timedelta(days=random.randint(1, 5))
        order = OTAOrder(
            id=generate_uuid(),
            platform_order_no=f"{platform[:2].upper()}{random.randint(100000000, 999999999)}",
            property_id=prop.id,
            guest_name=f"客人{i + 1:03d}",
            check_in=check_in,
            check_out=check_out,
            amount=round(random.uniform(200, 2000), 2),
            source=platform,
            synced_at=check_in - timedelta(hours=random.randint(1, 48))
        )
        ota_orders.append(order)
        db.add(order)
    db.commit()
    print(f"已创建 {len(ota_orders)} 个OTA订单")

    payments = []
    for i in range(150):
        order = random.choice(ota_orders)
        p = PaymentTransaction(
            id=generate_uuid(),
            transaction_no=f"PAY{random.randint(100000000000, 999999999999)}",
            order_id=order.id,
            property_id=order.property_id,
            amount=order.amount,
            payment_method=random.choice(["微信", "支付宝", "银行卡", "现金"]),
            status="success",
            transacted_at=order.check_in + timedelta(hours=random.randint(0, 24)),
            synced_at=order.check_in + timedelta(hours=random.randint(1, 5))
        )
        payments.append(p)
        db.add(p)
    db.commit()
    print(f"已创建 {len(payments)} 条收款记录")

    door_records = []
    for i in range(300):
        prop = random.choice(properties)
        d = DoorRecord(
            id=generate_uuid(),
            property_id=prop.id,
            room_no=f"{random.randint(1, 20):02d}{random.randint(1, 9):02d}",
            card_no=f"CARD{random.randint(10000, 99999)}",
            action_type=random.choice(["开门", "关门", "刷卡失败"]),
            action_time=datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59)),
            synced_at=datetime.now() - timedelta(hours=random.randint(0, 24))
        )
        door_records.append(d)
        db.add(d)
    db.commit()
    print(f"已创建 {len(door_records)} 条门锁记录")

    complaints = []
    for i in range(120):
        prop = random.choice(properties)
        order = random.choice(ota_orders) if random.random() > 0.3 else None
        severity = random.choices(SEVERITIES, weights=[0.3, 0.35, 0.25, 0.1])[0]
        status_weights = [0.1, 0.2, 0.1, 0.3, 0.3]
        status = random.choices(STATUSES, weights=status_weights)[0]
        category = random.choice(CATEGORIES)

        target_time_map = {"low": 1440, "medium": 720, "high": 360, "critical": 120}
        target_time = target_time_map[severity]

        created_at = datetime.now() - timedelta(
            days=random.randint(0, 60),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        processing_time = 0
        is_overdue = False
        assigned_at = None
        resolved_at = None
        closed_at = None
        escalated = False
        escalated_at = None
        escalation_level = 0

        if status in ["processing", "escalated", "resolved", "closed"]:
            assigned_at = created_at + timedelta(minutes=random.randint(5, 60))
            processing_time = random.randint(30, target_time * 3)
            if processing_time > target_time:
                is_overdue = True

        if severity in ["high", "critical"] and random.random() > 0.4:
            escalated = True
            escalation_level = random.choice([1, 2, 3])
            escalated_at = assigned_at + timedelta(minutes=random.randint(10, 120)) if assigned_at else created_at + timedelta(minutes=30)
            status = "escalated" if status == "processing" else status

        if status in ["resolved", "closed"]:
            resolved_at = created_at + timedelta(minutes=processing_time)
            if status == "closed":
                closed_at = resolved_at + timedelta(hours=random.randint(1, 48))

        callback_result = None
        callback_note = None
        if status in ["resolved", "closed"] and random.random() > 0.2:
            callback_result = random.choices(CALLBACK_RESULTS, weights=[0.6, 0.2, 0.2])[0]
            callback_note_map = {
                "satisfied": "客人对处理结果非常满意，已达成和解",
                "unsatisfied": "客人对处理方案不认同，需要进一步跟进",
                "pending": "回访电话未接通，稍后再试"
            }
            callback_note = callback_note_map.get(callback_result, "")

        responsibility_dept = None
        responsibility = None
        if status in ["resolved", "closed"]:
            responsibility_dept = random.choice(DEPARTMENTS)
            responsibility = random.choice(RESPONSIBILITIES)

        handler = random.choice(HANDLERS) if status != "pending" else None

        c = Complaint(
            id=generate_uuid(),
            order_id=order.id if order else None,
            property_id=prop.id,
            region=prop.region,
            category=category,
            severity=severity,
            status=status,
            description=f"{category}相关投诉：客人反馈{random.choice(['房间', '公共区域', '服务人员'])}存在问题，需要及时处理。详细情况请查看处理记录。",
            created_at=created_at,
            assigned_at=assigned_at,
            resolved_at=resolved_at,
            closed_at=closed_at,
            handler=handler,
            escalated=escalated,
            escalated_at=escalated_at,
            escalation_level=escalation_level,
            processing_time=processing_time,
            target_time=target_time,
            is_overdue=is_overdue,
            callback_result=callback_result,
            callback_note=callback_note,
            responsibility=responsibility,
            responsibility_dept=responsibility_dept
        )
        complaints.append(c)
        db.add(c)
    db.commit()
    print(f"已创建 {len(complaints)} 条客诉记录")

    for c in complaints:
        log = ComplaintLog(
            id=generate_uuid(),
            complaint_id=c.id,
            action="客诉创建",
            operator="系统自动",
            note=f"客诉工单创建，类型：{c.category}，紧急程度：{c.severity}",
            created_at=c.created_at
        )
        db.add(log)

        if c.assigned_at:
            log2 = ComplaintLog(
                id=generate_uuid(),
                complaint_id=c.id,
                action="分配处理人",
                operator="主管分配",
                note=f"已分配给 {c.handler} 处理",
                created_at=c.assigned_at
            )
            db.add(log2)

        if c.escalated and c.escalated_at:
            log3 = ComplaintLog(
                id=generate_uuid(),
                complaint_id=c.id,
                action="升级处理",
                operator=c.handler or "系统",
                note=f"已升级至 {c.escalation_level} 级处理",
                created_at=c.escalated_at
            )
            db.add(log3)

        if c.resolved_at:
            log4 = ComplaintLog(
                id=generate_uuid(),
                complaint_id=c.id,
                action="处理完成",
                operator=c.handler or "系统",
                note=f"问题已解决，处理耗时 {c.processing_time} 分钟",
                created_at=c.resolved_at
            )
            db.add(log4)

        if c.callback_result:
            cb = CallbackRecord(
                id=generate_uuid(),
                complaint_id=c.id,
                result=c.callback_result,
                note=c.callback_note,
                operator=c.handler or "客服",
                created_at=(c.resolved_at or c.created_at) + timedelta(hours=random.randint(1, 24))
            )
            db.add(cb)

    db.commit()
    print("模拟数据初始化完成！")
