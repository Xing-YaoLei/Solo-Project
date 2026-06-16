from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from datetime import datetime, timedelta
import random

import polars as pl

from app.services.duckdb_service import DuckDBService
from app.services.minio_service import MinIOService
from app.services.pipeline import DataPipeline


STORES = ["store_01", "store_02", "store_03"]
STORE_NAMES = {"store_01": "旗舰店", "store_02": "城东店", "store_03": "城西店"}
PHARMACISTS = ["pharmacist_a", "pharmacist_b", "pharmacist_c"]
PRODUCTS = [
    ("P001", "阿莫西林胶囊", 12.5),
    ("P002", "布洛芬片", 8.0),
    ("P003", "奥美拉唑肠溶胶囊", 25.0),
    ("P004", "阿托伐他汀钙片", 35.0),
    ("P005", "硝苯地平控释片", 28.0),
    ("P006", "二甲双胍片", 6.5),
    ("P007", "氯雷他定片", 15.0),
    ("P008", "头孢克洛胶囊", 22.0),
    ("P009", "蒙脱石散", 18.0),
    ("P010", "复方甘草片", 5.0),
]
CHRONIC_DISEASES = ["高血压", "糖尿病", "冠心病", "哮喘", "无"]
ALLERGIES = ["青霉素", "头孢类", "磺胺类", "无"]
FOLLOWUP_TYPES = ["电话回访", "到店回访", "线上回访"]
FOLLOWUP_STATUSES = ["completed", "in_progress", "pending"]
FOLLOWUP_RESULTS = ["effective", "adjusted", "side_effect", "no_response"]


def generate_cashier_data(n: int = 200) -> pl.DataFrame:
    rows = []
    base_date = datetime(2025, 1, 1)
    for i in range(n):
        store = random.choice(STORES)
        product = random.choice(PRODUCTS)
        qty = random.randint(1, 5)
        date = base_date + timedelta(days=random.randint(0, 180))
        has_rx = random.random() < 0.4
        rows.append({
            "transaction_id": f"TXN_{i:06d}",
            "store_id": store,
            "store_name": STORE_NAMES[store],
            "transaction_date": date,
            "member_id": f"MEM_{random.randint(1, 80):04d}",
            "product_code": product[0],
            "product_name": product[1],
            "quantity": qty,
            "unit_price": product[2],
            "total_amount": qty * product[2],
            "prescription_id": f"RX_{i:06d}" if has_rx else "",
            "pharmacist_id": random.choice(PHARMACISTS),
        })
    return pl.DataFrame(rows)


def generate_inventory_data() -> pl.DataFrame:
    rows = []
    for store in STORES:
        for product in PRODUCTS:
            n_batches = random.randint(1, 3)
            for b in range(n_batches):
                prod_date = datetime(2024, random.randint(1, 12), 1).date()
                shelf_months = random.randint(6, 36)
                exp_date = prod_date + timedelta(days=shelf_months * 30)
                rows.append({
                    "inventory_id": f"INV_{store}_{product[0]}_{b}",
                    "store_id": store,
                    "product_code": product[0],
                    "product_name": product[1],
                    "batch_number": f"BN{random.randint(1000, 9999)}",
                    "production_date": prod_date,
                    "expiry_date": exp_date,
                    "stock_quantity": random.randint(5, 200),
                    "supplier": f"供应商{random.randint(1, 5):02d}号",
                })
    return pl.DataFrame(rows)


def generate_member_data(n: int = 80) -> pl.DataFrame:
    rows = []
    base_date = datetime(2023, 1, 1)
    for i in range(n):
        reg_date = base_date + timedelta(days=random.randint(0, 500))
        last_visit = reg_date + timedelta(days=random.randint(0, 365))
        rows.append({
            "member_id": f"MEM_{i:04d}",
            "member_name": f"会员{i + 1:03d}号",
            "phone": f"138{random.randint(10000000, 99999999)}",
            "store_id": random.choice(STORES),
            "register_date": reg_date.date(),
            "chronic_disease": random.choice(CHRONIC_DISEASES),
            "allergy_info": random.choice(ALLERGIES),
            "last_visit_date": last_visit.date(),
        })
    return pl.DataFrame(rows)


def generate_followup_data(n: int = 150) -> pl.DataFrame:
    rows = []
    base_date = datetime(2025, 1, 15)
    for i in range(n):
        date = base_date + timedelta(days=random.randint(0, 170))
        status = random.choice(FOLLOWUP_STATUSES)
        result = random.choice(FOLLOWUP_RESULTS) if status == "completed" else ""
        next_date = date + timedelta(days=random.randint(7, 30)) if status != "completed" else None
        rows.append({
            "followup_id": f"FU_{i:06d}",
            "transaction_id": f"TXN_{random.randint(0, 199):06d}",
            "member_id": f"MEM_{random.randint(1, 80):04d}",
            "store_id": random.choice(STORES),
            "pharmacist_id": random.choice(PHARMACISTS),
            "followup_date": date,
            "followup_type": random.choice(FOLLOWUP_TYPES),
            "followup_status": status,
            "followup_result": result,
            "next_followup_date": next_date,
        })
    return pl.DataFrame(rows)


def seed_all(db: DuckDBService, minio: MinIOService) -> dict:
    pipeline = DataPipeline(minio, db)

    cashier_df = generate_cashier_data()
    inventory_df = generate_inventory_data()
    member_df = generate_member_data()
    followup_df = generate_followup_data()

    data_dir = Path("./data/tmp_seed")
    data_dir.mkdir(parents=True, exist_ok=True)

    cashier_path = data_dir / "cashier.csv"
    inventory_path = data_dir / "inventory.csv"
    member_path = data_dir / "members.csv"
    followup_path = data_dir / "followup.csv"

    cashier_df.write_csv(cashier_path)
    inventory_df.write_csv(inventory_path)
    member_df.write_csv(member_path)
    followup_df.write_csv(followup_path)

    results = {}
    results["cashier"] = pipeline.ingest_cashier(cashier_path, "seed_script")
    results["inventory"] = pipeline.ingest_inventory(inventory_path, "seed_script")
    results["members"] = pipeline.ingest_members(member_path, "seed_script")
    results["followup"] = pipeline.ingest_followup(followup_path, "seed_script")

    for p in [cashier_path, inventory_path, member_path, followup_path]:
        p.unlink(missing_ok=True)
    data_dir.rmdir()

    return results


if __name__ == "__main__":
    from app.services.duckdb_service import DuckDBService
    from app.services.minio_service import MinIOService

    db = DuckDBService()
    minio = MinIOService()
    results = seed_all(db, minio)
    for source, info in results.items():
        print(f"[{source}] batch={info['batch_id']} rows={info['rows_ingested']}")
    db.close()
