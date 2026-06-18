import asyncio
import random
from datetime import date, timedelta

from database import async_session, init_db
from models import Store, Vehicle, InspectionReport, InspectionItem, PreparationTask, TestDriveRecord, DataDiff, TurnoverTarget, MaterialItem

STORES = [
    {"store_name": "朝阳旗舰店", "lng": 116.481, "lat": 39.921, "city": "北京", "region": "朝阳"},
    {"store_name": "海淀学院路店", "lng": 116.353, "lat": 39.977, "city": "北京", "region": "海淀"},
    {"store_name": "丰台总部店", "lng": 116.287, "lat": 39.858, "city": "北京", "region": "丰台"},
    {"store_name": "通州万达店", "lng": 116.906, "lat": 39.902, "city": "北京", "region": "通州"},
    {"store_name": "大兴西红门店", "lng": 116.341, "lat": 39.763, "city": "北京", "region": "大兴"},
    {"store_name": "顺义空港店", "lng": 116.654, "lat": 40.102, "city": "北京", "region": "顺义"},
    {"store_name": "昌平回龙观店", "lng": 116.331, "lat": 40.075, "city": "北京", "region": "昌平"},
    {"store_name": "石景山万达店", "lng": 116.223, "lat": 39.906, "city": "北京", "region": "石景山"},
    {"store_name": "东城东直门店", "lng": 116.427, "lat": 39.947, "city": "北京", "region": "东城"},
    {"store_name": "西城广安门店", "lng": 116.353, "lat": 39.893, "city": "北京", "region": "西城"},
]

BRANDS = ["宝马", "奥迪", "奔驰", "大众", "丰田", "本田", "别克", "福特", "雪佛兰", "日产"]
MODELS = ["3系", "A4L", "C级", "迈腾", "凯美瑞", "雅阁", "君威", "蒙迪欧", "迈锐宝", "天籁"]
STATUSES = ["in_stock", "transfer_processing", "transferred", "sold"]
INSPECTORS = ["检测师1", "检测师2", "检测师3", "检测师4", "检测师5"]
DRIVERS = ["试驾员1", "试驾员2", "试驾员3"]
MATERIAL_TYPES = ["登记证", "行驶证", "购车发票", "保险单", "完税证明"]
MATERIAL_STATUSES = ["complete", "missing", "pending"]
INSPECTION_ITEMS = ["发动机", "变速箱", "车身外观", "底盘", "电气系统"]
PREP_TASKS = [
    {"task_name": "外观整备", "category": "外观", "related": "车身外观"},
    {"task_name": "机械整备", "category": "机械", "related": "发动机"},
    {"task_name": "内饰清洁", "category": "内饰", "related": ""},
]
DIFF_FIELDS = ["mileage", "brand", "model", "status", "entry_date"]
DIFF_SOURCES = ["vehicle_source", "detector", "crm"]


def gen_vin(idx: int) -> str:
    return f"LSVAU2180N2{100000 + idx:06d}"


async def seed():
    await init_db()

    async with async_session() as session:
        stores = []
        for s in STORES:
            store = Store(
                store_name=s["store_name"],
                lng=s["lng"],
                lat=s["lat"],
                city=s["city"],
                region=s["region"],
            )
            session.add(store)
            stores.append(store)
        await session.flush()

        vehicles = []
        for i in range(80):
            store = stores[i % 10]
            entry = date(2025, (i // 10) + 1, (i % 28) + 1)
            vehicle = Vehicle(
                vin=gen_vin(i),
                model=MODELS[i % 10],
                brand=BRANDS[i % 10],
                year=2018 + (i % 5),
                mileage=30000 + random.randint(0, 80000),
                store_id=store.store_id,
                entry_date=entry,
                status=STATUSES[i % 4],
                source_db_version=f"v{2 + (i % 3)}.{i % 5}",
                detector_version=f"D{3 + (i % 2)}.{i % 4}",
                crm_id=f"CRM-{10000 + i}",
            )
            session.add(vehicle)
            vehicles.append(vehicle)
        await session.flush()

        for v in vehicles[:20]:
            report = InspectionReport(
                vehicle_id=v.vehicle_id,
                inspector=INSPECTORS[hash(v.vin) % 5],
                inspect_date=v.entry_date,
                detector_version=v.detector_version,
            )
            session.add(report)
            await session.flush()

            for item_name in INSPECTION_ITEMS:
                status_val = "pass"
                detail_val = "正常"
                r = random.random()
                if item_name == "发动机" and r < 0.14:
                    status_val = "warning"
                    detail_val = "轻微异响"
                elif item_name == "车身外观" and r < 0.2:
                    status_val = "fail"
                    detail_val = "右后翼子板补漆"
                elif item_name == "电气系统" and r < 0.11:
                    status_val = "warning"
                    detail_val = "电瓶电压偏低"

                item = InspectionItem(
                    report_id=report.report_id,
                    item_name=item_name,
                    status=status_val,
                    detail=detail_val,
                )
                session.add(item)

            for j, pt in enumerate(PREP_TASKS):
                prep_status = "completed"
                if j == 0:
                    prep_status = random.choice(["completed", "in_progress", "pending"])
                elif j == 1:
                    prep_status = random.choice(["completed", "pending"])

                task = PreparationTask(
                    vehicle_id=v.vehicle_id,
                    task_name=pt["task_name"],
                    category=pt["category"],
                    status=prep_status,
                    related_inspection_item=pt["related"],
                    cost=round(800 + random.random() * 2000, 2),
                )
                session.add(task)

            num_drives = 1 + (hash(v.vin) % 4)
            for j in range(num_drives):
                drive = TestDriveRecord(
                    vehicle_id=v.vehicle_id,
                    drive_date=date(2025, (hash(v.vin) % 12) + 1, min(28, j + 1)),
                    driver=DRIVERS[j % 3],
                    duration_minutes=15 + random.randint(0, 45),
                    mileage_km=3.0 + random.randint(0, 15),
                    is_anomaly=(j == 0 and hash(v.vin) % 4 == 0),
                    anomaly_detail="怠速不稳，转速波动±200rpm" if (j == 0 and hash(v.vin) % 4 == 0) else None,
                )
                session.add(drive)

        await session.flush()

        for i in range(30):
            diff = DataDiff(
                vehicle_id=vehicles[i % 20].vehicle_id,
                field_name=DIFF_FIELDS[i % 5],
                source_value=["45200", "宝马", "3系", "in_stock", "2025-01-15"][i % 5],
                crm_value=["45000", "BMW", "3 Series", "available", "2025-01-16"][i % 5],
                source=DIFF_SOURCES[i % 3],
                detected_at=date(2025, (i // 5) + 1, (i % 28) + 1),
                resolved=(i % 3 != 0),
            )
            session.add(diff)

        await session.flush()

        for store in stores:
            for i in range(12):
                target = TurnoverTarget(
                    store_id=store.store_id,
                    period=f"2025-{i + 1:02d}",
                    target_days=20.0,
                )
                session.add(target)

        await session.flush()

        for v in vehicles:
            for mt in MATERIAL_TYPES:
                mat_status = random.choices(MATERIAL_STATUSES, weights=[70, 15, 15])[0]
                material = MaterialItem(
                    vehicle_id=v.vehicle_id,
                    material_type=mt,
                    status=mat_status,
                    submitted_date=v.entry_date if mat_status == "complete" else None,
                )
                session.add(material)

        await session.commit()
        print(f"Seeded {len(stores)} stores, {len(vehicles)} vehicles, and related records.")


if __name__ == "__main__":
    asyncio.run(seed())
