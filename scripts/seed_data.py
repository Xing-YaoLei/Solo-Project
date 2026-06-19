#!/usr/bin/env python3
from datetime import date, datetime, timedelta
import uuid
import random
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.database import get_db_session
from data.models import (
    Property, RoomStatus, OTAOrder, PaymentTransaction,
    DoorLockRecord, CleaningTask, Note, DataAnomaly
)

CHANNELS = ["携程", "美团", "飞猪", "去哪儿", "Airbnb", "直接预订", "线下"]
ORDER_STATUSES = ["待确认", "已确认", "已入住", "已退房", "已取消", "已完成", "no_show"]
PAYMENT_METHODS = ["微信", "支付宝", "银行卡", "现金", "OTA代收"]
PAYMENT_STATUSES = ["待支付", "已支付", "支付失败", "已退款", "部分退款"]
LOCK_ACTIONS = ["开门", "关门", "反锁", "解锁失败", "密码错误"]
CLEANING_TYPES = ["日常保洁", "退房保洁", "深度清洁", "布草更换", "设施维修"]
CLEANING_STATUSES = ["待执行", "进行中", "已完成", "已取消"]
ROOM_TYPES = ["大床房", "双床房", "套房", "家庭房", "海景房"]
CITIES = ["杭州", "成都", "厦门", "丽江", "三亚", "大理", "西安", "苏州"]
STAFF = ["张阿姨", "李阿姨", "王师傅", "陈保洁", "刘阿姨"]


def generate_properties():
    properties = []
    for i in range(1, 11):
        city = random.choice(CITIES)
        prop = Property(
            property_code=f"HS{i:04d}",
            property_name=f"{city}·精品民宿{i}号院",
            room_count=random.randint(3, 15),
            city=city,
            district=f"{city}景区",
            address=f"{city}某区某街道{i}号",
            status="active"
        )
        properties.append(prop)
    return properties


def generate_ota_orders(properties, start_date, end_date):
    orders = []
    date_range = (end_date - start_date).days

    for _ in range(200):
        prop = random.choice(properties)
        check_in = start_date + timedelta(days=random.randint(0, date_range - 3))
        nights = random.randint(1, 7)
        check_out = check_in + timedelta(days=nights)
        channel = random.choice(CHANNELS)
        status = random.choices(
            ORDER_STATUSES,
            weights=[5, 25, 15, 30, 10, 10, 5]
        )[0]
        room_count = random.randint(1, 3)
        nightly_rate = random.randint(280, 1280)
        total_amount = nightly_rate * nights * room_count
        paid_ratio = 1.0 if status in ["已入住", "已退房", "已完成"] else random.uniform(0.3, 1.0)

        order = OTAOrder(
            order_no=f"OTA{datetime.now().strftime('%Y%m%d')}{random.randint(100000, 999999)}",
            property_id=prop.id,
            channel=channel,
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name=f"客人{random.randint(1000, 9999)}",
            guest_phone=f"1{random.choice(['3','5','7','8','9'])}{random.randint(100000000, 999999999)}",
            room_count=room_count,
            room_type=random.choice(ROOM_TYPES),
            total_amount=round(total_amount, 2),
            paid_amount=round(total_amount * paid_ratio, 2),
            order_status=status,
            raw_data=json.dumps({
                "source": "mock_data",
                "generated_at": datetime.now().isoformat()
            }, ensure_ascii=False),
            is_anomaly=False
        )
        orders.append(order)

    for i in range(3):
        prop = random.choice(properties)
        orders.append(OTAOrder(
            order_no=f"ANOMALY{i:03d}",
            property_id=prop.id,
            channel=random.choice(CHANNELS),
            check_in_date=end_date + timedelta(days=1),
            check_out_date=end_date - timedelta(days=1),
            guest_name="异常客人",
            room_count=0,
            room_type=random.choice(ROOM_TYPES),
            total_amount=-100.00,
            paid_amount=0,
            order_status="未知状态",
            raw_data=json.dumps({"source": "mock_anomaly"}, ensure_ascii=False),
            is_anomaly=True,
            anomaly_detail=json.dumps([{
                "type": "invalid_date_range",
                "description": "退房日期早于入住日期"
            }], ensure_ascii=False)
        ))

    return orders


def generate_payments(properties, orders, start_date, end_date):
    payments = []
    date_range = (end_date - start_date).days

    for order in orders:
        if order.is_anomaly:
            continue
        if random.random() < 0.7:
            pay_time = datetime.combine(
                order.check_in_date - timedelta(days=random.randint(0, 3)),
                datetime.min.time()
            ) + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59))

            payments.append(PaymentTransaction(
                transaction_no=f"PAY{datetime.now().strftime('%Y%m%d')}{random.randint(100000, 999999)}",
                order_id=order.id,
                property_id=order.property_id,
                channel=order.channel,
                payment_method=random.choice(PAYMENT_METHODS),
                amount=float(order.paid_amount),
                transaction_time=pay_time,
                transaction_status="已支付",
                payer=order.guest_name,
                raw_data=json.dumps({"source": "mock_data"}, ensure_ascii=False),
                is_anomaly=False
            ))

    for _ in range(50):
        prop = random.choice(properties)
        pay_time = datetime.combine(
            start_date + timedelta(days=random.randint(0, date_range)),
            datetime.min.time()
        ) + timedelta(hours=random.randint(6, 23), minutes=random.randint(0, 59))

        payments.append(PaymentTransaction(
            transaction_no=f"PAY{datetime.now().strftime('%Y%m%d')}{random.randint(100000, 999999)}",
            property_id=prop.id,
            channel="线下",
            payment_method=random.choice(PAYMENT_METHODS),
            amount=round(random.uniform(100, 5000), 2),
            transaction_time=pay_time,
            transaction_status=random.choice(PAYMENT_STATUSES),
            payer=f"散客{random.randint(100, 999)}",
            raw_data=json.dumps({"source": "mock_data"}, ensure_ascii=False),
            is_anomaly=False
        ))

    return payments


def generate_door_lock_records(properties, start_date, end_date):
    records = []
    date_range = (end_date - start_date).days

    for prop in properties:
        daily_records = random.randint(3, 15)
        for _ in range(daily_records * (date_range + 1)):
            action_time = datetime.combine(
                start_date + timedelta(days=random.randint(0, date_range)),
                datetime.min.time()
            ) + timedelta(hours=random.randint(6, 23), minutes=random.randint(0, 59))

            records.append(DoorLockRecord(
                record_no=f"LOCK{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}",
                property_id=prop.id,
                lock_device_id=f"DEV-{prop.property_code}-{random.randint(1, prop.room_count)}",
                action_type=random.choice(LOCK_ACTIONS),
                action_time=action_time,
                operator=random.choice(["客人", "保洁", "管理员", "维修"]),
                operator_type=random.choice(["guest", "staff", "admin"]),
                room_no=f"{random.randint(101, 599)}",
                raw_data=json.dumps({"source": "mock_data"}, ensure_ascii=False),
                is_anomaly=False
            ))

    return records


def generate_cleaning_tasks(properties, orders, start_date, end_date):
    tasks = []

    for order in orders:
        if order.order_status in ["已退房", "已完成"]:
            tasks.append(CleaningTask(
                task_no=f"CLEAN{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}",
                property_id=order.property_id,
                order_id=order.id,
                room_type=order.room_type,
                scheduled_date=order.check_out_date,
                task_type="退房保洁",
                task_status=random.choice(CLEANING_STATUSES),
                assigned_to=random.choice(STAFF),
                completed_at=datetime.combine(order.check_out_date, datetime.min.time()) + timedelta(hours=15),
                remark="标准退房清洁"
            ))

    date_range = (end_date - start_date).days
    for _ in range(100):
        prop = random.choice(properties)
        sched_date = start_date + timedelta(days=random.randint(0, date_range))

        tasks.append(CleaningTask(
            task_no=f"CLEAN{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}",
            property_id=prop.id,
            room_type=random.choice(ROOM_TYPES),
            scheduled_date=sched_date,
            task_type=random.choice(CLEANING_TYPES),
            task_status=random.choice(CLEANING_STATUSES),
            assigned_to=random.choice(STAFF),
            remark=random.choice(["", "客人特别要求", "定期维护", "补充布草"])
        ))

    return tasks


def generate_room_status(properties, orders, start_date, end_date):
    statuses = []
    current = start_date

    while current <= end_date:
        for prop in properties:
            for room_type in ROOM_TYPES[:random.randint(2, 4)]:
                day_orders = [
                    o for o in orders
                    if o.property_id == prop.id
                    and o.room_type == room_type
                    and o.check_in_date <= current < o.check_out_date
                    and o.order_status in ["已确认", "已入住", "已完成"]
                ]

                occupied = len(day_orders) > 0
                order_status = day_orders[0].order_status if day_orders else "空房"
                occupancy = "occupied" if occupied else "vacant"
                source = day_orders[0].channel if day_orders else None

                has_conflict = False
                conflict_detail = None
                if len(day_orders) > 1 and len(set(o.order_status for o in day_orders)) > 1:
                    has_conflict = True
                    conflict_detail = json.dumps({
                        "conflicting_statuses": list(set(o.order_status for o in day_orders))
                    }, ensure_ascii=False)

                if random.random() < 0.02:
                    has_conflict = True
                    conflict_detail = json.dumps({
                        "conflicting_statuses": ["已预订", "已入住"],
                        "reason": "渠道同步延迟"
                    }, ensure_ascii=False)

                statuses.append(RoomStatus(
                    property_id=prop.id,
                    status_date=current,
                    room_type=room_type,
                    status=order_status,
                    occupancy_status=occupancy,
                    source=source,
                    has_conflict=has_conflict,
                    conflict_detail=conflict_detail
                ))
        current += timedelta(days=1)

    return statuses


def generate_notes(properties):
    notes = []
    note_texts = [
        "本周入住率不错，继续保持",
        "携程渠道订单增长明显，建议增加库存",
        "门锁系统出现异常，已联系供应商",
        "保洁人员不足，需要临时支援",
        "客人反馈热水问题，已安排维修",
        "下个月旅游旺季，提前做好准备",
        "美团点评分数提升至4.8分",
        "发现房态冲突，已协调渠道解决"
    ]

    for prop in properties[:5]:
        for i in range(random.randint(1, 3)):
            notes.append(Note(
                entity_type="property",
                entity_id=prop.id,
                content=random.choice(note_texts),
                created_by=random.choice(["运营经理", "店长", "系统"])
            ))

    return notes


def seed_all():
    end_date = date.today() + timedelta(days=60)
    start_date = date.today() - timedelta(days=30)

    print(f"开始生成模拟数据，日期范围: {start_date} ~ {end_date}")

    with get_db_session() as db:
        db.query(DataAnomaly).delete()
        db.query(Note).delete()
        db.query(CleaningTask).delete()
        db.query(DoorLockRecord).delete()
        db.query(PaymentTransaction).delete()
        db.query(OTAOrder).delete()
        db.query(RoomStatus).delete()
        db.query(Property).delete()
        db.flush()

        print("正在生成房源...")
        properties = generate_properties()
        db.add_all(properties)
        db.flush()
        print(f"  生成 {len(properties)} 个房源")

        print("正在生成OTA订单...")
        orders = generate_ota_orders(properties, start_date, end_date)
        db.add_all(orders)
        db.flush()
        print(f"  生成 {len(orders)} 条订单")

        print("正在生成收款流水...")
        payments = generate_payments(properties, orders, start_date, end_date)
        db.add_all(payments)
        db.flush()
        print(f"  生成 {len(payments)} 条流水")

        print("正在生成门锁记录...")
        locks = generate_door_lock_records(properties, start_date, end_date)
        db.add_all(locks)
        db.flush()
        print(f"  生成 {len(locks)} 条门锁记录")

        print("正在生成保洁任务...")
        cleanings = generate_cleaning_tasks(properties, orders, start_date, end_date)
        db.add_all(cleanings)
        db.flush()
        print(f"  生成 {len(cleanings)} 条保洁任务")

        print("正在生成房态数据...")
        statuses = generate_room_status(properties, orders, start_date, end_date)
        db.add_all(statuses)
        db.flush()
        print(f"  生成 {len(statuses)} 条房态记录")

        print("正在生成备注...")
        notes = generate_notes(properties)
        db.add_all(notes)
        db.flush()
        print(f"  生成 {len(notes)} 条备注")

        print("\n模拟数据生成完成！")


if __name__ == "__main__":
    seed_all()
