import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session

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
from app.models import *


def generate_crm_data(db: Session, batch_id: int, start_date: datetime, months: int = 6) -> tuple:
    print("Generating CRM data...")
    
    districts = ["朝阳区", "海淀区", "东城区", "西城区", "丰台区", "通州区"]
    room_types = ["一居室", "两居室", "三居室", "四居室", "复式"]
    statuses = ["active", "inactive", "pending"]
    first_names = ["张", "李", "王", "刘", "陈", "杨", "黄", "赵", "周", "吴"]
    last_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋"]
    
    customers = []
    for i in range(220):
        first_rent_date = start_date + timedelta(days=random.randint(0, months * 30))
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
            status=random.choices(statuses, weights=[0.7, 0.2, 0.1])[0],
            tags=random.choice([None, ["VIP", "长期"], ["新客户"], ["优质客户"]]),
            batch_id=batch_id,
        )
        customers.append(customer)
    
    db.bulk_save_objects(customers)
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
            facilities=random.choice([None, ["空调", "冰箱", "洗衣机"], ["空调", "热水器"], ["全套家具"]]),
            status=random.choice(["rented", "vacant", "maintenance"]),
            batch_id=batch_id,
        )
        properties.append(property)
    
    db.bulk_save_objects(properties)
    db.commit()
    
    print(f"Generated {len(customers)} customers and {len(properties)} properties")
    return customers, properties


def generate_payment_data(
    db: Session,
    batch_id: int,
    customers: List[CRMCustomer],
    properties: List[Property],
    start_date: datetime,
    months: int = 6
) -> List[PaymentTransaction]:
    print("Generating payment data...")
    
    payment_types = ["rent", "deposit", "utility", "penalty", "other"]
    payment_methods = ["alipay", "wechat", "bank_transfer", "cash"]
    statuses = ["paid", "pending", "overdue"]
    
    active_customers = [c for c in customers if c.status == "active"]
    
    transactions = []
    for month in range(months):
        month_date = start_date + timedelta(days=month * 30)
        
        for customer in random.sample(active_customers, min(len(active_customers), random.randint(150, 200))):
            property = random.choice(properties)
            
            for pt in payment_types:
                if random.random() > 0.3:
                    if pt == "rent":
                        amount = property.monthly_rent
                    elif pt == "deposit":
                        amount = property.monthly_rent * 2
                    else:
                        amount = random.randint(100, 800)
                    
                    overdue_days = random.randint(0, 30) if random.random() > 0.8 else 0
                    status = "overdue" if overdue_days > 0 else random.choices(statuses, weights=[0.85, 0.1, 0.05])[0]
                    if status == "overdue":
                        overdue_days = random.randint(1, 30)
                    
                    due_date = month_date + timedelta(days=random.randint(1, 5))
                    payment_date_val = month_date + timedelta(days=random.randint(1, 25))
                    transaction = PaymentTransaction(
                        transaction_no=f"PAY{month_date.strftime('%Y%m')}{len(transactions)+1:06d}",
                        customer_id=customer.id,
                        property_id=property.id,
                        contract_id=random.choice([None, random.randint(1, 200)]),
                        amount=amount,
                        payment_type=pt,
                        payment_date=payment_date_val.date() if status in ["paid", "overdue"] else None,
                        payment_method=random.choice(payment_methods) if status == "paid" else None,
                        status=status,
                        due_date=due_date.date(),
                        overdue_days=overdue_days,
                        late_fee=overdue_days * 5 if overdue_days > 0 else 0,
                        third_party_transaction_id=f"TXN{random.randint(100000, 999999)}" if status == "paid" else None,
                        batch_id=batch_id,
                    )
                    transactions.append(transaction)
    
    db.bulk_save_objects(transactions)
    db.commit()
    
    print(f"Generated {len(transactions)} payment transactions")
    return transactions


def generate_contract_data(
    db: Session,
    batch_id: int,
    customers: List[CRMCustomer],
    properties: List[Property],
    start_date: datetime,
    months: int = 6
) -> List[EContract]:
    print("Generating contract data...")
    
    statuses = ["active", "expired", "terminated", "pending"]
    
    contracts = []
    used_properties = set()
    
    for i in range(210):
        customer = random.choice(customers)
        property = random.choice([p for p in properties if p.id not in used_properties])
        if not property:
            continue
        used_properties.add(property.id)
        
        start_dt = start_date + timedelta(days=random.randint(0, months * 25))
        end_dt = start_dt + timedelta(days=random.randint(90, 730))
        
        contract = EContract(
            contract_no=f"CONT{start_date.year}{i+1:06d}",
            customer_id=customer.id,
            property_id=property.id,
            start_date=start_dt.date(),
            end_date=end_dt.date(),
            monthly_rent=property.monthly_rent,
            deposit_amount=property.deposit_amount or property.monthly_rent * 2,
            payment_cycle=random.choice([1, 3, 6, 12]),
            contract_status=random.choices(statuses, weights=[0.6, 0.2, 0.1, 0.1])[0],
            sign_date=(start_dt - timedelta(days=random.randint(0, 10))).date(),
            template_version=random.choice(["v1.0", "v2.0"]),
            terms=random.choice([None, {"pet_allowed": True}, {"sublet_allowed": False}]),
            batch_id=batch_id,
        )
        contracts.append(contract)
    
    db.bulk_save_objects(contracts)
    db.commit()
    
    print(f"Generated {len(contracts)} contracts")
    return contracts


def generate_inspection_data(
    db: Session,
    batch_id: int,
    contracts: List[EContract],
    properties: List[Property],
    customers: List[CRMCustomer],
    inspectors: List[User],
    start_date: datetime,
    months: int = 6
) -> List[InspectionRecord]:
    print("Generating inspection data...")
    
    statuses = ["pending", "assigned", "inspecting", "completed", "cancelled"]
    item_categories = ["水电", "家具", "电器", "门窗", "墙面", "地面"]
    item_names = {
        "水电": ["水龙头", "马桶", "热水器", "电路", "插座"],
        "家具": ["床", "衣柜", "餐桌", "椅子", "沙发"],
        "电器": ["空调", "冰箱", "洗衣机", "电视", "油烟机"],
        "门窗": ["门锁", "窗户", "窗帘杆", "门把手", "合页"],
        "墙面": ["墙面漆", "壁纸", "瓷砖", "踢脚线", "开关"],
        "地面": ["地板", "地砖", "地毯", "踢脚线", "地漏"],
    }
    
    inspections = []
    for i in range(320):
        contract = random.choice(contracts)
        inspector = random.choice(inspectors)
        
        apply_date = start_date + timedelta(days=random.randint(0, months * 30))
        inspection_date = apply_date + timedelta(days=random.randint(1, 7))
        status = random.choices(statuses, weights=[0.1, 0.1, 0.1, 0.65, 0.05])[0]
        
        has_damage = random.random() > 0.7
        
        water_start = random.randint(100, 500) if status == "completed" else None
        water_end = water_start + random.randint(10, 200) if water_start else None
        elec_start = random.randint(1000, 5000) if status == "completed" else None
        elec_end = elec_start + random.randint(50, 800) if elec_start else None
        gas_start = random.randint(50, 200) if status == "completed" else None
        gas_end = gas_start + random.randint(5, 100) if gas_start else None
        
        inspection = InspectionRecord(
            inspection_no=f"INSP{start_date.year}{i+1:06d}",
            contract_id=contract.id,
            property_id=contract.property_id,
            customer_id=contract.customer_id,
            inspector_id=inspector.id,
            apply_date=apply_date,
            scheduled_date=(apply_date + timedelta(days=random.randint(1, 3))),
            inspection_date=inspection_date if status in ["processing", "completed"] else None,
            status=status,
            water_reading_start=water_start,
            water_reading_end=water_end,
            electricity_reading_start=elec_start,
            electricity_reading_end=elec_end,
            gas_reading_start=gas_start,
            gas_reading_end=gas_end,
            has_damage=has_damage,
            damage_description="墙面有轻微划痕，需要修复" if has_damage else None,
            deduction_amount=random.randint(0, 500) if has_damage else 0,
            refund_amount=random.randint(0, 2000) if status == "completed" else 0,
            batch_id=batch_id,
        )
        inspections.append(inspection)
    
    db.bulk_save_objects(inspections)
    db.flush()
    
    items = []
    for inspection in inspections:
        if inspection.status == "completed":
            num_items = random.randint(5, 12)
            selected_categories = random.sample(item_categories, random.randint(3, len(item_categories)))
            
            for category in selected_categories:
                category_items = random.sample(item_names[category], random.randint(1, 2))
                for item_name in category_items:
                    is_pass_val = random.random() > 0.1
                    item = InspectionItem(
                        inspection_id=inspection.id,
                        item_name=item_name,
                        item_category=category,
                        is_pass=is_pass_val,
                        normal_condition=random.choice(["完好无损", "正常使用", "无损坏"]),
                        actual_condition=None if is_pass_val else random.choice(["有轻微划痕", "略有磨损", "需要更换"]),
                        deduction_amount=0 if is_pass_val else random.randint(50, 300),
                        remark=random.choice(["正常", "完好", "略有磨损", "无异常"]) if random.random() > 0.5 else None,
                    )
                    items.append(item)
    
    db.bulk_save_objects(items)
    db.commit()
    
    print(f"Generated {len(inspections)} inspection records and {len(items)} items")
    return inspections


def generate_repair_data(
    db: Session,
    batch_id: int,
    properties: List[Property],
    customers: List[CRMCustomer],
    workers: List[User],
    calibers: List[RepairCaliberVersion],
    start_date: datetime,
    months: int = 6
) -> List[RepairOrder]:
    print("Generating repair data...")
    
    repair_types = ["plumbing", "electrical", "appliance", "structure", "cleaning", "other"]
    statuses = ["pending", "assigned", "processing", "completed", "cancelled"]
    descriptions = [
        "水龙头漏水需要更换",
        "空调不制冷需要维修",
        "门锁损坏需要更换",
        "墙面开裂需要修补",
        "地板起翘需要修复",
        "热水器加热慢",
        "马桶堵塞需要疏通",
        "电路跳闸需要检查",
        "窗户玻璃破碎",
        "衣柜门铰链松动",
    ]
    
    active_caliber = next((c for c in calibers if c.is_active), calibers[0])
    
    repairs = []
    for i in range(160):
        property = random.choice(properties)
        reporter = random.choice(customers)
        worker = random.choice(workers)
        
        report_time = start_date + timedelta(days=random.randint(0, months * 30), hours=random.randint(8, 20))
        status = random.choices(statuses, weights=[0.05, 0.1, 0.15, 0.65, 0.05])[0]
        
        assign_time = None
        start_time = None
        complete_time = None
        duration_hours = None
        
        if status in ["assigned", "processing", "completed"]:
            assign_time = report_time + timedelta(hours=random.randint(1, 24))
        if status in ["processing", "completed"]:
            start_time = assign_time + timedelta(hours=random.randint(1, 48))
        if status == "completed":
            complete_time = start_time + timedelta(hours=random.randint(1, 72))
            duration_hours = round((complete_time - start_time).total_seconds() / 3600, 2)
        
        repair_type_val = random.choice(repair_types)
        desc = random.choice(descriptions)
        repair = RepairOrder(
            repair_no=f"REP{start_date.year}{i+1:06d}",
            property_id=property.id,
            reporter_id=reporter.id,
            worker_id=worker.id if status != "pending" else None,
            repair_type=repair_type_val,
            title=f"{repair_type_val}-{property.address[:10]}",
            description=desc,
            report_time=report_time,
            assign_time=assign_time,
            start_time=start_time,
            complete_time=complete_time,
            status=status,
            actual_cost=random.randint(50, 1000) if status == "completed" else None,
            duration_hours=duration_hours,
            caliber_version=active_caliber.version,
            batch_id=batch_id,
        )
        repairs.append(repair)
    
    db.bulk_save_objects(repairs)
    db.commit()
    
    print(f"Generated {len(repairs)} repair orders")
    return repairs


def generate_complaint_data(
    db: Session,
    batch_id: int,
    customers: List[CRMCustomer],
    properties: List[Property],
    start_date: datetime,
    months: int = 6
) -> List[Complaint]:
    print("Generating complaint data...")
    
    complaint_types = ["服务投诉", "设施投诉", "噪音投诉", "卫生投诉", "安全投诉", "其他"]
    tags_list = [
        ["服务态度", "响应慢"],
        ["设施损坏", "维修不及时"],
        ["噪音", "邻居扰民"],
        ["卫生差", "清洁不及时"],
        ["安全隐患", "门锁问题"],
        ["收费问题", "价格高"],
        ["沟通不畅", "信息不透明"],
    ]
    statuses = ["pending", "processing", "resolved", "closed"]
    descriptions = [
        "维修人员态度不好",
        "空调坏了一周还没修好",
        "邻居晚上太吵影响休息",
        "公共区域卫生太差",
        "门锁坏了感觉不安全",
        "物业费收取不合理",
        "报修后没人联系我",
    ]
    
    complaints = []
    for i in range(60):
        customer = random.choice(customers)
        property = random.choice(properties)
        tags = random.choice(tags_list)
        
        report_date = start_date + timedelta(days=random.randint(0, months * 30))
        
        complaint_type_val = random.choice(complaint_types)
        desc = random.choice(descriptions)
        complaint = Complaint(
            complaint_no=f"COMP{start_date.year}{i+1:05d}",
            customer_id=customer.id,
            property_id=property.id,
            complaint_type=complaint_type_val,
            tags=tags,
            title=f"{complaint_type_val}-{customer.name}",
            description=desc,
            report_date=report_date.date(),
            status=random.choices(statuses, weights=[0.1, 0.2, 0.5, 0.2])[0],
            handled_by=random.choice([None, random.randint(1, 6)]),
            handled_at=report_date + timedelta(days=random.randint(1, 7)) if status in ["resolved", "closed"] else None,
            resolution="已联系维修人员上门处理" if status in ["resolved", "closed"] else None,
            satisfaction_score=random.randint(3, 5) if status == "closed" else None,
            batch_id=batch_id,
        )
        complaints.append(complaint)
    
    db.bulk_save_objects(complaints)
    db.commit()
    
    print(f"Generated {len(complaints)} complaints")
    return complaints


def generate_overdue_comments(
    db: Session,
    payments: List[PaymentTransaction],
    users: List[User]
) -> List[RentOverdueComment]:
    print("Generating overdue comments...")
    
    overdue_payments = [p for p in payments if p.overdue_days > 0]
    admin_users = [u for u in users if u.role == "admin"]
    
    comments = []
    for payment in random.sample(overdue_payments, min(len(overdue_payments), 40)):
        comment = RentOverdueComment(
            payment_id=payment.id,
            customer_id=payment.customer_id,
            comment=random.choice([
                "已电话联系客户，承诺本周内支付",
                "客户表示资金紧张，申请延期一周",
                "多次联系未果，已发送催缴函",
                "客户已支付部分欠款",
                "正在协商分期支付方案",
            ]),
            commented_by=random.choice(admin_users).id,
        )
        comments.append(comment)
    
    db.bulk_save_objects(comments)
    db.commit()
    
    print(f"Generated {len(comments)} overdue comments")
    return comments


def generate_caliber_versions(db: Session) -> List[RepairCaliberVersion]:
    print("Generating repair caliber versions...")
    
    calibers = [
        RepairCaliberVersion(
            version="V1.0",
            effective_date=datetime(2024, 1, 1).date(),
            end_date=datetime(2024, 5, 31).date(),
            description="初始版本：从报修到工单关闭的自然日",
            calculation_rule="duration = (complete_time - report_time).total_seconds() / 3600",
            exclude_holidays=False,
            exclude_weekends=False,
            start_event="report_time",
            end_event="complete_time",
            is_active=False,
        ),
        RepairCaliberVersion(
            version="V1.1",
            effective_date=datetime(2024, 6, 1).date(),
            end_date=datetime(2024, 12, 31).date(),
            description="优化版本：排除周末和法定节假日",
            calculation_rule="duration = 计算有效工作日时长，排除周末和节假日",
            exclude_holidays=True,
            exclude_weekends=True,
            start_event="report_time",
            end_event="complete_time",
            is_active=False,
        ),
        RepairCaliberVersion(
            version="V2.0",
            effective_date=datetime(2025, 1, 1).date(),
            description="当前版本：从派单开始计算，排除待客户确认时间",
            calculation_rule="duration = (complete_time - assign_time).total_seconds() / 3600, 不足1小时按1小时计算",
            exclude_holidays=True,
            exclude_weekends=True,
            start_event="assign_time",
            end_event="complete_time",
            is_active=True,
        ),
    ]
    
    db.bulk_save_objects(calibers)
    db.commit()
    
    print(f"Generated {len(calibers)} caliber versions")
    return calibers


def generate_workers(db: Session) -> List[User]:
    print("Generating workers...")
    
    worker_names = [
        ("worker1@example.com", "张维修"),
        ("worker2@example.com", "李维修"),
        ("worker3@example.com", "王维修"),
        ("worker4@example.com", "赵维修"),
        ("worker5@example.com", "刘维修"),
    ]
    
    workers = []
    for email, name in worker_names:
        worker = User(
            email=email,
            hashed_password=get_password_hash("worker123"),
            full_name=name,
            role="worker",
            is_active=True,
        )
        workers.append(worker)
    
    db.bulk_save_objects(workers)
    db.commit()
    
    print(f"Generated {len(workers)} workers")
    return workers


def generate_batch(db: Session, source_type: str, imported_by: int) -> ImportBatch:
    batch = ImportBatch(
        batch_no=f"BATCH-{source_type.upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        source_type=source_type,
        status="completed",
        record_count=0,
        file_name=f"sample_{source_type}_data.xlsx",
        imported_by=imported_by,
        remark=f"Sample {source_type} data for testing",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def import_sample_data():
    print("=" * 60)
    print("Starting sample data import...")
    print("=" * 60)
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        init_db(db)
        
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        
        workers = generate_workers(db)
        all_users = [admin] + workers
        calibers = generate_caliber_versions(db)
        
        start_date = datetime.now() - timedelta(days=180)
        
        crm_batch = generate_batch(db, "crm", admin.id)
        customers, properties = generate_crm_data(db, crm_batch.id, start_date)
        crm_batch.record_count = len(customers) + len(properties)
        db.commit()
        
        contract_batch = generate_batch(db, "contract", admin.id)
        contracts = generate_contract_data(db, contract_batch.id, customers, properties, start_date)
        contract_batch.record_count = len(contracts)
        db.commit()
        
        payment_batch = generate_batch(db, "payment", admin.id)
        payments = generate_payment_data(db, payment_batch.id, customers, properties, start_date)
        payment_batch.record_count = len(payments)
        db.commit()
        
        inspection_batch = generate_batch(db, "inspection", admin.id)
        inspections = generate_inspection_data(db, inspection_batch.id, contracts, properties, customers, all_users, start_date)
        inspection_batch.record_count = len(inspections)
        db.commit()
        
        repair_batch = generate_batch(db, "repair", admin.id)
        repairs = generate_repair_data(db, repair_batch.id, properties, customers, workers, calibers, start_date)
        repair_batch.record_count = len(repairs)
        db.commit()
        
        complaint_batch = generate_batch(db, "crm", admin.id)
        complaints = generate_complaint_data(db, complaint_batch.id, customers, properties, start_date)
        complaint_batch.record_count = len(complaints)
        db.commit()
        
        generate_overdue_comments(db, payments, all_users)
        
        print("=" * 60)
        print("Sample data import completed successfully!")
        print("=" * 60)
        print(f"Customers: {len(customers)}")
        print(f"Properties: {len(properties)}")
        print(f"Contracts: {len(contracts)}")
        print(f"Payments: {len(payments)}")
        print(f"Inspections: {len(inspections)}")
        print(f"Repairs: {len(repairs)}")
        print(f"Complaints: {len(complaints)}")
        print(f"Workers: {len(workers)}")
        print("=" * 60)
        print("Default accounts:")
        print("  Admin: admin@example.com / admin123")
        print("  Workers: worker1-5@example.com / worker123")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error importing sample data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_sample_data()
