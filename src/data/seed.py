from __future__ import annotations

import random
import uuid
from datetime import date, datetime, timedelta
from typing import Optional

import numpy as np
import polars as pl

from src.data.duckdb_manager import DuckDBManager

STORES = [
    ("S001", "人民广场店"),
    ("S002", "陆家嘴店"),
    ("S003", "徐家汇店"),
    ("S004", "静安寺店"),
    ("S005", "南京西路店"),
]

PRODUCTS = [
    ("P001", "美式咖啡", "咖啡", 18.0, "杯"),
    ("P002", "拿铁", "咖啡", 25.0, "杯"),
    ("P003", "卡布奇诺", "咖啡", 26.0, "杯"),
    ("P004", "摩卡", "咖啡", 28.0, "杯"),
    ("P005", "澳白", "咖啡", 27.0, "杯"),
    ("P006", "浓缩", "咖啡", 15.0, "杯"),
    ("P007", "冰美式", "咖啡", 20.0, "杯"),
    ("P008", "抹茶拿铁", "茶饮", 28.0, "杯"),
    ("P009", "伯爵红茶拿铁", "茶饮", 26.0, "杯"),
    ("P010", "牛角包", "烘焙", 12.0, "个"),
    ("P011", "芝士蛋糕", "烘焙", 28.0, "块"),
    ("P012", "蓝莓麦芬", "烘焙", 15.0, "个"),
    ("P013", "可颂", "烘焙", 14.0, "个"),
    ("P014", "咖啡豆(250g)", "物料", 88.0, "袋"),
    ("P015", "牛奶(1L)", "物料", 15.0, "盒"),
]

LOSS_REASONS = [
    "过期报废",
    "制作错误",
    "顾客投诉丢弃",
    "温度不达标",
    "包装破损",
    "物料变质",
    "盘点差异",
    "设备故障损耗",
]

REVIEW_STATUS = ["通过", "待复核", "驳回"]
REVIEWERS = ["admin", "area01", "area02"]

CHANNELS = ["堂食", "自提", "会员小程序"]
PLATFORMS = ["美团", "饿了么", "抖音"]


def _rand_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def generate_inventory(start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    cur = start_date
    while cur <= end_date:
        for sid, sname in STORES:
            for pid, pname, cat, price, unit in PRODUCTS:
                if cat == "物料":
                    qty = random.randint(5, 40)
                elif cat == "烘焙":
                    qty = random.randint(10, 60)
                else:
                    qty = random.randint(50, 300)
                rows.append({
                    "id": f"INV-{cur.isoformat()}-{sid}-{pid}",
                    "store_id": sid,
                    "store_name": sname,
                    "sku_id": pid,
                    "sku_name": pname,
                    "category": cat,
                    "quantity": float(qty),
                    "unit": unit,
                    "unit_price": price,
                    "record_date": cur,
                })
        cur += timedelta(days=1)
    return pl.DataFrame(rows)


def generate_member_receipts(start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    cur = start_date
    while cur <= end_date:
        for sid, sname in STORES:
            daily_orders = random.randint(40, 180)
            for _ in range(daily_orders):
                pid, pname, cat, price, _ = random.choice(PRODUCTS)
                if cat == "物料":
                    continue
                qty = random.randint(1, 3)
                rows.append({
                    "id": str(uuid.uuid4()),
                    "store_id": sid,
                    "store_name": sname,
                    "member_id": f"M{random.randint(1000, 9999)}",
                    "product_id": pid,
                    "product_name": pname,
                    "category": cat,
                    "quantity": float(qty),
                    "unit_price": price,
                    "total_amount": round(price * qty, 2),
                    "sale_date": cur,
                    "channel": random.choice(CHANNELS),
                })
        cur += timedelta(days=1)
    return pl.DataFrame(rows)


def generate_delivery_orders(start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    cur = start_date
    while cur <= end_date:
        for sid, sname in STORES:
            daily_orders = random.randint(30, 150)
            for _ in range(daily_orders):
                pid, pname, cat, price, _ = random.choice(PRODUCTS)
                if cat == "物料":
                    continue
                qty = random.randint(1, 4)
                platform = random.choice(PLATFORMS)
                rows.append({
                    "id": str(uuid.uuid4()),
                    "platform": platform,
                    "order_no": f"{platform[:2].upper()}{cur.strftime('%Y%m%d')}{random.randint(100000, 999999)}",
                    "store_id": sid,
                    "store_name": sname,
                    "product_id": pid,
                    "product_name": pname,
                    "category": cat,
                    "quantity": float(qty),
                    "unit_price": price,
                    "total_amount": round(price * qty, 2),
                    "order_date": cur,
                    "status": "已完成",
                    "raw_data": '{"source":"mock"}',
                })
        cur += timedelta(days=1)
    return pl.DataFrame(rows)


def generate_loss_reports(start_date: date, end_date: date) -> pl.DataFrame:
    rows = []
    cur = start_date
    while cur <= end_date:
        for sid, sname in STORES:
            loss_count = random.randint(2, 12)
            if sid == "S003":
                loss_count = int(loss_count * 2.2)
            if sid == "S005":
                loss_count = int(loss_count * 1.8)
            for _ in range(loss_count):
                pid, pname, cat, price, unit = random.choice(PRODUCTS)
                if cat == "物料":
                    qty = round(random.uniform(0.2, 2.0), 2)
                elif cat == "烘焙":
                    qty = random.randint(1, 8)
                else:
                    qty = random.randint(1, 15)
                loss_amt = round(price * qty, 2)
                reason = random.choice(LOSS_REASONS)
                status = np.random.choice(REVIEW_STATUS, p=[0.75, 0.18, 0.07])
                review_date = None
                reviewer = None
                review_comment = ""
                if status != "待复核":
                    review_date = cur + timedelta(days=random.randint(0, 2))
                    reviewer = random.choice(REVIEWERS)
                    if status == "通过":
                        review_comment = random.choice([
                            "数据核对无误",
                            "流程合规，予以通过",
                            "已核实门店反馈",
                            "",
                        ])
                    else:
                        review_comment = random.choice([
                            "缺少外卖平台明细佐证，请补充",
                            "数量异常，请重新盘点后提交",
                            "损耗原因描述不清晰",
                        ])
                is_exception = False
                exception_reason = ""
                if sid in ("S003", "S005") and reason in ("过期报废", "盘点差异") and qty > 8:
                    is_exception = True
                    exception_reason = "损耗量超出阈值，需关注"
                rows.append({
                    "id": str(uuid.uuid4()),
                    "report_no": f"BS{cur.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                    "store_id": sid,
                    "store_name": sname,
                    "sku_id": pid,
                    "sku_name": pname,
                    "category": cat,
                    "loss_quantity": float(qty),
                    "unit": unit,
                    "unit_price": price,
                    "loss_amount": loss_amt,
                    "loss_reason": reason,
                    "loss_reason_detail": f"{reason} - 门店自报",
                    "report_date": cur,
                    "reporter": f"store_{sid[-3:]}_mgr",
                    "review_status": status,
                    "reviewer": reviewer,
                    "review_comment": review_comment,
                    "review_date": review_date,
                    "responsible_store": sid,
                    "is_exception": is_exception,
                    "exception_reason": exception_reason,
                    "metric_version": "v2.0",
                })
        cur += timedelta(days=1)
    return pl.DataFrame(rows)


def seed_all_data(start_date: Optional[date] = None, end_date: Optional[date] = None) -> dict:
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=89)

    db = DuckDBManager()

    inv = generate_inventory(start_date, end_date)
    db.register_polars("tmp_inv", inv)
    db.execute("INSERT OR REPLACE INTO inventory SELECT * FROM tmp_inv")
    db.execute("DROP VIEW IF EXISTS tmp_inv")

    rec = generate_member_receipts(start_date, end_date)
    db.register_polars("tmp_rec", rec)
    db.execute("INSERT OR REPLACE INTO member_receipts SELECT * FROM tmp_rec")
    db.execute("DROP VIEW IF EXISTS tmp_rec")

    deliv = generate_delivery_orders(start_date, end_date)
    db.register_polars("tmp_deliv", deliv)
    db.execute("INSERT OR REPLACE INTO delivery_orders SELECT * FROM tmp_deliv")
    db.execute("DROP VIEW IF EXISTS tmp_deliv")

    loss = generate_loss_reports(start_date, end_date)
    db.register_polars("tmp_loss", loss)
    db.execute("INSERT OR REPLACE INTO loss_report SELECT * FROM tmp_loss")
    db.execute("DROP VIEW IF EXISTS tmp_loss")

    from src.business.metric_versions import METRIC_VERSION_DEFINITIONS
    for v, d in METRIC_VERSION_DEFINITIONS.items():
        db.execute(
            """
            INSERT OR REPLACE INTO metric_versions
            (version, description, formula, effective_date, created_by, changelog)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [v, d["description"], d["formula"], d["effective_date"].isoformat(), "system", d["changelog"]],
        )

    return {
        "inventory": len(inv),
        "member_receipts": len(rec),
        "delivery_orders": len(deliv),
        "loss_report": len(loss),
    }


def _write_refresh_time_now() -> None:
    from datetime import datetime
    import json
    import os
    from src.config import app_config

    try:
        os.makedirs(os.path.dirname(app_config.refresh_cache_path), exist_ok=True)
        with open(app_config.refresh_cache_path, "w", encoding="utf-8") as f:
            json.dump({"last_refresh": datetime.now().isoformat()}, f)
    except Exception:
        pass


def _has_refresh_time() -> bool:
    import json
    import os
    from src.config import app_config
    if not os.path.exists(app_config.refresh_cache_path):
        return False
    try:
        with open(app_config.refresh_cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return "last_refresh" in data and bool(data["last_refresh"])
    except Exception:
        return False


def ensure_seeded() -> dict:
    from src.auth import init_default_users

    init_default_users()
    db = DuckDBManager()
    cnt = db.query_df("SELECT COUNT(*) AS c FROM loss_report")["c"][0]
    if cnt and cnt > 0:
        if not _has_refresh_time():
            _write_refresh_time_now()
        return {"already_seeded": True, "loss_report": int(cnt)}
    result = seed_all_data()
    _write_refresh_time_now()
    return result
