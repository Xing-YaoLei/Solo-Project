import uuid
import random
from datetime import datetime, timedelta
from typing import List, Tuple

import duckdb

from .base_pipeline import BasePipeline
from ..database import get_duckdb

AREA_CODES = ["A01", "A02", "B01", "B02", "C01", "C02", "D01", "D02", "VIP1", "VIP2"]
TICKET_TYPES = ["普通票", "VIP票", "早鸟票", "学生票", "团体票", "赞助票"]
PRICE_MAP = {"普通票": 299, "VIP票": 888, "早鸟票": 199, "学生票": 150, "团体票": 250, "赞助票": 0}
SURNAMES = ["张", "李", "王", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高"]
NAMES = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
STATUSES = ["已支付", "已核销", "已退票", "待支付"]
STATUS_WEIGHTS = [30, 50, 8, 12]


def _rand_uuid() -> str:
    return str(uuid.uuid4())


def _rand_phone() -> str:
    return f"1{random.choice(['3','5','7','8','9'])}{''.join([str(random.randint(0,9)) for _ in range(9)])}"


def _rand_name() -> str:
    return random.choice(SURNAMES) + random.choice(NAMES)


class RegistrationPipeline(BasePipeline):
    task_code = "REG_SYNC"

    def extract(self) -> List[Tuple]:
        count = random.randint(500, 2000)
        now = datetime.now()
        rows: List[Tuple] = []
        for _ in range(count):
            days_ago = random.randint(0, 30)
            created = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            tt = random.choices(TICKET_TYPES, weights=[40, 10, 15, 15, 12, 8])[0]
            area = random.choice(AREA_CODES)
            status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
            rows.append((
                _rand_uuid(), _rand_name(), _rand_phone(), tt,
                float(PRICE_MAP[tt]), area, status, created
            ))
        self.log_info("extract", "模拟从 PostgreSQL 报名表抽取数据", f"抽取窗口: 近30天增量, 条数: {count}")
        if random.random() < 0.1:
            self.log_warn("extract", "存在重复报名记录已跳过", f"跳过条数: {random.randint(1, 20)}")
        return rows

    def transform(self, data: List[Tuple]) -> List[Tuple]:
        transformed: List[Tuple] = []
        invalid = 0
        for row in data:
            rid, name, phone, tt, amount, area, status, created = row
            if not name or not phone or len(phone) != 11:
                invalid += 1
                continue
            transformed.append((rid, name, phone, tt, amount, area, status, created))
        if invalid > 0:
            self.log_warn("transform", "数据校验过滤无效记录", f"无效数: {invalid}, 通过率: {round(len(transformed)/max(len(data),1)*100, 2)}%")
        self.log_info("transform", "报名数据转换与清洗完成", f"字段映射: 姓名/手机号/票种/金额/区域/状态/时间")
        return transformed

    def load(self, data: List[Tuple]) -> int:
        count = len(data)
        if count > 0:
            with get_duckdb() as conn:
                conn.executemany(
                    "INSERT OR IGNORE INTO registrations (id, name, phone, ticket_type, amount, area_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    data
                )
        self.log_info("load", "写入 DuckDB registrations 表", f"UPSERT模式, 目标条数: {count}")

        if getattr(self, '_pg_available', False) and count > 0:
            try:
                from ..repositories.pg_repository import Registration as PgRegistration
                from ..repositories.pg_repository import get_pg_session
                with get_pg_session() as session:
                    if session:
                        pg_records = []
                        for row in data:
                            rid, name, phone, tt, amount, area, status, created = row
                            pg_records.append(PgRegistration(
                                id=str(rid),
                                name=name,
                                phone=phone,
                                ticket_type=tt,
                                amount=amount,
                                area_code=area,
                                status=status,
                                created_at=created
                            ))
                        session.bulk_save_objects(pg_records)
                        session.commit()
                        self.log_info("load", "写入 PostgreSQL registrations 表", f"双写完成, 条数: {count}")
            except Exception as e:
                self.log_warn("load", "写入 PostgreSQL registrations 失败", str(e))

        return count
