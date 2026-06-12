import sys
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from db.connection import engine, Session
from db.models import Base
from db.models import (
    RawReceipt, RawInventory, RawPos, Supplier, BatchInfo, ProductBom,
)


MATERIALS = [
    ("MAT001", "阿拉比卡咖啡豆", "kg", 50.0, 10.0),
    ("MAT002", "罗布斯塔咖啡豆", "kg", 40.0, 8.0),
    ("MAT003", "全脂牛奶", "L", 200.0, 50.0),
    ("MAT004", "脱脂牛奶", "L", 100.0, 25.0),
    ("MAT005", "燕麦奶", "L", 80.0, 20.0),
    ("MAT006", "白砂糖", "kg", 60.0, 15.0),
    ("MAT007", "黄糖", "kg", 30.0, 8.0),
    ("MAT008", "香草糖浆", "L", 40.0, 10.0),
    ("MAT009", "焦糖糖浆", "L", 35.0, 8.0),
    ("MAT010", "榛果糖浆", "L", 30.0, 8.0),
    ("MAT011", "可可粉", "kg", 25.0, 6.0),
    ("MAT012", "抹茶粉", "kg", 15.0, 4.0),
    ("MAT013", "奶油", "L", 50.0, 12.0),
    ("MAT014", "巧克力酱", "kg", 20.0, 5.0),
    ("MAT015", "纸杯中杯", "个", 2000.0, 500.0),
]

STORES = ["SH001", "SH002", "SH003", "BJ001", "BJ002", "GZ001", "SZ001"]

SUPPLIERS = [
    ("SUP001", "云南咖啡种植合作社", "张经理", "13800138001", 5, 4.5, "咖啡豆"),
    ("SUP002", "南美进口贸易公司", "李总", "13800138002", 10, 4.2, "咖啡豆"),
    ("SUP003", "蒙牛乳业直供", "王主管", "13800138003", 2, 4.8, "乳制品"),
    ("SUP004", "伊利集团", "赵经理", "13800138004", 2, 4.7, "乳制品"),
    ("SUP005", "OATLY燕麦奶", "陈总", "13800138005", 7, 4.3, "植物奶"),
    ("SUP006", "太古糖业", "刘主管", "13800138006", 3, 4.6, "糖类"),
    ("SUP007", "达芬奇糖浆", "周经理", "13800138007", 5, 4.4, "糖浆"),
    ("SUP008", "莫林糖浆中国", "吴总", "13800138008", 5, 4.1, "糖浆"),
    ("SUP009", "瑞士莲可可", "郑主管", "13800138009", 7, 4.5, "粉料"),
    ("SUP010", "日本宇治抹茶", "孙经理", "13800138010", 14, 4.0, "粉料"),
    ("SUP011", "雀巢专业餐饮", "钱总", "13800138011", 3, 4.6, "奶油/酱料"),
    ("SUP012", "新天力包装", "冯主管", "13800138012", 2, 4.3, "包材"),
]

PRODUCTS = [
    ("PRD001", "美式咖啡", [("MAT001", 0.02, "kg"), ("MAT015", 1, "个")]),
    ("PRD002", "拿铁", [("MAT001", 0.018, "kg"), ("MAT003", 0.2, "L"), ("MAT015", 1, "个")]),
    ("PRD003", "卡布奇诺", [("MAT001", 0.02, "kg"), ("MAT003", 0.15, "L"), ("MAT015", 1, "个")]),
    ("PRD004", "焦糖玛奇朵", [("MAT001", 0.018, "kg"), ("MAT003", 0.2, "L"), ("MAT009", 0.02, "L"), ("MAT015", 1, "个")]),
    ("PRD005", "摩卡", [("MAT001", 0.018, "kg"), ("MAT003", 0.18, "L"), ("MAT011", 0.02, "kg"), ("MAT015", 1, "个")]),
    ("PRD006", "燕麦拿铁", [("MAT001", 0.018, "kg"), ("MAT005", 0.25, "L"), ("MAT015", 1, "个")]),
    ("PRD007", "抹茶拿铁", [("MAT003", 0.2, "L"), ("MAT012", 0.015, "kg"), ("MAT015", 1, "个")]),
    ("PRD008", "热巧克力", [("MAT003", 0.2, "L"), ("MAT011", 0.025, "kg"), ("MAT014", 0.015, "kg"), ("MAT015", 1, "个")]),
]


PRODUCT_BOM = PRODUCTS


def init_db():
    Base.metadata.create_all(engine)
    print("数据库表已创建")


def seed_suppliers(session):
    existing = session.query(Supplier).count()
    if existing > 0:
        print(f"供应商数据已存在 ({existing} 条)，跳过")
        return
    for code, name, contact, phone, lead, rating, cat in SUPPLIERS:
        session.add(Supplier(
            supplier_code=code,
            supplier_name=name,
            contact_person=contact,
            contact_phone=phone,
            lead_time_days=lead,
            rating=Decimal(str(rating)),
            material_category=cat,
        ))
    session.flush()
    print(f"供应商数据已插入: {len(SUPPLIERS)} 条")


def seed_bom(session):
    existing = session.query(ProductBom).count()
    if existing > 0:
        print(f"产品BOM数据已存在 ({existing} 条)，跳过")
        return
    mat_name_map = {code: name for code, name, _, _, _ in MATERIALS}
    count = 0
    for product_code, product_name, bom_items in PRODUCT_BOM:
        for mat_code, usage_qty, unit in bom_items:
            mat_name = mat_name_map.get(mat_code, mat_code)
            session.add(ProductBom(
                product_code=product_code,
                product_name=product_name,
                material_code=mat_code,
                material_name=mat_name,
                usage_qty=Decimal(str(usage_qty)),
                unit=unit,
            ))
            count += 1
    session.flush()
    print(f"产品BOM数据已插入: {count} 条")


def seed_batches(session):
    existing = session.query(BatchInfo).count()
    if existing > 0:
        print(f"批次数据已存在 ({existing} 条)，跳过")
        return
    today = date.today()
    batch_count = 0
    for mat_code, mat_name, unit, _, _ in MATERIALS:
        if "咖啡" in mat_name:
            sup_codes = ["SUP001", "SUP002"]
            shelf_life_days = 365
        elif "牛奶" in mat_name or mat_name == "奶油":
            sup_codes = ["SUP003", "SUP004"]
            shelf_life_days = 14
        elif "燕麦" in mat_name:
            sup_codes = ["SUP005"]
            shelf_life_days = 90
        elif "糖" in mat_name:
            sup_codes = ["SUP006"]
            shelf_life_days = 540
        elif "糖浆" in mat_name:
            sup_codes = ["SUP007", "SUP008"]
            shelf_life_days = 365
        elif "抹茶" in mat_name or "可可" in mat_name:
            sup_codes = ["SUP009", "SUP010"]
            shelf_life_days = 180
        elif "酱" in mat_name:
            sup_codes = ["SUP011"]
            shelf_life_days = 180
        else:
            sup_codes = ["SUP012"]
            shelf_life_days = 730

        for store in STORES[:4]:
            for i, sup_code in enumerate(sup_codes):
                received_offset = random.randint(0, 30)
                received = today - timedelta(days=received_offset)
                expiry = received + timedelta(days=shelf_life_days)
                prod = received - timedelta(days=random.randint(1, 15))
                initial_qty = float(random.randint(20, 100)) if "纸杯" not in mat_name else float(random.randint(500, 3000))
                current_qty = initial_qty * random.uniform(0.1, 0.9)
                batch_no = f"B{mat_code[-3:]}{store[-3:]}{received.strftime('%Y%m%d')}{i}"
                session.add(BatchInfo(
                    batch_no=batch_no,
                    material_code=mat_code,
                    material_name=mat_name,
                    store_code=store,
                    supplier_code=sup_code,
                    production_date=prod,
                    expiry_date=expiry,
                    received_date=received,
                    initial_qty=Decimal(str(round(initial_qty, 3))),
                    current_qty=Decimal(str(round(current_qty, 3))),
                    unit=unit,
                    status="active",
                ))
                batch_count += 1
    session.flush()
    print(f"批次数据已插入: {batch_count} 条")


def seed_raw_inventory(session):
    today = date.today()
    existing = session.query(RawInventory).filter(RawInventory.snapshot_date >= today).count()
    if existing > 0:
        print(f"原始库存数据已存在 (今日 {existing} 条)，跳过")
        return

    batch_map = {}
    for b in session.query(BatchInfo).all():
        key = (b.store_code, b.material_code)
        batch_map.setdefault(key, []).append(b)

    count = 0

    history_days = 15
    history_stores = STORES[:3]
    history_materials = MATERIALS[:10]

    for store in history_stores:
        for mat_code, mat_name, unit, _, safety_stock in history_materials:
            key = (store, mat_code)
            batches = batch_map.get(key, [])
            if not batches:
                continue

            daily_batch_qty = {}
            for batch in batches:
                batch_key = (store, mat_code, batch.batch_no)
                start_qty = float(batch.initial_qty) if batch.initial_qty else float(batch.current_qty)
                daily_qty_list = []
                current_qty = start_qty

                for day_offset in range(history_days - 1, -1, -1):
                    snap_date = today - timedelta(days=day_offset)
                    daily_consume = random.uniform(0.5, 3.0)
                    current_qty = max(current_qty - daily_consume, 0.1)

                    if day_offset in [10, 5] and random.random() < 0.6:
                        restock_qty = random.uniform(20, 50) if "纸杯" not in mat_name else random.uniform(500, 1500)
                        current_qty += restock_qty

                    if day_offset == 7 and random.random() < 0.3:
                        adjust_qty = random.uniform(-5, 5) if "纸杯" not in mat_name else random.uniform(-50, 50)
                        current_qty = max(current_qty + adjust_qty, 0.1)

                    daily_qty_list.append((snap_date, current_qty))

                daily_batch_qty[batch_key] = daily_qty_list

            for batch_key, daily_qty_list in daily_batch_qty.items():
                s_code, m_code, b_no = batch_key
                for snap_date, qty in daily_qty_list:
                    session.add(RawInventory(
                        store_code=s_code,
                        material_code=m_code,
                        material_name=mat_name,
                        batch_no=b_no,
                        stock_qty=Decimal(str(round(qty, 3))),
                        unit=unit,
                        safety_stock=Decimal(str(safety_stock)),
                        warehouse_code=f"WH{s_code[-2:]}",
                        snapshot_date=snap_date,
                        raw_source="ERP系统",
                    ))
                    count += 1

    for store in STORES:
        for mat_code, mat_name, unit, _, safety_stock in MATERIALS:
            key = (store, mat_code)
            batches = batch_map.get(key, [])
            if not batches:
                continue
            for batch in batches:
                if store in history_stores and (mat_code, mat_name, unit, _, safety_stock) in history_materials:
                    continue
                qty = float(batch.current_qty) * random.uniform(0.8, 1.2)
                session.add(RawInventory(
                    store_code=store,
                    material_code=mat_code,
                    material_name=mat_name,
                    batch_no=batch.batch_no,
                    stock_qty=Decimal(str(round(max(qty, 0.1), 3))),
                    unit=unit,
                    safety_stock=Decimal(str(safety_stock)),
                    warehouse_code=f"WH{store[-2:]}",
                    snapshot_date=today,
                    raw_source="ERP系统",
                ))
                count += 1

    for store in STORES:
        for mat_code, mat_name, unit, _, safety_stock in MATERIALS:
            key = (store, mat_code)
            if key in batch_map:
                continue
            for _ in range(random.randint(1, 2)):
                stock_qty = random.uniform(safety_stock * 0.5, safety_stock * 5)
                batch_no = f"B{mat_code[-3:]}{store[-3:]}{today.strftime('%Y%m%d')}{random.randint(0,9)}"
                session.add(RawInventory(
                    store_code=store,
                    material_code=mat_code,
                    material_name=mat_name,
                    batch_no=batch_no,
                    stock_qty=Decimal(str(round(stock_qty, 3))),
                    unit=unit,
                    safety_stock=Decimal(str(safety_stock)),
                    warehouse_code=f"WH{store[-2:]}",
                    snapshot_date=today,
                    raw_source="ERP系统",
                ))
                count += 1

    session.flush()
    print(f"原始库存数据已插入: {count} 条 (含{history_days}天历史快照)")


def seed_raw_receipts(session):
    existing = session.query(RawReceipt).count()
    if existing > 500:
        print(f"会员小票数据已存在 ({existing} 条)，跳过")
        return

    today = date.today()
    count = 0
    for days_back in range(30):
        txn_date = today - timedelta(days=days_back)
        for store in STORES[:5]:
            for _ in range(random.randint(3, 10)):
                receipt_no = f"R{store}{txn_date.strftime('%Y%m%d')}{random.randint(1000,9999)}"
                member_id = f"M{random.randint(10000, 99999)}" if random.random() < 0.6 else None
                prod = random.choice(PRODUCTS)
                txn_time = datetime.combine(txn_date, datetime.min.time()) + timedelta(
                    hours=random.randint(8, 21),
                    minutes=random.randint(0, 59),
                )
                for mat_code, _, _ in prod[2]:
                    mat_info = next((m for m in MATERIALS if m[0] == mat_code), None)
                    if mat_info:
                        qty = random.uniform(0.01, 0.2) if mat_info[3] > 100 else random.uniform(0.05, 0.5)
                        amount = random.uniform(18, 42)
                        session.add(RawReceipt(
                            receipt_no=receipt_no,
                            store_code=store,
                            member_id=member_id,
                            transaction_time=txn_time,
                            material_code=mat_code,
                            material_name=mat_info[1],
                            quantity=Decimal(str(round(qty, 3))),
                            unit=mat_info[2],
                            amount=Decimal(str(round(amount, 2))),
                            raw_source="会员系统",
                        ))
                        count += 1

    session.flush()
    print(f"会员小票数据已插入: {count} 条")


def seed_raw_pos(session):
    existing = session.query(RawPos).count()
    if existing > 500:
        print(f"POS流水数据已存在 ({existing} 条)，跳过")
        return

    today = date.today()
    count = 0
    for days_back in range(30):
        txn_date = today - timedelta(days=days_back)
        for store in STORES[:5]:
            for _ in range(random.randint(10, 30)):
                pos_id = f"P{store}{txn_date.strftime('%Y%m%d')}{random.randint(10000,99999)}"
                prod = random.choice(PRODUCTS)
                txn_time = datetime.combine(txn_date, datetime.min.time()) + timedelta(
                    hours=random.randint(7, 22),
                    minutes=random.randint(0, 59),
                )
                qty = random.randint(1, 3)
                amount = qty * random.uniform(18, 42)
                session.add(RawPos(
                    pos_trans_id=pos_id,
                    store_code=store,
                    transaction_time=txn_time,
                    product_code=prod[0],
                    product_name=prod[1],
                    quantity=Decimal(str(qty)),
                    amount=Decimal(str(round(amount, 2))),
                    raw_source="POS系统",
                ))
                count += 1

    session.flush()
    print(f"POS流水数据已插入: {count} 条")


def main():
    print("=" * 60)
    print("连锁咖啡原料补货看板 - 数据库初始化 & 模拟数据生成")
    print("=" * 60)

    init_db()

    session = Session()
    try:
        seed_suppliers(session)
        seed_bom(session)
        seed_batches(session)
        seed_raw_inventory(session)
        seed_raw_receipts(session)
        seed_raw_pos(session)
        session.flush()

        print("\n开始执行 ETL 清洗...")
        from etl.clean_receipts import clean_receipts
        from etl.clean_inventory import clean_inventory, generate_inventory_ledger_from_snapshots
        from etl.clean_pos import clean_pos
        from etl.caliber_match import caliber_match

        receipt_count = clean_receipts(session)
        print(f"  会员小票清洗: {receipt_count} 条消耗流水")
        pos_count = clean_pos(session)
        print(f"  POS流水清洗: {pos_count} 条 → 已按BOM展开为物料消耗")
        inv_count = clean_inventory(session)
        print(f"  库存清洗: {inv_count} 条快照")
        ledger_count = generate_inventory_ledger_from_snapshots(session)
        print(f"  库存快照差异生成: {ledger_count} 条出入库流水")
        usage_count = caliber_match(session)
        print(f"  口径匹配: {usage_count} 条日均用量记录")

        session.commit()
        print("\n" + "=" * 60)
        print("数据初始化 + ETL 清洗完成！")
        print("=" * 60)
    except Exception as e:
        session.rollback()
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        Session.remove()


if __name__ == "__main__":
    main()
