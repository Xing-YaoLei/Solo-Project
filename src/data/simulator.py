import polars as pl
from datetime import date, datetime, timedelta
import uuid
import random
from typing import List

from src.config import Config


class DataSimulator:
    def __init__(self):
        self.regions = Config.SCENIC_REGIONS
        self.complaint_tags = Config.COMPLAINT_TAGS
        self.departments = Config.RESPONSIBILITY_DEPARTMENTS
        self.followup_results = Config.FOLLOWUP_RESULTS
        random.seed(42)

    def generate_orders(self, start_date: date, end_date: date) -> pl.DataFrame:
        data = []
        current = start_date
        order_types = ["门票", "套票", "年卡", "演出", "导览"]

        while current <= end_date:
            for region in self.regions:
                daily_orders = random.randint(50, 300)
                for _ in range(daily_orders // 5):
                    visitor_count = random.randint(1, 5)
                    data.append({
                        "order_id": f"ORD{uuid.uuid4().hex[:12].upper()}",
                        "order_date": current,
                        "region": region,
                        "visitor_count": visitor_count,
                        "order_amount": round(random.uniform(50, 500) * visitor_count, 2),
                        "order_type": random.choice(order_types),
                        "create_time": datetime.combine(current, datetime.min.time()) + timedelta(hours=random.randint(8, 20))
                    })
            current += timedelta(days=1)

        return pl.DataFrame(data)

    def generate_camera_stats(self, start_date: date, end_date: date) -> pl.DataFrame:
        data = []
        current = start_date

        while current <= end_date:
            for region in self.regions:
                for hour in range(8, 22):
                    visitor_in = random.randint(50, 500)
                    data.append({
                        "stat_id": f"CAM{uuid.uuid4().hex[:10].upper()}",
                        "stat_date": current,
                        "region": region,
                        "hour": hour,
                        "visitor_in": visitor_in,
                        "visitor_out": max(0, visitor_in - random.randint(0, 50)),
                        "peak_visitors": random.randint(200, 1000),
                        "create_time": datetime.combine(current, datetime.min.time()) + timedelta(hours=hour)
                    })
            current += timedelta(days=1)

        return pl.DataFrame(data)

    def generate_merchant_transactions(self, start_date: date, end_date: date) -> pl.DataFrame:
        data = []
        current = start_date
        categories = ["餐饮", "纪念品", "游乐设施", "停车", "租赁", "其他"]
        merchants = {
            "东门区": ["东门小吃城", "东门礼品店", "东门停车场"],
            "西门区": ["西门餐厅", "西门纪念品", "西门便利店"],
            "南门区": ["南门美食街", "南门商店", "南门游乐"],
            "北门区": ["北门餐饮", "北门店面", "北门服务"],
            "核心景区": ["核心餐厅", "核心纪念品", "核心导览"]
        }

        while current <= end_date:
            for region in self.regions:
                for merchant in merchants[region]:
                    txn_count = random.randint(10, 100)
                    for _ in range(txn_count // 3):
                        data.append({
                            "txn_id": f"TXN{uuid.uuid4().hex[:12].upper()}",
                            "txn_date": current,
                            "region": region,
                            "merchant_id": f"M{hash(merchant) % 10000:04d}",
                            "merchant_name": merchant,
                            "amount": round(random.uniform(10, 500), 2),
                            "category": random.choice(categories),
                            "create_time": datetime.combine(current, datetime.min.time()) + timedelta(hours=random.randint(9, 21))
                        })
            current += timedelta(days=1)

        return pl.DataFrame(data)

    def generate_complaints(self, start_date: date, end_date: date) -> pl.DataFrame:
        data = []
        current = start_date
        sources = ["小程序", "现场投诉", "电话投诉", "官网留言", "第三方平台"]
        statuses = ["已关闭", "处理中", "待分配"]
        evidence_options = [
            [],
            ["evidence_photo1.jpg"],
            ["evidence_photo1.jpg", "evidence_screenshot.png"],
            ["evidence_video.mp4"],
            ["evidence_photo1.jpg", "evidence_photo2.jpg", "evidence_screenshot.png"]
        ]

        while current <= end_date:
            daily_complaints = random.randint(3, 15)
            for _ in range(daily_complaints):
                region = random.choice(self.regions)
                tag = random.choice(self.complaint_tags)
                status = random.choice(statuses)
                close_hours = None
                followup_result = None
                followup_date = None

                if status == "已关闭":
                    close_hours = round(random.uniform(0.5, 120), 1)
                    followup_result = random.choice(self.followup_results)
                    followup_date = current + timedelta(days=random.randint(0, 3))

                evidence = random.choice(evidence_options)

                data.append({
                    "complaint_id": f"CP{uuid.uuid4().hex[:10].upper()}",
                    "complaint_date": current,
                    "region": region,
                    "source": random.choice(sources),
                    "tag": tag,
                    "description": self._generate_description(tag),
                    "status": status,
                    "close_hours": close_hours,
                    "responsibility": random.choice(self.departments),
                    "followup_result": followup_result,
                    "followup_date": followup_date,
                    "order_id": f"ORD{uuid.uuid4().hex[:12].upper()}" if random.random() > 0.3 else None,
                    "evidence_files": evidence if evidence else None,
                    "create_time": datetime.combine(current, datetime.min.time()) + timedelta(hours=random.randint(8, 22)),
                    "update_time": datetime.now()
                })
            current += timedelta(days=1)

        return pl.DataFrame(data)

    def _generate_description(self, tag: str) -> str:
        descriptions = {
            "服务态度": "工作人员服务态度不好，没有耐心解答问题。",
            "卫生环境": "景区内卫生状况较差，垃圾清理不及时。",
            "设施故障": "游乐设施出现故障，影响游玩体验。",
            "排队时间": "排队时间太长，等待时间超过预期。",
            "收费问题": "收费标准不透明，存在乱收费现象。",
            "安全隐患": "存在安全隐患，需要及时处理。",
            "指引不清": "景区内标识不清晰，容易迷路。",
            "餐饮质量": "餐饮质量不好，价格偏高。",
            "停车问题": "停车位不足，停车秩序混乱。",
            "其他": "其他问题需要处理。"
        }
        return descriptions.get(tag, "游客投诉需要处理。")

    def initialize_all_data(self, days: int = 90):
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        from src.data.duckdb_manager import DuckDBManager
        db = DuckDBManager()

        orders = self.generate_orders(start_date, end_date)
        db.register_polars(orders, "mini_program_orders", if_exists="replace")

        cameras = self.generate_camera_stats(start_date, end_date)
        db.register_polars(cameras, "camera_statistics", if_exists="replace")

        merchants = self.generate_merchant_transactions(start_date, end_date)
        db.register_polars(merchants, "merchant_transactions", if_exists="replace")

        complaints = self.generate_complaints(start_date, end_date)
        db.register_polars(complaints, "complaints", if_exists="replace")

        return {
            "orders": len(orders),
            "cameras": len(cameras),
            "merchants": len(merchants),
            "complaints": len(complaints)
        }
