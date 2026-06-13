"""
模拟数据生成脚本：生成美业门店的示例数据，用于演示和测试
"""
import os
import sys
import uuid
import random
import logging
from datetime import datetime, date, timedelta

import polars as pl

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data import duckdb_manager
from src.modules.risk_engine import RiskEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

random.seed(42)

STORES = ["S001", "S002", "S003", "S004"]
TECHNICIANS = ["张技师", "李技师", "王技师", "陈技师", "刘技师", "赵技师"]
SERVICES = [
    "面部基础护理", "深层补水护理", "抗衰老护理", "美白淡斑护理",
    "肩颈按摩", "全身SPA", "足浴按摩", "头部护理",
    "美甲基础款", "美甲延长款", "美睫嫁接", "半永久纹眉",
]
MATERIALS = [
    ("MAT001", "玻尿酸精华液", 30, 5.0),
    ("MAT002", "胶原蛋白面膜", 20, 1.0),
    ("MAT003", "按摩精油", 100, 10.0),
    ("MAT004", "去死皮膏", 50, 2.0),
    ("MAT005", "保湿霜", 40, 3.0),
    ("MAT006", "爽肤水", 80, 5.0),
    ("MAT007", "睫毛嫁接胶水", 10, 1.0),
    ("MAT008", "美甲甲油胶", 15, 2.0),
    ("MAT009", "纹眉色料", 5, 0.5),
    ("MAT010", "洁面乳", 60, 3.0),
]
POSITIVE_TAGS = ["服务好", "环境好", "技师专业", "效果好", "性价比高", "干净卫生", "态度好", "推荐", "回头客"]
NEGATIVE_TAGS = ["服务差", "等待久", "效果一般", "价格贵", "环境差", "推销多", "技师不专业", "不满意"]
PAYMENT_METHODS = ["WECHAT", "ALIPAY", "MEMBER_CARD", "CASH", "CARD"]
TRANSACTION_TYPES = ["RECHARGE", "CONSUMPTION", "PRODUCT"]


def generate_customers(n=200):
    """生成客户数据"""
    customers = []
    for i in range(1, n + 1):
        customers.append({
            "customer_id": f"C{i:04d}",
            "customer_name": f"客户{i}",
            "phone": f"138{random.randint(10000000, 99999999)}",
            "store_id": random.choice(STORES),
        })
    return pl.DataFrame(customers)


def generate_cashier_transactions(customers_df, days=60):
    """生成收银流水数据"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    transactions = []
    for _ in range(800):
        customer = customers_df.sample(1).row(0, named=True)
        trans_date = start_date + timedelta(days=random.randint(0, days))
        trans_type = random.choices(TRANSACTION_TYPES, weights=[0.2, 0.6, 0.2])[0]

        if trans_type == "RECHARGE":
            amount = random.choice([500, 1000, 2000, 3000, 5000, 10000])
            card_value = amount * random.choice([1.0, 1.1, 1.2])
        elif trans_type == "CONSUMPTION":
            amount = random.choice([128, 198, 298, 398, 598, 888, 1280])
            card_value = None
        else:
            amount = random.choice([68, 128, 198, 298, 398])
            card_value = None

        transactions.append({
            "transaction_id": f"T{uuid.uuid4().hex[:12].upper()}",
            "customer_id": customer["customer_id"],
            "store_id": customer["store_id"],
            "order_id": f"O{uuid.uuid4().hex[:10].upper()}",
            "transaction_type": trans_type,
            "amount": amount,
            "payment_method": random.choice(PAYMENT_METHODS),
            "recharge_card_type": "储值卡" if trans_type == "RECHARGE" else None,
            "recharge_card_value": card_value,
            "service_name": random.choice(SERVICES) if trans_type == "CONSUMPTION" else None,
            "technician_name": random.choice(TECHNICIANS) if trans_type == "CONSUMPTION" else None,
            "transaction_date": datetime.combine(trans_date, datetime.min.time()) + timedelta(
                hours=random.randint(9, 21),
                minutes=random.randint(0, 59),
            ),
            "remark": None,
        })

    return pl.DataFrame(transactions)


def generate_reviews(customers_df, transactions_df, delay_rate=0.3):
    """生成点评记录数据（含延迟点评）"""
    consumption_df = transactions_df.filter(pl.col("transaction_type") == "CONSUMPTION")

    reviews = []
    review_count = int(consumption_df.height * 0.7)
    sampled = consumption_df.sample(review_count)

    for row in sampled.iter_rows(named=True):
        rating_weights = [0.05, 0.05, 0.1, 0.3, 0.5]
        rating = random.choices([1, 2, 3, 4, 5], weights=rating_weights)[0]

        is_delayed = random.random() < delay_rate
        if is_delayed:
            delay_hours = random.uniform(24, 120)
        else:
            delay_hours = random.uniform(0.5, 20)

        service_ts = row["transaction_date"]
        review_ts = service_ts + timedelta(hours=delay_hours)
        sync_ts = review_ts + timedelta(minutes=random.randint(5, 120))

        if rating >= 4:
            tags = random.sample(POSITIVE_TAGS, k=random.randint(1, 3))
        else:
            tags = random.sample(NEGATIVE_TAGS, k=random.randint(1, 3))

        reviews.append({
            "review_id": f"R{uuid.uuid4().hex[:12].upper()}",
            "customer_id": row["customer_id"],
            "store_id": row["store_id"],
            "order_id": row["order_id"],
            "service_name": row["service_name"],
            "technician_name": row["technician_name"],
            "rating": rating,
            "review_content": generate_review_content(rating, row["service_name"]),
            "tags": ",".join(tags),
            "service_date": service_ts.date(),
            "review_submit_date": review_ts,
            "sync_date": sync_ts,
            "is_delayed": is_delayed,
            "delay_hours": round(delay_hours, 1),
        })

    return pl.DataFrame(reviews)


def generate_review_content(rating, service_name):
    """生成点评内容"""
    if rating >= 4:
        contents = [
            f"非常满意{service_name}，技师手法很好，做完效果明显！",
            f"{service_name}体验不错，环境干净，服务态度也很好。",
            f"第一次来做{service_name}，超出预期，会再来的。",
            f"{service_name}做的很认真，全程没有推销，体验感很好。",
            f"老顾客了，{service_name}一直做的不错，推荐给大家。",
        ]
    elif rating == 3:
        contents = [
            f"{service_name}中规中矩吧，没有特别惊艳的感觉。",
            f"{service_name}一般般，效果还需要再观察。",
            f"{service_name}还行，就是等的时间有点久。",
            f"{service_name}做的还可以，但是价格有点贵。",
        ]
    else:
        contents = [
            f"{service_name}体验很差，技师手法不专业，不推荐。",
            f"很失望，{service_name}完全没有达到预期效果。",
            f"等了一个小时才做上{service_name}，服务态度也不好。",
            f"{service_name}做完过敏了，不会再来了。",
            f"推销太严重了，做{service_name}全程在推销办卡，很烦。",
        ]
    return random.choice(contents)


def generate_course_items(customers_df):
    """生成项目卡项数据"""
    courses = []
    for _ in range(300):
        customer = customers_df.sample(1).row(0, named=True)
        service = random.choice(SERVICES)
        total = random.choice([5, 10, 15, 20, 30, 50])
        used = random.randint(0, total)
        purchase_date = date.today() - timedelta(days=random.randint(30, 365))
        expiry_date = purchase_date + timedelta(days=random.randint(180, 730))

        courses.append({
            "course_id": f"CRS{uuid.uuid4().hex[:10].upper()}",
            "customer_id": customer["customer_id"],
            "store_id": customer["store_id"],
            "course_name": service,
            "total_sessions": total,
            "used_sessions": used,
            "remaining_sessions": total - used,
            "purchase_date": purchase_date,
            "expiry_date": expiry_date,
            "unit_price": random.choice([128, 198, 298, 398, 598]),
            "total_amount": total * random.choice([128, 198, 298, 398, 598]),
            "assigned_technician": random.choice(TECHNICIANS),
        })

    return pl.DataFrame(courses)


def generate_inventory():
    """生成库存数据"""
    inventory = []
    for store_id in STORES:
        for mat_code, mat_name, stock, unit in MATERIALS:
            inventory.append({
                "inventory_id": f"INV{store_id}_{mat_code}",
                "material_code": mat_code,
                "material_name": mat_name,
                "category": random.choice(["护肤类", "彩妆类", "工具类", "耗材类"]),
                "unit": "ml" if "液" in mat_name or "油" in mat_name or "乳" in mat_name else "片" if "面膜" in mat_name else "支",
                "stock_quantity": stock * random.uniform(0.5, 1.5),
                "unit_price": random.uniform(50, 500),
                "supplier_name": random.choice(["供应商A", "供应商B", "供应商C"]),
                "purchase_date": date.today() - timedelta(days=random.randint(1, 90)),
                "expiry_date": date.today() + timedelta(days=random.randint(180, 730)),
                "store_id": store_id,
            })
    return pl.DataFrame(inventory)


def generate_material_usage(transactions_df, course_items_df):
    """生成耗材使用记录"""
    consumption_df = transactions_df.filter(pl.col("transaction_type") == "CONSUMPTION")

    usage_records = []
    for _ in range(500):
        trans = consumption_df.sample(1).row(0, named=True)
        material = random.choice(MATERIALS)
        mat_code, mat_name, std_qty, unit = material

        is_abnormal = random.random() < 0.15
        if is_abnormal:
            usage_qty = std_qty * random.uniform(1.6, 3.0)
            anomaly_reason = f"用量超出标准{usage_qty / std_qty:.1f}倍"
        else:
            usage_qty = std_qty * random.uniform(0.8, 1.2)
            anomaly_reason = None

        usage_records.append({
            "usage_id": f"USE{uuid.uuid4().hex[:12].upper()}",
            "store_id": trans["store_id"],
            "order_id": trans["order_id"],
            "service_name": trans["service_name"],
            "material_code": mat_code,
            "material_name": mat_name,
            "usage_quantity": round(usage_qty, 2),
            "standard_usage_quantity": std_qty,
            "unit": "ml" if "液" in mat_name or "油" in mat_name or "乳" in mat_name else "片" if "面膜" in mat_name else "支",
            "transaction_date": trans["transaction_date"].date(),
            "customer_id": trans["customer_id"],
            "technician_name": trans["technician_name"],
            "is_abnormal": is_abnormal,
            "anomaly_reason": anomaly_reason,
        })

    return pl.DataFrame(usage_records)


def main():
    logger.info("开始生成模拟数据...")

    os.makedirs("data/processed", exist_ok=True)

    logger.info("生成客户数据...")
    customers_df = generate_customers(200)

    logger.info("生成收银流水数据...")
    transactions_df = generate_cashier_transactions(customers_df, days=60)

    logger.info("生成点评记录数据...")
    reviews_df = generate_reviews(customers_df, transactions_df, delay_rate=0.3)

    logger.info("生成项目卡项数据...")
    course_items_df = generate_course_items(customers_df)

    logger.info("生成库存数据...")
    inventory_df = generate_inventory()

    logger.info("生成耗材使用记录...")
    material_usage_df = generate_material_usage(transactions_df, course_items_df)

    logger.info("写入 DuckDB 数据库...")
    duckdb_manager.insert_dataframe("reviews", reviews_df, if_exists="replace")
    duckdb_manager.insert_dataframe("inventory", inventory_df, if_exists="replace")
    duckdb_manager.insert_dataframe("cashier_transactions", transactions_df, if_exists="replace")
    duckdb_manager.insert_dataframe("course_items", course_items_df, if_exists="replace")
    duckdb_manager.insert_dataframe("material_usage", material_usage_df, if_exists="replace")
    duckdb_manager.execute("DELETE FROM risk_alerts")

    logger.info("运行风险引擎检测...")
    engine = RiskEngine()
    engine.run_full_risk_scan()

    logger.info("=" * 50)
    logger.info("模拟数据生成完成！")
    logger.info(f"  客户数: {customers_df.height}")
    logger.info(f"  收银流水: {transactions_df.height} 条")
    logger.info(f"  点评记录: {reviews_df.height} 条")
    logger.info(f"  项目卡项: {course_items_df.height} 条")
    logger.info(f"  库存记录: {inventory_df.height} 条")
    logger.info(f"  耗材使用: {material_usage_df.height} 条")

    alert_count = duckdb_manager.get_table_row_count("risk_alerts")
    logger.info(f"  风险预警: {alert_count} 条")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
