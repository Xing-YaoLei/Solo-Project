import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random

from app.database import SessionLocal, engine, Base
from app.models import Store, Equipment, CleaningRecord, InspectionRecord, ThresholdConfig, EquipmentRemark
from app.services.threshold_service import ThresholdService
from app.services.sync_service import sync_to_duckdb


def init_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        ThresholdService.init_defaults(db)

        if db.query(Store).count() > 0:
            print("Data already exists, skipping initialization.")
            return

        cities = ["北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "武汉"]
        districts = ["朝阳区", "海淀区", "浦东新区", "徐汇区", "天河区", "南山区", "西湖区", "武侯区"]

        stores = []
        for i in range(20):
            city = random.choice(cities)
            district = random.choice(districts)
            store = Store(
                store_code=f"S{1001 + i}",
                store_name=f"{city}第{i+1}店",
                city=city,
                district=district,
                address=f"{city}{district}某某路{100+i}号",
                status="active",
            )
            db.add(store)
            stores.append(store)
        db.flush()

        equipment_types = [
            ("coffee_machine", "意式咖啡机", "La Marzocco", "Linea PB"),
            ("coffee_machine", "美式咖啡机", "BUNN", "MHW"),
            ("grinder", "磨豆机", "Mahlkonig", "EK43"),
            ("grinder", "磨豆机", "Fiorenzato", "F64E"),
            ("blender", "冰沙机", "Vitamix", "5200"),
            ("refrigerator", "冷藏柜", "Hoshizaki", "RCT-70"),
            ("ice_maker", "制冰机", "Scotsman", "BL45"),
            ("water_heater", "开水机", "吉之美", "GM-K1"),
        ]

        equipments = []
        eq_id = 1001
        for store in stores:
            num_eq = random.randint(4, 8)
            selected_types = random.sample(equipment_types, min(num_eq, len(equipment_types)))
            for eq_type, eq_name, brand, model in selected_types:
                install_date = datetime.utcnow() - timedelta(days=random.randint(30, 365))
                last_clean = datetime.utcnow() - timedelta(days=random.randint(0, 14))
                cycle = random.choice([3, 7, 14, 30])
                next_clean = last_clean + timedelta(days=cycle)

                status = "normal"
                days_since = (datetime.utcnow() - last_clean).days
                if days_since > cycle + 3:
                    status = "offline"
                elif random.random() < 0.1:
                    status = "maintenance"

                equipment = Equipment(
                    equipment_code=f"E{eq_id}",
                    equipment_name=eq_name,
                    equipment_type=eq_type,
                    store_id=store.id,
                    brand=brand,
                    model=model,
                    install_date=install_date,
                    status=status,
                    last_cleaning_date=last_clean,
                    next_cleaning_date=next_clean,
                    cleaning_cycle_days=cycle,
                )
                db.add(equipment)
                equipments.append(equipment)
                eq_id += 1
        db.flush()

        record_id = 1
        for equipment in equipments:
            num_records = random.randint(2, 10)
            for j in range(num_records):
                clean_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                result = "passed" if random.random() < 0.85 else "failed"
                source = random.choice(["member_receipt", "pos_flow"])

                record = CleaningRecord(
                    record_code=f"CR{record_id:06d}",
                    equipment_id=equipment.id,
                    store_id=equipment.store_id,
                    cleaning_date=clean_date,
                    cleaning_type=random.choice(["routine", "deep", "weekly"]),
                    operator=f"员工{random.randint(1, 50)}",
                    cleaning_items="冲泡头,蒸汽棒,滴水盘",
                    cleaning_result=result,
                    remark="",
                    source=source,
                )
                db.add(record)
                record_id += 1

                if random.random() < 0.6:
                    insp_date = clean_date + timedelta(hours=random.randint(1, 24))
                    passed = result == "passed" or random.random() < 0.7
                    score = random.uniform(60, 100) if passed else random.uniform(40, 70)

                    inspection = InspectionRecord(
                        record_code=f"IR{record_id:06d}",
                        equipment_id=equipment.id,
                        store_id=equipment.store_id,
                        inspection_date=insp_date,
                        inspector=f"巡检员{random.randint(1, 10)}",
                        inspection_type=random.choice(["routine", "spot_check"]),
                        passed=passed,
                        score=round(score, 1),
                        issues_found="蒸汽棒有轻微奶渍" if not passed else "",
                        improvement_suggestions="加强蒸汽棒清洁频次" if not passed else "",
                    )
                    db.add(inspection)
                    record_id += 1

        for equipment in equipments:
            if equipment.status in ["offline", "maintenance"] or random.random() < 0.15:
                remark = EquipmentRemark(
                    equipment_id=equipment.id,
                    store_id=equipment.store_id,
                    remark_type=random.choice(["异常备注", "巡检备注", "清洁备注"]),
                    content=f"设备状态:{equipment.status}，需跟进处理。" + random.choice([
                        "已通知店长安排维修",
                        "预计下周恢复正常",
                        "等待配件到货",
                        "加强日常巡检频次",
                    ]),
                    operator=f"运营{random.randint(1, 5)}",
                    related_date=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
                )
                db.add(remark)

        db.commit()
        sync_to_duckdb(db)
        print(f"Successfully initialized data:")
        print(f"  - Stores: {len(stores)}")
        print(f"  - Equipments: {len(equipments)}")
        print(f"  - Cleaning records: {record_id - len(equipments)}")
        print(f"  - Threshold configs: {db.query(ThresholdConfig).count()}")
        print(f"  - DuckDB synced successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
