from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
import random
import string
import numpy as np
import polars as pl
from src.data_layer.data_repository import DataRepository, DualWriteResult


class MockDataGenerator:
    PACKAGES = [
        {"package_id": "PKG001", "package_name": "山景豪华套房", "base_price": 899, "total_rooms": 5},
        {"package_id": "PKG002", "package_name": "海景双床房", "base_price": 699, "total_rooms": 8},
        {"package_id": "PKG003", "package_name": "家庭亲子房", "base_price": 799, "total_rooms": 6},
        {"package_id": "PKG004", "package_name": "蜜月情侣房", "base_price": 999, "total_rooms": 4},
        {"package_id": "PKG005", "package_name": "团建聚会别墅", "base_price": 2999, "total_rooms": 2},
    ]

    CHANNELS = ["携程", "美团", "飞猪", "抖音", "小程序", "线下门店"]
    ROOMS = ["R101", "R102", "R103", "R201", "R202", "R301", "R302", "R303"]
    PAYMENT_METHODS = ["微信支付", "支付宝", "银行卡", "OTA平台支付"]
    ORDER_STATUSES = ["confirmed", "paid", "completed", "cancelled"]
    PAYMENT_STATUSES = ["paid", "pending", "refunded"]

    def __init__(self, repository: DataRepository, seed: int = 42):
        self.repository = repository
        self.write_results: Dict[str, DualWriteResult] = {}
        random.seed(seed)
        np.random.seed(seed)

    def _generate_id(self, prefix: str) -> str:
        return f"{prefix}{''.join(random.choices(string.digits, k=8))}"

    def _random_date(self, start: date, end: date) -> date:
        delta = end - start
        random_days = random.randint(0, delta.days)
        return start + timedelta(days=random_days)

    def generate_pricing_rules(self, start_date: date, end_date: date) -> pl.DataFrame:
        rules = []
        for pkg in self.PACKAGES:
            rule_id = self._generate_id("RULE")
            rules.append({
                "rule_id": rule_id,
                "package_id": pkg["package_id"],
                "rule_name": f"{pkg['package_name']}基础定价",
                "rule_type": "base",
                "start_date": start_date,
                "end_date": end_date,
                "min_nights": 1,
                "max_nights": 30,
                "base_price": pkg["base_price"],
                "weekend_surcharge": random.choice([0, 50, 100]),
                "holiday_surcharge": random.choice([0, 100, 200]),
                "early_bird_discount": random.choice([0, 5, 10]),
                "last_minute_discount": random.choice([0, 10, 15]),
                "long_stay_discount": random.choice([0, 8, 12]),
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            })

        df = pl.DataFrame(rules)
        result = self.repository.save_pricing_rules_batch(df)
        self.write_results["pricing_rules"] = result
        return df

    def generate_package_inventory(self, start_date: date, end_date: date) -> pl.DataFrame:
        inventory_records = []
        current_date = start_date

        while current_date <= end_date:
            for pkg in self.PACKAGES:
                base_booked = random.randint(0, pkg["total_rooms"])
                reserved = random.randint(0, max(0, pkg["total_rooms"] - base_booked))

                if current_date.weekday() >= 5:
                    base_booked = min(pkg["total_rooms"], base_booked + 2)
                if current_date.month in [7, 8, 10]:
                    base_booked = min(pkg["total_rooms"], base_booked + 3)

                oversell_chance = random.random()
                if oversell_chance < 0.05:
                    base_booked = pkg["total_rooms"] + random.randint(1, 2)

                available = pkg["total_rooms"] - base_booked - reserved
                unit_price = pkg["base_price"] * random.uniform(0.9, 1.3)

                inventory_records.append({
                    "inventory_id": self._generate_id("INV"),
                    "package_id": pkg["package_id"],
                    "date": current_date,
                    "total_rooms": pkg["total_rooms"],
                    "booked_rooms": base_booked,
                    "reserved_rooms": reserved,
                    "available_rooms": available,
                    "unit_price": round(unit_price, 2),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                })
            current_date += timedelta(days=1)

        df = pl.DataFrame(inventory_records)
        result = self.repository.save_package_inventory_batch(df)
        self.write_results["package_inventory"] = result
        return df

    def generate_ota_orders(self, start_date: date, end_date: date, count: int = 500) -> pl.DataFrame:
        orders = []
        for _ in range(count):
            order_date = self._random_date(start_date, end_date - timedelta(days=30))
            lead_days = random.randint(0, 30)
            checkin_date = order_date + timedelta(days=lead_days)
            nights = random.choices([1, 2, 3, 4, 5, 7], weights=[0.3, 0.3, 0.2, 0.1, 0.07, 0.03])[0]
            checkout_date = checkin_date + timedelta(days=nights)

            if checkout_date > end_date:
                continue

            pkg = random.choice(self.PACKAGES)
            rooms = random.choices([1, 2, 3], weights=[0.8, 0.15, 0.05])[0]
            guests = random.randint(1, min(rooms * 3, 10))

            channel = random.choice(self.CHANNELS)
            order_status = random.choices(
                self.ORDER_STATUSES, weights=[0.1, 0.2, 0.6, 0.1]
            )[0]
            payment_status = "paid" if order_status != "cancelled" else random.choice(["paid", "refunded"])

            base_amount = pkg["base_price"] * nights * rooms
            discount = random.uniform(0, 0.2)
            order_amount = round(base_amount * (1 - discount), 2)
            paid_amount = order_amount if payment_status == "paid" else 0

            orders.append({
                "order_id": self._generate_id("ORD"),
                "package_id": pkg["package_id"],
                "channel": channel,
                "order_date": order_date,
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "nights": nights,
                "rooms": rooms,
                "guests": guests,
                "order_amount": order_amount,
                "paid_amount": paid_amount,
                "order_status": order_status,
                "payment_status": payment_status,
                "customer_name": f"客户{random.randint(1000, 9999)}",
                "customer_phone": f"138{random.randint(10000000, 99999999)}",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            })

        df = pl.DataFrame(orders)
        result = self.repository.save_ota_orders_batch(df)
        self.write_results["ota_orders"] = result
        return df

    def generate_door_lock_records(self, orders: pl.DataFrame) -> pl.DataFrame:
        records = []
        for row in orders.iter_rows(named=True):
            if row["order_status"] in ["confirmed", "paid", "completed"]:
                checkin_time = datetime.combine(
                    row["checkin_date"], datetime.min.time()
                ) + timedelta(hours=random.randint(14, 20))
                checkout_time = datetime.combine(
                    row["checkout_date"], datetime.min.time()
                ) + timedelta(hours=random.randint(8, 12))

                for i in range(row["rooms"]):
                    records.append({
                        "record_id": self._generate_id("DOOR"),
                        "order_id": row["order_id"],
                        "room_id": random.choice(self.ROOMS),
                        "checkin_time": checkin_time,
                        "checkout_time": checkout_time,
                        "guest_name": row["customer_name"],
                        "id_card": f"110101{random.randint(1980, 2005)}{random.randint(101, 1231)}{random.randint(1000, 9999)}",
                        "operation_type": "checkin",
                        "operator": f"前台{random.choice(['A', 'B', 'C'])}",
                        "created_at": datetime.now(),
                    })

        df = pl.DataFrame(records)
        result = self.repository.save_door_lock_records_batch(df)
        self.write_results["door_lock_records"] = result
        return df

    def generate_payment_transactions(self, orders: pl.DataFrame) -> pl.DataFrame:
        transactions = []
        for row in orders.iter_rows(named=True):
            if row["paid_amount"] > 0:
                transaction_date = datetime.combine(
                    row["order_date"], datetime.min.time()
                ) + timedelta(hours=random.randint(9, 21))

                channel_fee = round(row["order_amount"] * random.uniform(0.02, 0.08), 2)
                net_amount = round(row["paid_amount"] - channel_fee, 2)

                transactions.append({
                    "transaction_id": self._generate_id("PAY"),
                    "order_id": row["order_id"],
                    "transaction_date": transaction_date,
                    "amount": row["paid_amount"],
                    "payment_method": random.choice(self.PAYMENT_METHODS),
                    "transaction_status": "success",
                    "channel_fee": channel_fee,
                    "net_amount": net_amount,
                    "remark": f"{row['channel']}渠道支付",
                    "created_at": datetime.now(),
                })

            if row["payment_status"] == "refunded":
                refund_date = datetime.combine(
                    row["order_date"], datetime.min.time()
                ) + timedelta(days=random.randint(1, 3))

                transactions.append({
                    "transaction_id": self._generate_id("REF"),
                    "order_id": row["order_id"],
                    "transaction_date": refund_date,
                    "amount": -row["paid_amount"],
                    "payment_method": random.choice(self.PAYMENT_METHODS),
                    "transaction_status": "refund",
                    "channel_fee": 0,
                    "net_amount": -row["paid_amount"],
                    "remark": "订单取消退款",
                    "created_at": datetime.now(),
                })

        df = pl.DataFrame(transactions)
        result = self.repository.save_payment_transactions_batch(df)
        self.write_results["payment_transactions"] = result
        return df

    def generate_conversion_rate_versions(self) -> pl.DataFrame:
        versions = [
            {
                "version_id": self._generate_id("CV"),
                "version_name": "基础转化率 v1.0",
                "version_code": "v1.0",
                "description": "订单数 / 库存可用量，最基础的转化率计算",
                "numerator_formula": "count(col('order_id'))",
                "denominator_formula": "sum(col('available_rooms'))",
                "time_range": "daily",
                "filters": None,
                "is_active": True,
                "created_by": "系统管理员",
                "created_at": datetime.now(),
                "effective_date": date(2024, 1, 1),
                "expiry_date": None,
            },
            {
                "version_id": self._generate_id("CV"),
                "version_name": "付费转化率 v1.1",
                "version_code": "v1.1",
                "description": "已支付订单数 / 库存可用量，仅统计成功支付的订单",
                "numerator_formula": "count(col('order_id').filter(col('payment_status') == 'paid'))",
                "denominator_formula": "sum(col('available_rooms'))",
                "time_range": "daily",
                "filters": "payment_status = 'paid'",
                "is_active": True,
                "created_by": "运营经理",
                "created_at": datetime.now(),
                "effective_date": date(2024, 3, 1),
                "expiry_date": None,
            },
            {
                "version_id": self._generate_id("CV"),
                "version_name": "入住转化率 v2.0",
                "version_code": "v2.0",
                "description": "实际入住订单数 / 库存总房量，考虑Noshow情况",
                "numerator_formula": "count(col('order_id').filter(col('order_status') == 'completed'))",
                "denominator_formula": "sum(col('total_rooms'))",
                "time_range": "daily",
                "filters": "order_status = 'completed'",
                "is_active": True,
                "created_by": "数据分析师",
                "created_at": datetime.now(),
                "effective_date": date(2024, 6, 1),
                "expiry_date": None,
            },
            {
                "version_id": self._generate_id("CV"),
                "version_name": "收入转化率 v2.1",
                "version_code": "v2.1",
                "description": "实际收入 / 潜在最大收入，基于金额的转化率",
                "numerator_formula": "sum(col('paid_amount'))",
                "denominator_formula": "sum(col('total_rooms') * col('unit_price'))",
                "time_range": "daily",
                "filters": None,
                "is_active": True,
                "created_by": "财务总监",
                "created_at": datetime.now(),
                "effective_date": date(2024, 9, 1),
                "expiry_date": None,
            },
        ]

        df = pl.DataFrame(versions)
        result = self.repository.save_conversion_rate_versions_batch(df)
        self.write_results["conversion_rate_versions"] = result
        return df

    def generate_analysis_notes(self, start_date: date, end_date: date) -> pl.DataFrame:
        notes = []
        note_dates = [
            start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            for _ in range(10)
        ]

        for i, note_date in enumerate(note_dates):
            pkg = random.choice(self.PACKAGES)
            note_types = ["oversell", "conversion", "pricing", "channel", "inventory"]
            note_type = random.choice(note_types)

            note_content = {
                "oversell": f"发现{note_date.strftime('%Y-%m-%d')}{pkg['package_name']}出现超卖{random.randint(1, 3)}间，已联系客户协调",
                "conversion": f"{pkg['package_name']}转化率上周下降{random.uniform(2, 8):.1f}%，分析原因可能是竞品降价",
                "pricing": f"{pkg['package_name']}价格调整后订单量变化{random.choice(['+', '-'])}{random.randint(5, 20)}%，建议持续观察",
                "channel": f"{random.choice(self.CHANNELS)}渠道本周表现突出，建议增加投放",
                "inventory": f"{pkg['package_name']}库存紧张，建议增加{random.randint(1, 3)}间房量",
            }

            conclusions = {
                "oversell": "已协调客户升级房型，无投诉",
                "conversion": "已调整价格策略，下周观察效果",
                "pricing": "价格弹性分析显示当前定价合理",
                "channel": "已与渠道沟通专项合作",
                "inventory": "下月起增加2间房量",
            }

            action_items = {
                "oversell": "优化超卖预警机制，增加实时库存检查频率",
                "conversion": "监测竞品价格，考虑推出早鸟优惠",
                "pricing": "建立价格变动跟踪机制，每周评估效果",
                "channel": "制定渠道KPI考核体系，按月复盘",
                "inventory": "评估增加房量的成本收益，下月执行",
            }

            notes.append({
                "note_id": self._generate_id("AN"),
                "record_type": note_type,
                "record_id": pkg["package_id"],
                "analysis_date": note_date,
                "analyst": random.choice(["张三", "李四", "王五", "赵六"]),
                "content": note_content[note_type],
                "conclusion": conclusions[note_type],
                "action_items": action_items[note_type],
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            })

        df = pl.DataFrame(notes)
        result = self.repository.save_analysis_notes_batch(df)
        self.write_results["analysis_notes"] = result
        return df

    def generate_all_data(self, start_date: date, end_date: date, order_count: int = 500) -> Dict[str, Any]:
        print(f"生成数据范围: {start_date} ~ {end_date}")

        print("1. 生成定价规则...")
        pricing_rules = self.generate_pricing_rules(start_date, end_date)
        print(f"   已生成 {len(pricing_rules)} 条定价规则")

        print("2. 生成套餐库存...")
        inventory = self.generate_package_inventory(start_date, end_date)
        print(f"   已生成 {len(inventory)} 条库存记录")

        print("3. 生成OTA订单...")
        orders = self.generate_ota_orders(start_date, end_date, order_count)
        print(f"   已生成 {len(orders)} 条订单")

        print("4. 生成门锁记录...")
        door_records = self.generate_door_lock_records(orders)
        print(f"   已生成 {len(door_records)} 条门锁记录")

        print("5. 生成收款流水...")
        payments = self.generate_payment_transactions(orders)
        print(f"   已生成 {len(payments)} 条收款流水")

        print("6. 生成转化率口径版本...")
        versions = self.generate_conversion_rate_versions()
        print(f"   已生成 {len(versions)} 个转化率版本")

        print("7. 生成分析备注...")
        notes = self.generate_analysis_notes(start_date, end_date)
        print(f"   已生成 {len(notes)} 条分析备注")

        print("8. 检测超卖...")
        from src.business_logic.oversell_detector import OversellDetector
        detector = OversellDetector(self.repository)
        oversells = detector.detect_oversell(start_date, end_date)
        print(f"   检测到 {len(oversells)} 条超卖记录")

        return {
            "pricing_rules": pricing_rules,
            "inventory": inventory,
            "orders": orders,
            "door_records": door_records,
            "payments": payments,
            "versions": versions,
            "notes": notes,
            "oversells": oversells,
            "write_results": self.write_results,
        }
