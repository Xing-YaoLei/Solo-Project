import uuid
import random
from datetime import date, timedelta, datetime, time
from typing import List, Dict, Any

import polars as pl

from .data_sync.duckdb_store import DuckDBStore
from .data_sync.pipeline import SyncPipeline, SyncNode
from .models.payment_flow import PaymentFlowModel
from .models.e_contract import EContractModel
from .models.meter_reading import MeterReadingModel
from .models.cleaning_schedule import CleaningScheduleModel
from .auth.permission import PermissionManager
from .config import Role

REGIONS = ["东城区", "西城区", "朝阳区", "海淀区", "丰台区"]
APARTMENT_COUNT = 50
TENANT_COUNT = 50
CLEANER_COUNT = 20
PAYMENT_TYPES = ["rent", "deposit", "utility", "cleaning_fee", "maintenance"]
CLEANING_FREQUENCIES = ["weekly", "biweekly", "monthly", "none"]
ARRIVAL_STATUSES = ["on_time", "late", "absent", "unknown"]
SCHEDULE_STATUSES = ["scheduled", "in_progress", "completed", "cancelled", "no_show"]


def _gen_id(prefix: str = "") -> str:
    return prefix + str(uuid.uuid4())[:8]


def _random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def _random_time_str() -> str:
    hour = random.choice([8, 9, 10, 11, 13, 14, 15, 16, 17])
    minute = random.choice([0, 30])
    return f"{hour:02d}:{minute:02d}"


def generate_apartments() -> List[Dict[str, Any]]:
    apartments = []
    for i in range(APARTMENT_COUNT):
        apartments.append(
            {
                "apartment_id": f"APT{i+1:04d}",
                "region": random.choice(REGIONS),
                "building": f"Building{random.randint(1, 10)}",
                "unit": f"{random.randint(1, 20)}{random.choice(['A', 'B', 'C', 'D'])}",
            }
        )
    return apartments


def generate_payment_flows(apartments: List[Dict[str, Any]], start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    for apt in apartments:
        num_payments = random.randint(3, 8)
        for _ in range(num_payments):
            pdate = _random_date(start_date, end_date)
            ptype = random.choice(PAYMENT_TYPES)
            amount_map = {"rent": (3000, 8000), "deposit": (3000, 15000), "utility": (100, 800),
                          "cleaning_fee": (80, 200), "maintenance": (50, 500)}
            low, high = amount_map[ptype]
            rows.append(
                {
                    "id": _gen_id("PAY"),
                    "apartment_id": apt["apartment_id"],
                    "tenant_id": f"TEN{random.randint(1, TENANT_COUNT):04d}",
                    "payment_date": pdate,
                    "amount": round(random.uniform(low, high), 2),
                    "payment_type": ptype,
                    "status": random.choices(["success", "failed", "pending"], weights=[0.85, 0.1, 0.05])[0],
                    "region": apt["region"],
                    "created_at": datetime.combine(pdate, time(9, 0)),
                }
            )
    return pl.DataFrame(rows)


def generate_e_contracts(apartments: List[Dict[str, Any]], ref_date: date) -> pl.DataFrame:
    rows = []
    for apt in apartments:
        start = ref_date - timedelta(days=random.randint(0, 365))
        end = start + timedelta(days=random.randint(180, 730))
        rows.append(
            {
                "id": _gen_id("CTR"),
                "apartment_id": apt["apartment_id"],
                "tenant_id": f"TEN{random.randint(1, TENANT_COUNT):04d}",
                "contract_start": start,
                "contract_end": end,
                "monthly_rent": round(random.uniform(3000, 10000), 2),
                "cleaning_frequency": random.choices(CLEANING_FREQUENCIES, weights=[0.4, 0.3, 0.2, 0.1])[0],
                "region": apt["region"],
                "status": "active" if end >= ref_date else "expired",
                "signed_at": datetime.combine(start - timedelta(days=3), time(10, 0)),
            }
        )
    return pl.DataFrame(rows)


def generate_meter_readings(apartments: List[Dict[str, Any]], start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    current = start_date
    while current <= end_date:
        sample = random.sample(apartments, k=random.randint(10, 25))
        for apt in sample:
            rows.append(
                {
                    "id": _gen_id("MTR"),
                    "apartment_id": apt["apartment_id"],
                    "reading_date": current,
                    "electricity_usage": round(random.uniform(50, 400), 2),
                    "water_usage": round(random.uniform(2, 30), 2),
                    "meter_reader_id": f"MRD{random.randint(1, 5):03d}",
                    "region": apt["region"],
                    "notes": random.choice(["", "", "", "抄表异常需复核", "租户不在家"]),
                    "created_at": datetime.combine(current, time(14, 0)),
                }
            )
        current += timedelta(days=1)
    return pl.DataFrame(rows)


def generate_cleaning_schedules(apartments: List[Dict[str, Any]], start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    current = start_date
    slot = 0
    while current <= end_date:
        num_tasks = random.randint(12, 25)
        sampled = random.sample(apartments, k=min(num_tasks, len(apartments)))
        for apt in sampled:
            start_t = _random_time_str()
            h, m = map(int, start_t.split(":"))
            end_h = h + 2
            end_t = f"{end_h:02d}:{m:02d}"
            arrival = random.choices(ARRIVAL_STATUSES, weights=[0.6, 0.2, 0.1, 0.1])[0]
            if arrival == "absent":
                status = "no_show"
            elif arrival in ["on_time", "late"]:
                status = random.choices(["completed", "in_progress"], weights=[0.85, 0.15])[0]
            else:
                status = random.choice(["scheduled", "cancelled"])

            actual_start = start_t if arrival in ["on_time", "late"] else ""
            actual_end = end_t if status == "completed" else ""

            rows.append(
                {
                    "id": f"SCH{slot:06d}",
                    "apartment_id": apt["apartment_id"],
                    "cleaner_id": f"CLN{random.randint(1, CLEANER_COUNT):03d}",
                    "scheduled_date": current,
                    "scheduled_start": start_t,
                    "scheduled_end": end_t,
                    "region": apt["region"],
                    "status": status,
                    "actual_start": actual_start,
                    "actual_end": actual_end,
                    "arrival_status": arrival,
                    "reminder_sent": random.random() > 0.25,
                    "priority": random.randint(1, 5),
                    "created_at": datetime.combine(current - timedelta(days=2), time(8, 0)),
                    "updated_at": datetime.combine(current, time(18, 0)),
                }
            )
            slot += 1
        current += timedelta(days=1)

    for i in range(min(8, len(rows) // 10)):
        idx = random.randint(0, len(rows) - 2)
        row_a = rows[idx]
        row_b = rows[idx + 1]
        row_b["cleaner_id"] = row_a["cleaner_id"]
        row_b["scheduled_date"] = row_a["scheduled_date"]
        ha, ma = map(int, row_a["scheduled_start"].split(":"))
        row_b["scheduled_start"] = f"{ha + 1:02d}:{ma:02d}"
        hb, mb = map(int, row_b["scheduled_start"].split(":"))
        row_b["scheduled_end"] = f"{hb + 2:02d}:{mb:02d}"

    return pl.DataFrame(rows)


def seed_sample_data() -> Dict[str, Any]:
    db = DuckDBStore()
    ref_date = date.today()
    start_date = ref_date - timedelta(days=60)
    end_date = ref_date + timedelta(days=30)

    apartments = generate_apartments()

    pf = PaymentFlowModel(db)
    ec = EContractModel(db)
    mr = MeterReadingModel(db)
    cs = CleaningScheduleModel(db)

    raw_payments = generate_payment_flows(apartments, start_date, end_date)
    raw_contracts = generate_e_contracts(apartments, ref_date)
    raw_meters = generate_meter_readings(apartments, start_date, ref_date)
    raw_schedules = generate_cleaning_schedules(apartments, start_date, end_date)

    db.write_polars("payment_flows", pf.transform(raw_payments))
    db.write_polars("e_contracts", ec.transform(raw_contracts))
    db.write_polars("meter_readings", mr.transform(raw_meters))
    db.write_polars("cleaning_schedules", cs.transform(raw_schedules))

    pm = PermissionManager(db)
    users = [
        ("admin", Role.ADMIN, None, None),
        ("finance_zhang", Role.FINANCE, None, None),
        ("housekeeper_li", Role.HOUSEKEEPER, "朝阳区", None),
        ("housekeeper_wang", Role.HOUSEKEEPER, "东城区", None),
        ("maintenance_zhao", Role.MAINTENANCE, None, None),
        ("tenant_001", Role.TENANT, None, "TEN0001"),
        ("tenant_002", Role.TENANT, None, "TEN0002"),
    ]
    for username, role, region, tenant_id in users:
        if not pm.get_user(username):
            pm.create_user(username, role, region, tenant_id)

    db.close()
    return {
        "apartments": len(apartments),
        "payments": len(raw_payments),
        "contracts": len(raw_contracts),
        "meter_readings": len(raw_meters),
        "cleaning_schedules": len(raw_schedules),
        "date_range": f"{start_date} ~ {end_date}",
    }
