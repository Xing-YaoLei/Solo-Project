import random
from datetime import datetime, timedelta

from db.connection import db_session, init_db
from db.models import (
    Appointment,
    CashierRecord,
    DataRefreshLog,
    Inventory,
    ReviewRecord,
    User,
)


STORES = [
    {"store_id": "S001", "name": "旗舰店"},
    {"store_id": "S002", "name": "朝阳店"},
]

STAFFS = {
    "S001": [
        {"staff_id": "ST-001", "staff_name": "张技师"},
        {"staff_id": "ST-002", "staff_name": "李技师"},
    ],
    "S002": [
        {"staff_id": "ST-101", "staff_name": "王技师"},
    ],
}

SERVICE_ITEMS = [
    "深度清洁SPA",
    "美甲护理",
    "精油按摩",
    "热石理疗",
    "面部美容",
    "染发烫发",
]

PAYMENT_METHODS = ["wechat", "alipay", "cash", "card"]
RESCHEDULE_REASONS = [
    "顾客临时有事",
    "技师突发调整",
    "天气原因",
    "顾客身体不适",
    "系统误操作",
]
CUSTOMER_NAMES = [
    "王小美", "李大姐", "张丽娜", "赵晓红", "刘雅芬",
    "孙美琪", "周思佳", "吴文静", "郑美玲", "钱丽娟",
    "孙倩", "李菲", "王芳", "张媛", "赵丽",
]


def _randint(a: int, b: int) -> int:
    return random.randint(a, b)


def _choice(seq):
    return random.choice(seq)


def seed_users():
    users = [
        {"username": "admin01", "role": "admin", "store_id": None,
         "password_hash": "sha256$demo_admin"},
        {"username": "manager_s001", "role": "store_manager", "store_id": "S001",
         "password_hash": "sha256$demo_manager"},
        {"username": "staff_s001", "role": "staff", "store_id": "S001",
         "password_hash": "sha256$demo_staff"},
        {"username": "viewer_s001", "role": "viewer", "store_id": "S001",
         "password_hash": "sha256$demo_viewer"},
        {"username": "manager_s002", "role": "store_manager", "store_id": "S002",
         "password_hash": "sha256$demo_manager2"},
    ]
    with db_session() as session:
        session.query(User).delete()
        for u in users:
            session.add(User(
                username=u["username"],
                password_hash=u["password_hash"],
                role=u["role"],
                store_id=u["store_id"],
                is_active=True,
            ))
        session.commit()


def seed_inventory(store_id: str):
    rows = []
    for service in SERVICE_ITEMS:
        stock = _randint(0, 15)
        reserved = _randint(0, 5)
        rows.append(Inventory(
            store_id=store_id,
            service_item=service,
            sku=f"SKU-{service[:4].upper()}-{store_id}",
            stock_qty=stock,
            reserved_qty=min(reserved, stock),
            unit="次",
        ))
    service_with_shortage = _choice(SERVICE_ITEMS)
    for r in rows:
        if r.service_item == service_with_shortage:
            r.stock_qty = 0
            r.reserved_qty = 0
            break
    return rows


def seed_customers(store_id: str, count: int = 15):
    base_idx = hash(store_id) % 100
    customers = []
    for i in range(count):
        idx = (base_idx + i) % len(CUSTOMER_NAMES)
        customers.append({
            "customer_id": f"C-{store_id}-{i + 1:03d}",
            "customer_name": CUSTOMER_NAMES[idx],
        })
    return customers


def seed_appointments(store_id: str, days: int = 30):
    now = datetime.utcnow()
    start = now - timedelta(days=days - 1)
    staffs = STAFFS.get(store_id, [])
    if not staffs:
        return [], [], []

    customers = seed_customers(store_id, count=15)
    appointments = []
    cashier_records = []
    reviews = []
    appt_id_counter = 1
    cashier_id_counter = 1
    review_id_counter = 1

    past_customer_status: dict[str, list[str]] = {}

    for day in range(days):
        day_date = start + timedelta(days=day)
        appt_per_day = _randint(4, 8)
        customers_today = random.sample(customers, k=min(appt_per_day, len(customers)))
        for i, cust in enumerate(customers_today):
            hour = 10 + (i * 2) % 10
            minute = random.choice([0, 15, 30, 45])
            appt_time = day_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            end_time = appt_time + timedelta(hours=1)

            staff = _choice(staffs)
            service = _choice(SERVICE_ITEMS)

            past_list = past_customer_status.setdefault(cust["customer_id"], [])
            if len(past_list) >= 2 and past_list[-1] == "not_arrived" and past_list[-2] == "not_arrived":
                choice_pool = ["arrived", "late"]
            elif len(past_list) >= 1 and past_list[-1] == "not_arrived":
                choice_pool = ["arrived", "not_arrived", "late", "cancelled"]
            else:
                choice_pool = ["arrived", "arrived", "arrived", "not_arrived", "late", "cancelled"]

            attendance = _choice(choice_pool)
            status = "booked" if attendance != "cancelled" else "cancelled"
            past_list.append(attendance)

            reschedule_count = 0
            reschedule_reason = None
            if random.random() < 0.25:
                reschedule_count = _randint(1, 5)
                reschedule_reason = _choice(RESCHEDULE_REASONS)

            appt = Appointment(
                id=appt_id_counter,
                store_id=store_id,
                customer_id=cust["customer_id"],
                customer_name=cust["customer_name"],
                service_item=service,
                staff_id=staff["staff_id"],
                staff_name=staff["staff_name"],
                appointment_time=appt_time,
                end_time=end_time,
                status=status,
                attendance_status=attendance,
                reschedule_count=reschedule_count,
                reschedule_reason=reschedule_reason,
                original_time=appt_time - timedelta(hours=reschedule_count) if reschedule_count else None,
                reminder_sent=random.random() < 0.7,
                reminder_sent_at=appt_time - timedelta(hours=2),
                is_anomaly=False,
                anomaly_reason=None,
                created_at=now - timedelta(days=days - day, hours=_randint(1, 48)),
                updated_at=now,
            )
            appointments.append(appt)
            appt_id_counter += 1

            if attendance in ("arrived", "late"):
                amount = float(_randint(198, 1298))
                cashier_records.append(CashierRecord(
                    id=cashier_id_counter,
                    store_id=store_id,
                    appointment_id=appt.id,
                    customer_id=cust["customer_id"],
                    amount=amount,
                    payment_method=_choice(PAYMENT_METHODS),
                    transaction_type="service",
                    transaction_time=appt_time + timedelta(minutes=30 + _randint(0, 60)),
                    remark=f"服务:{service}; 技师:{staff['staff_name']}",
                    created_at=now,
                ))
                cashier_id_counter += 1

                if random.random() < 0.6:
                    if attendance == "late":
                        rating = _randint(2, 5)
                    else:
                        rating = _randint(3, 5)
                    reviews.append(ReviewRecord(
                        id=review_id_counter,
                        store_id=store_id,
                        appointment_id=appt.id,
                        customer_id=cust["customer_id"],
                        rating=rating,
                        review_content=f"{'服务很好，值得推荐' if rating >= 4 else '一般，有些地方需要改进。'}",
                        review_tags="好评" if rating >= 4 else "中评",
                        reviewed_at=appt_time + timedelta(days=1, hours=_randint(1, 12)),
                    ))
                    review_id_counter += 1
            elif attendance == "not_arrived":
                if random.random() < 0.3:
                    rating = _randint(1, 2)
                    reviews.append(ReviewRecord(
                        id=review_id_counter,
                        store_id=store_id,
                        appointment_id=appt.id,
                        customer_id=cust["customer_id"],
                        rating=rating,
                        review_content="很失望，等了很久没人联系，投诉。",
                        review_tags="差评",
                        reviewed_at=appt_time + timedelta(hours=_randint(3, 12)),
                    ))
                    review_id_counter += 1

            if random.random() < 0.3 and reschedule_count >= 3 and day == days - 2:
                pass

    return appointments, cashier_records, reviews


def seed_for_store(store_id: str):
    appointments, cashiers, reviews = seed_appointments(store_id)
    inventories = seed_inventory(store_id)

    with db_session() as session:
        session.query(Appointment).filter(Appointment.store_id == store_id).delete()
        session.query(CashierRecord).filter(CashierRecord.store_id == store_id).delete()
        session.query(ReviewRecord).filter(ReviewRecord.store_id == store_id).delete()
        session.query(Inventory).filter(Inventory.store_id == store_id).delete()
        session.bulk_save_objects(appointments)
        session.bulk_save_objects(inventories)
        session.bulk_save_objects(cashiers)
        session.bulk_save_objects(reviews)
        session.commit()


def seed_refresh_log():
    with db_session() as session:
        session.query(DataRefreshLog).delete()
        session.add(DataRefreshLog(
            task_name="full_refresh",
            status="completed",
            started_at=datetime.utcnow() - timedelta(minutes=3),
            completed_at=datetime.utcnow() - timedelta(minutes=2, seconds=15),
            row_count=512,
            error_message=None,
        ))
        session.commit()


def seed_all():
    random.seed(42)
    init_db()
    print("[1/4] 初始化用户...")
    seed_users()
    print("[2/4] 生成 S001 旗舰店数据...")
    seed_for_store("S001")
    print("[3/4] 生成 S002 朝阳店数据...")
    seed_for_store("S002")
    print("[4/4] 插入刷新日志...")
    seed_refresh_log()
    print("全部种子数据写入完成。")


if __name__ == "__main__":
    seed_all()
