"""生成美业门店示例数据"""
import random
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import argparse

import polars as pl
import numpy as np

from src.config import TECHNICIANS, STORES, PRODUCT_CATEGORIES

random.seed(42)
np.random.seed(42)

FIRST_NAMES = ["王", "李", "张", "刘", "陈", "杨", "黄", "赵", "周", "吴", "徐", "孙", "朱", "马", "胡"]
LAST_NAMES = ["芳", "丽", "敏", "静", "娟", "燕", "玲", "桂", "娣", "红", "春", "夏", "秋", "冬", "云"]

SERVICE_ITEMS = [
    ("面部护理", "深层清洁补水"),
    ("面部护理", "抗衰紧致提升"),
    ("面部护理", "美白淡斑护理"),
    ("身体护理", "背部精油SPA"),
    ("身体护理", "全身淋巴排毒"),
    ("身体护理", "肩颈放松调理"),
    ("美甲美睫", "日式美甲"),
    ("美甲美睫", "韩式美睫"),
    ("美甲美睫", "半永久定妆"),
    ("美发造型", "时尚剪发"),
    ("美发造型", "烫染设计"),
    ("美发造型", "营养护理"),
    ("养生SPA", "艾灸调理"),
    ("养生SPA", "拔罐刮痧"),
    ("养生SPA", "中药熏蒸"),
]

PRODUCTS = [
    ("面部护理", "玻尿酸精华液", 298, 150, True),
    ("面部护理", "保湿面膜套装", 198, 80, True),
    ("面部护理", "抗衰面霜", 580, 290, True),
    ("面部护理", "美白精华", 458, 220, True),
    ("身体护理", "复方精油", 368, 180, True),
    ("身体护理", "身体乳", 128, 50, True),
    ("美甲美睫", "甲油胶套装", 258, 120, True),
    ("美甲美睫", "嫁接睫毛", 168, 80, True),
    ("美发造型", "洗发水", 88, 40, True),
    ("美发造型", "护发素", 88, 40, True),
    ("美发造型", "烫发药水", 198, 90, True),
    ("养生SPA", "艾灸条", 68, 30, True),
    ("养生SPA", "中药包", 128, 60, True),
    ("面部护理", "美容仪", 2980, 1500, False),
    ("身体护理", "SPA床品套装", 880, 400, False),
]

REVIEW_TAGS = [
    "服务好", "技术专业", "环境舒适", "干净卫生",
    "效果明显", "价格实惠", "没有推销", "细心周到",
    "等待时间长", "推销多", "效果一般", "环境一般",
    "态度不好", "技术有待提升", "性价比低",
]

CARD_TYPES = ["月卡", "季卡", "半年卡", "年卡", "次卡"]
PAYMENT_METHODS = ["微信", "支付宝", "银行卡", "现金"]


def generate_customer_names(count: int) -> List[str]:
    names = set()
    while len(names) < count:
        names.add(random.choice(FIRST_NAMES) + random.choice(LAST_NAMES))
    return list(names)


def generate_phone() -> str:
    return "1" + random.choice(["3", "5", "7", "8", "9"]) + "".join(random.choices("0123456789", k=9))


def generate_dates(start_date: date, end_date: date, count: int) -> List[date]:
    delta = end_date - start_date
    dates = []
    for _ in range(count):
        random_days = random.randint(0, delta.days)
        dates.append(start_date + timedelta(days=random_days))
    return dates


def generate_inventory(start_date: date, end_date: date) -> pl.DataFrame:
    data = []
    for idx, (category, name, price, cost, is_consumable) in enumerate(PRODUCTS):
        for store in STORES:
            base_stock = random.randint(10, 100) if is_consumable else random.randint(2, 20)
            expiry_months = random.randint(1, 24)
            expiry = (end_date + timedelta(days=expiry_months * 30)) if is_consumable else None

            data.append({
                "product_code": f"SKU{idx+1:04d}",
                "product_name": name,
                "category": category,
                "stock_quantity": base_stock,
                "unit_price": price,
                "cost_price": cost,
                "supplier": f"供应商{random.randint(1, 5)}",
                "expiry_date": expiry.isoformat() if expiry else None,
                "store": store,
                "is_consumable": is_consumable,
            })

            if random.random() < 0.15:
                data.append({
                    "product_code": f"SKU{idx+1:04d}",
                    "product_name": name,
                    "category": category,
                    "stock_quantity": random.randint(0, 5),
                    "unit_price": price,
                    "cost_price": cost,
                    "supplier": f"供应商{random.randint(1, 5)}",
                    "expiry_date": expiry.isoformat() if expiry else None,
                    "store": store,
                    "is_consumable": is_consumable,
                })

    return pl.DataFrame(data)


def generate_reviews(start_date: date, end_date: date, count: int = 200) -> pl.DataFrame:
    customer_names = generate_customer_names(count)
    dates = generate_dates(start_date, end_date, count)

    data = []
    for i in range(count):
        rating = np.random.choice([1, 2, 3, 4, 5], p=[0.05, 0.08, 0.15, 0.35, 0.37])
        category, service = random.choice(SERVICE_ITEMS)

        if rating >= 4:
            num_tags = random.randint(1, 3)
            tags = random.sample(REVIEW_TAGS[:8], num_tags)
            review_text = random.choice([
                "非常满意，技师手法很专业，下次还会再来！",
                "环境很好，服务也很周到，效果明显。",
                "没有推销，体验很舒服，推荐给大家。",
                "价格实惠，效果超出预期。",
            ])
        elif rating == 3:
            num_tags = random.randint(1, 2)
            tags = random.sample(REVIEW_TAGS[4:12], num_tags)
            review_text = random.choice([
                "整体还行，效果一般般吧。",
                "环境还可以，等待时间有点长。",
                "服务中规中矩，没有特别惊喜。",
            ])
        else:
            num_tags = random.randint(1, 2)
            tags = random.sample(REVIEW_TAGS[8:], num_tags)
            review_text = random.choice([
                "不太满意，等待时间太长了。",
                "推销太多了，体验不好。",
                "效果一般，性价比不高。",
                "态度不太好，不会再来了。",
            ])

        data.append({
            "customer_id": f"CUST{i+1:05d}",
            "customer_name": customer_names[i],
            "order_id": f"ORD{start_date.strftime('%Y%m%d')}{i+1:05d}",
            "rating": int(rating),
            "review_tags": ",".join(tags),
            "review_text": review_text,
            "technician": random.choice(TECHNICIANS),
            "service_item": service,
            "category": category,
            "store": random.choice(STORES),
            "review_date": dates[i].isoformat(),
        })

    return pl.DataFrame(data)


def generate_appointments(start_date: date, end_date: date, count: int = 500) -> pl.DataFrame:
    customer_names = generate_customer_names(count)
    dates = generate_dates(start_date, end_date, count)

    data = []
    times = ["09:00:00", "10:00:00", "11:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00"]

    for i in range(count):
        category, service = random.choice(SERVICE_ITEMS)
        appt_date = dates[i]
        appt_time = random.choice(times)
        technician = random.choice(TECHNICIANS)
        store = random.choice(STORES)

        status_weights = [0.75, 0.12, 0.08, 0.05]
        status = np.random.choice(["已完成", "已预约", "已取消", "未到店"], p=status_weights)
        attended = status in ["已完成"]

        hour = int(appt_time.split(":")[0])
        check_in = datetime.combine(appt_date, datetime.min.time()) + timedelta(hours=hour, minutes=random.randint(-5, 10))
        duration = random.randint(60, 120)
        check_out = check_in + timedelta(minutes=duration) if attended else None

        is_member = random.random() < 0.6
        actual_amount = random.randint(200, 1500) if attended else 0
        card_used = random.choice(["次卡A", "次卡B", "月卡", "季卡", ""]) if is_member else ""

        data.append({
            "customer_id": f"CUST{(i % 150) + 1:05d}",
            "customer_name": customer_names[i % len(customer_names)],
            "phone": generate_phone(),
            "appointment_date": appt_date.isoformat(),
            "appointment_time": appt_time,
            "service_item": service,
            "category": category,
            "technician": technician,
            "store": store,
            "status": status,
            "check_in_time": check_in.isoformat() if attended else None,
            "check_out_time": check_out.isoformat() if attended else None,
            "actual_amount": actual_amount,
            "card_used": card_used,
            "is_member": is_member,
            "attended": attended,
        })

    return pl.DataFrame(data)


def generate_recharge(start_date: date, end_date: date, count: int = 150) -> pl.DataFrame:
    customer_names = generate_customer_names(count)
    dates = generate_dates(start_date, end_date, count)

    amounts = [500, 1000, 2000, 3000, 5000, 10000, 20000]
    weights = [0.15, 0.25, 0.2, 0.15, 0.12, 0.08, 0.05]

    data = []
    for i in range(count):
        amount = int(np.random.choice(amounts, p=weights))
        if amount >= 10000:
            gift = int(amount * 0.2)
        elif amount >= 5000:
            gift = int(amount * 0.15)
        elif amount >= 2000:
            gift = int(amount * 0.1)
        else:
            gift = int(amount * 0.05)

        card_type = random.choice(CARD_TYPES)

        data.append({
            "customer_id": f"CUST{(i % 100) + 1:05d}",
            "customer_name": customer_names[i % len(customer_names)],
            "phone": generate_phone(),
            "recharge_date": dates[i].isoformat(),
            "recharge_amount": amount,
            "gift_amount": gift,
            "payment_method": random.choice(PAYMENT_METHODS),
            "store": random.choice(STORES),
            "sales_staff": random.choice(TECHNICIANS),
            "card_type": card_type,
        })

    return pl.DataFrame(data)


def generate_service_cards(start_date: date, end_date: date, count: int = 120) -> pl.DataFrame:
    customer_names = generate_customer_names(count)
    dates = generate_dates(start_date, end_date, count)

    card_defs = [
        ("面部护理", "深层补水年卡", 48, 3980, 2980),
        ("面部护理", "抗衰护理季卡", 12, 1680, 1280),
        ("身体护理", "SPA放松年卡", 24, 2980, 2180),
        ("身体护理", "肩颈调理月卡", 4, 580, 480),
        ("美甲美睫", "美甲年卡", 24, 1980, 1580),
        ("美甲美睫", "美睫季卡", 6, 880, 680),
        ("美发造型", "烫染年卡", 12, 2580, 1980),
        ("养生SPA", "艾灸调理年卡", 48, 3680, 2680),
    ]

    data = []
    for i in range(count):
        category, card_name, total_sessions, original_price, sale_price = random.choice(card_defs)
        purchase_date = dates[i]
        expiry_date = purchase_date + timedelta(days=365)

        used_sessions = random.randint(0, total_sessions)
        remaining_sessions = total_sessions - used_sessions

        if random.random() < 0.1:
            expiry_date = purchase_date + timedelta(days=random.randint(1, 60))
            remaining_sessions = random.randint(1, total_sessions)

        data.append({
            "card_code": f"CARD{i+1:06d}",
            "card_name": card_name,
            "category": category,
            "total_sessions": total_sessions,
            "used_sessions": used_sessions,
            "remaining_sessions": remaining_sessions,
            "original_price": original_price,
            "sale_price": sale_price,
            "customer_id": f"CUST{(i % 80) + 1:05d}",
            "customer_name": customer_names[i % len(customer_names)],
            "purchase_date": purchase_date.isoformat(),
            "expiry_date": expiry_date.isoformat(),
            "store": random.choice(STORES),
        })

    return pl.DataFrame(data)


def generate_schedules(start_date: date, end_date: date) -> pl.DataFrame:
    data = []
    shift_types = ["早班", "晚班", "全天", "休息"]
    shift_weights = [0.3, 0.3, 0.35, 0.05]

    current_date = start_date
    while current_date <= end_date:
        for technician in TECHNICIANS:
            if random.random() < 0.1:
                shift = "休息"
                is_leave = True
                leave_reason = random.choice(["病假", "事假", "年假", "调休"])
            else:
                shift = np.random.choice(shift_types[:3], p=[0.33, 0.33, 0.34])
                is_leave = False
                leave_reason = ""

            time_ranges = {
                "早班": ("09:00:00", "18:00:00"),
                "晚班": ("12:00:00", "21:00:00"),
                "全天": ("09:00:00", "21:00:00"),
                "休息": (None, None),
            }
            start_time, end_time = time_ranges[shift]

            data.append({
                "technician": technician,
                "schedule_date": current_date.isoformat(),
                "shift_type": shift,
                "start_time": start_time,
                "end_time": end_time,
                "store": random.choice(STORES),
                "is_leave": is_leave,
                "leave_reason": leave_reason,
            })
        current_date += timedelta(days=1)

    return pl.DataFrame(data)


def main():
    parser = argparse.ArgumentParser(description="生成美业门店示例数据")
    parser.add_argument("--days", type=int, default=90, help="生成多少天的数据")
    parser.add_argument("--output-dir", type=str, default="data/sample", help="输出目录")
    parser.add_argument("--run-etl", action="store_true", help="生成数据后自动运行ETL")
    args = parser.parse_args()

    end_date = date.today()
    start_date = end_date - timedelta(days=args.days)

    print(f"生成 {start_date} 至 {end_date} 的示例数据...")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("\n1. 生成库存数据...")
    inv_df = generate_inventory(start_date, end_date)
    inv_df.write_csv(output_dir / "inventory.csv")
    print(f"   共 {len(inv_df)} 条库存记录")

    print("\n2. 生成点评数据...")
    rev_df = generate_reviews(start_date, end_date, 200)
    rev_df.write_csv(output_dir / "reviews.csv")
    print(f"   共 {len(rev_df)} 条点评记录")

    print("\n3. 生成预约数据...")
    appt_df = generate_appointments(start_date, end_date, 500)
    appt_df.write_csv(output_dir / "appointments.csv")
    print(f"   共 {len(appt_df)} 条预约记录")

    print("\n4. 生成充值数据...")
    recharge_df = generate_recharge(start_date, end_date, 150)
    recharge_df.write_csv(output_dir / "recharge.csv")
    print(f"   共 {len(recharge_df)} 条充值记录")

    print("\n5. 生成服务卡数据...")
    cards_df = generate_service_cards(start_date, end_date, 120)
    cards_df.write_csv(output_dir / "service_cards.csv")
    print(f"   共 {len(cards_df)} 条服务卡记录")

    print("\n6. 生成排班数据...")
    schedules_df = generate_schedules(start_date, end_date)
    schedules_df.write_csv(output_dir / "schedules.csv")
    print(f"   共 {len(schedules_df)} 条排班记录")

    print(f"\n✓ 所有数据已生成到 {output_dir}/ 目录")

    if args.run_etl:
        print("\n开始运行ETL流水线...")
        from src.config import load_config
        from src.etl.pipeline import ETLPipeline

        config = load_config()
        with ETLPipeline(config) as pipeline:
            results = pipeline.run_full_pipeline(
                inventory_df=inv_df,
                reviews_df=rev_df,
                appointments_df=appt_df,
                recharge_df=recharge_df,
                service_cards_df=cards_df,
                schedules_df=schedules_df,
            )
            print("\nETL执行结果:")
            for key, result in results.items():
                print(f"  {key}: batch_id={result['batch_id']}, rows={result['row_count']}, anomalies={len(result['anomalies'])}")
        print("\n✓ ETL执行完成！")


if __name__ == "__main__":
    from pathlib import Path
    main()
