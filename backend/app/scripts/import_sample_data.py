import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.connection import SessionLocal, Base, engine
from app.database.init_db import init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.batch import ImportBatch
from app.models.crm import CRMCustomer, Property
from app.models.payment import PaymentTransaction
from app.models.contract import EContract
from app.models.inspection import InspectionRecord, InspectionItem
from app.models.repair import RepairOrder, RepairCaliberVersion
from app.models.comment import RentOverdueComment, Complaint


def generate_crm_data(db: Session, batch_id: int, start_date: datetime) -> tuple:
    print("  -> 生成 CRM 客户和房源数据...")
    districts = ["朝阳区", "海淀区", "东城区", "西城区", "丰台区", "通州区"]
    room_types = ["一居室", "两居室", "三居室", "四居室", "复式"]
    customer_statuses = ["active", "inactive", "pending"]
    first_names = ["张", "李", "王", "刘", "陈", "杨", "黄", "赵", "周", "吴"]
    last_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋"]

    customers = []
    for i in range(220):
        first_rent_date = start_date + timedelta(days=random.randint(0, 180))
        last_rent_date = first_rent_date + timedelta(days=random.randint(30, 365))
        customer = CRMCustomer(
            customer_no=f"CUST{start_date.year}{i+1:05d}",
            name=random.choice(first_names) + random.choice(last_names),
            phone=f"1{random.choice(['3','5','7','8','9'])}{''.join([str(random.randint(0,9)) for _ in range(9)])}",
            id_card=f"110{random.randint(100, 999)}{random.randint(1970, 2005)}{random.randint(1, 12):02d}{random.randint(1, 28):02d}{random.randint(1000, 9999)}",
            wechat_id=f"wx_{random.randint(100000, 999999)}",
            email=f"user{i+1}@example.com",
            first_rent_date=first_rent_date.date(),
            last_rent_date=last_rent_date.date(),
            total_rent_months=random.randint(1, 36),
            status=random.choices(customer_statuses, weights=[0.7, 0.2, 0.1])[0],
            batch_id=batch_id,
        )
        db.add(customer)
        customers.append(customer)
    db.flush()

    properties = []
    for i in range(200):
        district = random.choice(districts)
        monthly_rent = random.randint(2000, 15000)
        property = Property(
            property_no=f"PROP{start_date.year}{i+1:05d}",
            address=f"{district}某某路{random.randint(1, 999)}号{random.randint(1, 50)}号楼{random.randint(1, 30)}层{random.randint(101, 999)}室",
            district=district,
            area=random.randint(30, 150) + random.random(),
            room_type=random.choice(room_types),
            monthly_rent=monthly_rent,
            deposit_amount=monthly_rent * 2,
            floor=random.randint(1, 30),
            total_floor=random.randint(20, 50),
            orientation=random.choice(["南北通透", "朝南", "朝北", "朝东", "朝西"]),
            decoration=random.choice(["精装修", "简装修", "毛坯"]),
            status=random.choice(["rented", "vacant", "maintenance"]),
            batch_id=batch_id,
        )
        db.add(property)
        properties.append(property)
    db.flush()
    print(f"     ✅ {len(customers)} 客户, {len(properties)} 房源")
    return customers, properties


def generate_contract_data(db: Session, batch_id: int, customers, properties, start_date: datetime):
    print("  -> 生成电子合同数据...")
    contract_statuses = ["active", "expired", "terminated", "renewed"]
    contracts = []
    count = min(200, len(properties))
    for i in range(count):
        customer = random.choice(customers)
        prop = properties[i]
        start_dt = start_date + timedelta(days=random.randint(0, 150))
        end_dt = start_dt + timedelta(days=random.randint(90, 730))
        contract = EContract(
            contract_no=f"CONT{start_date.year}{i+1:06d}",
            customer_id=customer.id,
            property_id=prop.id,
            start_date=start_dt.date(),
            end_date=end_dt.date(),
            monthly_rent=prop.monthly_rent,
            deposit_amount=prop.deposit_amount or prop.monthly_rent * 2,
            payment_cycle=random.choice([1, 3, 6, 12]),
            contract_status=random.choices(contract_statuses, weights=[0.6, 0.2, 0.1, 0.1])[0],
            sign_date=(start_dt - timedelta(days=random.randint(0, 10))).date(),
            template_version=random.choice(["v1.0", "v2.0"]),
            batch_id=batch_id,
        )
        db.add(contract)
        contracts.append(contract)
    db.flush()
    print(f"     ✅ {len(contracts)} 份合同")
    return contracts


def generate_payment_data(db: Session, batch_id: int, customers, properties, contracts, start_date: datetime):
    print("  -> 生成支付流水数据...")
    payment_types = ["rent", "deposit", "utility", "penalty", "other"]
    payment_methods = ["alipay", "wechat", "bank_transfer", "cash"]
    statuses = ["paid", "pending", "overdue"]
    active_customers = [c for c in customers if c.status == "active"]

    transactions = []
    idx = 0
    for month in range(6):
        month_date = start_date + timedelta(days=month * 30)
        sample_size = min(len(active_customers), random.randint(150, 180))
        for customer in random.sample(active_customers, sample_size):
            prop = random.choice(properties)
            contract = random.choice(contracts) if contracts else None
            for pt in payment_types:
                if random.random() > 0.35:
                    if pt == "rent":
                        amount = prop.monthly_rent
                    elif pt == "deposit":
                        amount = prop.monthly_rent * 2
                    else:
                        amount = random.randint(100, 800)
                    overdue_days = 0
                    status = random.choices(statuses, weights=[0.75, 0.1, 0.15])[0]
                    if status == "overdue":
                        overdue_days = random.randint(1, 30)
                    due_date = month_date + timedelta(days=random.randint(1, 5))
                    pay_date = month_date + timedelta(days=random.randint(1, 25))
                    idx += 1
                    transaction = PaymentTransaction(
                        transaction_no=f"PAY{month_date.strftime('%Y%m')}{idx:06d}",
                        customer_id=customer.id,
                        property_id=prop.id,
                        contract_id=contract.id if contract else None,
                        amount=amount,
                        payment_type=pt,
                        payment_date=pay_date.date() if status == "paid" else None,
                        payment_method=random.choice(payment_methods) if status == "paid" else None,
                        status=status,
                        due_date=due_date.date(),
                        overdue_days=overdue_days,
                        late_fee=overdue_days * 5 if overdue_days > 0 else 0,
                        third_party_transaction_id=f"TXN{random.randint(100000, 999999)}" if status == "paid" else None,
                        batch_id=batch_id,
                    )
                    db.add(transaction)
                    transactions.append(transaction)
    db.flush()
    print(f"     ✅ {len(transactions)} 条支付流水")
    return transactions


def generate_inspection_data(db: Session, batch_id: int, contracts, properties, customers, all_users, start_date: datetime):
    print("  -> 生成验房记录数据...")
    inspection_statuses = ["pending", "assigned", "inspecting", "completed", "cancelled"]
    inspectors = [u for u in all_users if u.role == "admin"] or all_users

    items_tpl = [
        ("墙面", "墙面结构"), ("地面", "地面结构"), ("天花板", "墙面结构"),
        ("门窗", "五金配件"), ("门锁", "五金配件"), ("水管", "水电设施"),
        ("电路", "水电设施"), ("插座", "水电设施"), ("空调", "家电"),
        ("冰箱", "家电"), ("洗衣机", "家电"), ("热水器", "家电"),
        ("燃气灶", "家电"), ("抽油烟机", "家电"), ("马桶", "卫浴"),
        ("淋浴", "卫浴"), ("洗手台", "卫浴"), ("橱柜", "厨房"),
    ]

    inspections = []
    all_items = []
    for i in range(320):
        contract = random.choice(contracts) if contracts else None
        customer = random.choice(customers)
        prop = random.choice(properties)
        inspector = random.choice(inspectors)
        apply_date = start_date + timedelta(days=random.randint(0, 170))
        status = random.choices(inspection_statuses, weights=[0.1, 0.1, 0.1, 0.65, 0.05])[0]
        scheduled = apply_date + timedelta(days=random.randint(1, 3))
        inspection_date = scheduled + timedelta(days=random.randint(0, 2)) if status in ["inspecting", "completed"] else None
        has_damage = random.random() > 0.7

        w_start = random.randint(100, 500) if status == "completed" else None
        w_end = w_start + random.randint(10, 200) if w_start else None
        e_start = random.randint(1000, 5000) if status == "completed" else None
        e_end = e_start + random.randint(50, 800) if e_start else None
        g_start = random.randint(50, 200) if status == "completed" else None
        g_end = g_start + random.randint(5, 100) if g_start else None

        inspection = InspectionRecord(
            inspection_no=f"INSP{start_date.year}{i+1:06d}",
            contract_id=contract.id if contract else None,
            property_id=prop.id,
            customer_id=customer.id,
            inspector_id=inspector.id,
            apply_date=apply_date,
            scheduled_date=scheduled,
            inspection_date=inspection_date if status in ["inspecting", "completed"] else None,
            status=status,
            water_reading_start=w_start,
            water_reading_end=w_end,
            electricity_reading_start=e_start,
            electricity_reading_end=e_end,
            gas_reading_start=g_start,
            gas_reading_end=g_end,
            has_damage=has_damage,
            damage_description="墙面有轻微划痕" if has_damage else None,
            deduction_amount=random.randint(0, 500) if has_damage else 0,
            refund_amount=random.randint(0, 2000) if status == "completed" else 0,
            batch_id=batch_id,
        )
        db.add(inspection)
        inspections.append(inspection)

        if status == "completed":
            for name, cat in random.sample(items_tpl, random.randint(8, 15)):
                is_pass = random.random() > 0.12
                item = InspectionItem(
                    inspection=inspection,
                    item_name=name,
                    item_category=cat,
                    is_pass=is_pass,
                    normal_condition="完好无损",
                    actual_condition=None if is_pass else "有轻微划痕",
                    deduction_amount=0 if is_pass else random.randint(50, 300),
                    remark=random.choice(["正常", "完好", None, None]),
                )
                db.add(item)
                all_items.append(item)
    db.flush()
    print(f"     ✅ {len(inspections)} 条验房记录, {len(all_items)} 项验房明细")
    return inspections


def generate_repair_data(db: Session, batch_id: int, properties, customers, workers, start_date: datetime):
    print("  -> 生成维修工单数据...")
    repair_types = ["plumbing", "electrical", "appliance", "structure", "cleaning", "other"]
    repair_statuses = ["pending", "assigned", "processing", "completed", "cancelled"]
    titles = {
        "plumbing": ["水管漏水", "马桶堵塞", "水龙头坏了"],
        "electrical": ["灯不亮", "插座坏了", "跳闸了"],
        "appliance": ["空调不制冷", "冰箱不工作", "洗衣机漏水"],
        "structure": ["墙面开裂", "门锁坏了", "窗户关不上"],
        "cleaning": ["需要深度保洁", "下水道反味", "蟑螂消杀"],
        "other": ["其他维修需求"],
    }

    # 口径版本已在init_db创建，这里直接用
    calibers = db.query(RepairCaliberVersion).all()
    active_caliber = next((c for c in calibers if c.is_active), calibers[0]) if calibers else None

    repairs = []
    for i in range(160):
        prop = random.choice(properties)
        reporter = random.choice(customers)
        rt = random.choice(repair_types)
        status = random.choices(repair_statuses, weights=[0.05, 0.1, 0.1, 0.7, 0.05])[0]
        worker = random.choice(workers) if status != "pending" else None
        report_time = start_date + timedelta(days=random.randint(0, 180), hours=random.randint(8, 20))
        assign_time = report_time + timedelta(hours=random.randint(1, 24)) if worker else None
        start_time = assign_time + timedelta(hours=random.randint(1, 48)) if assign_time and status in ["processing", "completed"] else None
        complete_time = start_time + timedelta(hours=random.randint(1, 48)) if start_time and status == "completed" else None
        duration = None
        if complete_time and start_time and active_caliber:
            hours = (complete_time - start_time).total_seconds() / 3600
            duration = round(max(1, hours), 2)

        repair = RepairOrder(
            repair_no=f"REP{start_date.year}{i+1:06d}",
            property_id=prop.id,
            reporter_id=reporter.id,
            worker_id=worker.id if worker else None,
            repair_type=rt,
            title=f"{rt}-{prop.district}",
            description=random.choice(titles[rt]),
            report_time=report_time,
            assign_time=assign_time,
            start_time=start_time,
            complete_time=complete_time,
            status=status,
            actual_cost=random.randint(50, 1000) if status == "completed" else None,
            duration_hours=duration,
            caliber_version=active_caliber.version if active_caliber else "V2.0",
            batch_id=batch_id,
        )
        db.add(repair)
        repairs.append(repair)
    db.flush()
    print(f"     ✅ {len(repairs)} 个维修工单")
    return repairs


def generate_complaints_and_comments(db: Session, complaint_batch_id: int, comment_batch_id: int, customers, properties, payments, all_users, start_date: datetime):
    print("  -> 生成投诉和逾期注释数据...")
    complaint_statuses = ["open", "processing", "resolved", "closed"]
    complaint_types = ["服务态度", "维修不及时", "租金问题", "设施问题", "噪音问题", "卫生问题"]
    tag_options = [
        ["态度差", "响应慢"], ["维修", "未解决"], ["押金", "乱收费"],
        ["空调", "冰箱", "洗衣机"], ["邻里", "施工"], ["保洁", "异味"],
    ]

    complaints = []
    for i in range(60):
        customer = random.choice(customers)
        prop = random.choice(properties)
        ct = random.choice(complaint_types)
        tags = random.choice(tag_options)
        handler = random.choice([u for u in all_users if u.role == "admin"] or all_users)
        report_date = start_date + timedelta(days=random.randint(0, 180))
        status = random.choices(complaint_statuses, weights=[0.1, 0.2, 0.5, 0.2])[0]
        handled = report_date + timedelta(days=random.randint(1, 5)) if status in ["resolved", "closed"] else None

        complaint = Complaint(
            complaint_no=f"COMP{start_date.year}{i+1:05d}",
            customer_id=customer.id,
            property_id=prop.id,
            complaint_type=ct,
            tags=tags,
            title=f"{ct}-{customer.name}",
            description=f"客户投诉{ct}相关问题",
            report_date=report_date.date(),
            status=status,
            handled_by=handler.id if status != "open" else None,
            handled_at=handled if handled else None,
            resolution="已联系相关人员处理" if status in ["resolved", "closed"] else None,
            satisfaction_score=random.randint(3, 5) if status == "closed" else None,
            batch_id=complaint_batch_id,
        )
        db.add(complaint)
        complaints.append(complaint)

    overdue_payments = [p for p in payments if p.status == "overdue"]
    comment_users = [u for u in all_users if u.role == "admin"] or all_users
    comments = []
    for p in random.sample(overdue_payments, min(40, len(overdue_payments))):
        comment = RentOverdueComment(
            payment_id=p.id,
            customer_id=p.customer_id,
            comment=random.choice([
                "客户承诺本周五前支付", "已电话沟通，正在筹款",
                "客户出差，下周回来处理", "已发送律师函", "客户经济困难，申请分期",
            ]),
            commented_by=random.choice(comment_users).id,
        )
        db.add(comment)
        comments.append(comment)

    db.flush()
    print(f"     ✅ {len(complaints)} 条投诉, {len(comments)} 条逾期注释")
    return complaints, comments


def import_sample_data():
    print("=" * 60)
    print("  开始导入示例数据")
    print("=" * 60)

    db = SessionLocal()
    try:
        print("  -> 清空现有数据...")
        tables = [
            "inspection_items", "repair_orders", "complaints", "rent_overdue_comments",
            "inspection_records", "payment_transactions", "e_contracts",
            "crm_customers", "properties", "import_batches", "repair_caliber_versions", "users"
        ]
        for t in tables:
            db.execute(text(f"TRUNCATE TABLE {t} RESTART IDENTITY CASCADE"))
        db.commit()
        print("     ✅ 已清空所有表")

        init_db(db)

        admin = db.query(User).filter(User.email == "admin@example.com").first()
        workers = db.query(User).filter(User.role == "worker").all()
        all_users = [admin] + workers

        # 创建维修口径版本
        if db.query(RepairCaliberVersion).count() == 0:
            calibers = [
                RepairCaliberVersion(version="V1.0", effective_date=datetime(2024,1,1).date(),
                    end_date=datetime(2024,5,31).date(),
                    description="初始版本：从报修到工单关闭的自然日",
                    calculation_rule="duration = (complete_time - report_time).total_seconds() / 3600",
                    exclude_holidays=False, exclude_weekends=False,
                    start_event="report_time", end_event="complete_time", is_active=False),
                RepairCaliberVersion(version="V1.1", effective_date=datetime(2024,6,1).date(),
                    end_date=datetime(2024,12,31).date(),
                    description="优化版本：排除周末和法定节假日",
                    calculation_rule="计算有效工作日时长，排除周末和节假日",
                    exclude_holidays=True, exclude_weekends=True,
                    start_event="report_time", end_event="complete_time", is_active=False),
                RepairCaliberVersion(version="V2.0", effective_date=datetime(2025,1,1).date(),
                    description="当前版本：从派单开始计算，排除待客户确认时间",
                    calculation_rule="duration = max(1, round((complete_time - assign_time).total_seconds() / 3600))",
                    exclude_holidays=True, exclude_weekends=True,
                    start_event="assign_time", end_event="complete_time", is_active=True),
            ]
            for c in calibers:
                db.add(c)
            db.flush()
            print("✅ 已创建 3 个维修口径版本")

        start_date = datetime.now() - timedelta(days=180)

        def make_batch(src):
            b = ImportBatch(
                batch_no=f"BATCH-{src.upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(1000,9999)}",
                source_type=src, status="completed",
                record_count=0, file_name=f"sample_{src}.xlsx",
                imported_by=admin.id, remark=f"Sample {src} data",
            )
            db.add(b)
            db.flush()
            return b

        crm_batch = make_batch("crm")
        customers, properties = generate_crm_data(db, crm_batch.id, start_date)
        crm_batch.record_count = len(customers) + len(properties)

        contract_batch = make_batch("contract")
        contracts = generate_contract_data(db, contract_batch.id, customers, properties, start_date)
        contract_batch.record_count = len(contracts)

        payment_batch = make_batch("payment")
        payments = generate_payment_data(db, payment_batch.id, customers, properties, contracts, start_date)
        payment_batch.record_count = len(payments)

        inspection_batch = make_batch("inspection")
        inspections = generate_inspection_data(db, inspection_batch.id, contracts, properties, customers, all_users, start_date)
        inspection_batch.record_count = len(inspections)

        repair_batch = make_batch("repair")
        repairs = generate_repair_data(db, repair_batch.id, properties, customers, workers, start_date)
        repair_batch.record_count = len(repairs)

        complaint_batch = make_batch("complaint")
        comment_batch = make_batch("comment")
        complaints, comments = generate_complaints_and_comments(
            db, complaint_batch.id, comment_batch.id, customers, properties, payments, all_users, start_date)
        complaint_batch.record_count = len(complaints)
        comment_batch.record_count = len(comments)

        db.commit()
        print()
        print("=" * 60)
        print("  🎉 示例数据导入完成！")
        print("=" * 60)
        print(f"  CRM客户:     {len(customers)}")
        print(f"  房源:        {len(properties)}")
        print(f"  电子合同:    {len(contracts)}")
        print(f"  支付流水:    {len(payments)}")
        print(f"  验房记录:    {len(inspections)}")
        print(f"  维修工单:    {len(repairs)}")
        print(f"  投诉记录:    {len(complaints)}")
        print(f"  逾期注释:    {len(comments)}")
        print(f"  导入批次:    7 个批次")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_sample_data()
