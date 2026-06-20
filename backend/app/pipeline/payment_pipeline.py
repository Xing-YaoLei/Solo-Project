import uuid
import random
from datetime import datetime, timedelta
from typing import List, Tuple

import duckdb

from .base_pipeline import BasePipeline
from ..database import get_duckdb

PAYMENT_CHANNELS = ["微信", "支付宝", "银行卡", "对公转账"]


def _rand_uuid() -> str:
    return str(uuid.uuid4())


class PaymentPipeline(BasePipeline):
    task_code = "PAY_SYNC"

    def extract(self) -> List[Tuple]:
        with get_duckdb() as conn:
            reg_rows = conn.execute(
                "SELECT id, amount, status, created_at FROM registrations WHERE status != '待支付' ORDER BY created_at DESC LIMIT ?",
                [random.randint(400, 1800)]
            ).fetchall()

        now = datetime.now()
        rows: List[Tuple] = []
        for reg in reg_rows:
            reg_id, amount, status, created = reg
            pid = _rand_uuid()
            pay_status = "已退款" if status == "已退票" else "已支付"
            paid_at = created + timedelta(minutes=random.randint(1, 120))
            if paid_at > now:
                paid_at = now - timedelta(minutes=random.randint(5, 120))
            rows.append((
                pid, str(reg_id), f"ORD{random.randint(10000000, 99999999)}",
                float(amount), random.choice(PAYMENT_CHANNELS), pay_status, paid_at
            ))
        self.log_info("extract", "模拟从 PostgreSQL 支付流水表抽取", f"关联报名表, 条数: {len(rows)}")
        if random.random() < 0.08:
            self.log_warn("extract", "部分支付记录超时已重试", f"重试批次: {random.randint(1, 3)}")
        return rows

    def transform(self, data: List[Tuple]) -> List[Tuple]:
        transformed: List[Tuple] = []
        duplicates = 0
        seen_order = set()
        for row in data:
            pid, reg_id, order_no, amount, channel, status, paid_at = row
            if order_no in seen_order:
                duplicates += 1
                continue
            seen_order.add(order_no)
            if amount <= 0:
                amount = 0.01
            transformed.append((pid, reg_id, order_no, amount, channel, status, paid_at))
        if duplicates > 0:
            self.log_warn("transform", "检测到重复订单号已去重", f"去重数: {duplicates}")
        self.log_info("transform", "支付数据转换完成", f"字段标准化: 订单号/金额精度/支付渠道枚举")
        return transformed

    def load(self, data: List[Tuple]) -> int:
        with get_duckdb() as conn:
            conn.executemany(
                "INSERT OR IGNORE INTO payments (id, registration_id, order_no, amount, channel, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                data
            )
            count = len(data)
            self.log_info("load", "写入 DuckDB payments 表", f"批次提交, 目标条数: {count}")

        if getattr(self, '_pg_available', False):
            try:
                from ..repositories.pg_repository import Payment as PgPayment
                from ..repositories.pg_repository import get_pg_session
                with get_pg_session() as session:
                    if session:
                        pg_records = []
                        for row in data:
                            pid, reg_id, order_no, amount, channel, status, paid_at = row
                            pg_records.append(PgPayment(
                                id=str(pid),
                                registration_id=str(reg_id),
                                order_no=order_no,
                                amount=amount,
                                channel=channel,
                                status=status,
                                paid_at=paid_at
                            ))
                        session.bulk_save_objects(pg_records)
                        session.commit()
                        self.log_info("load", "写入 PostgreSQL payments 表", f"双写完成, 条数: {count}")
            except Exception as e:
                self.log_warn("load", "写入 PostgreSQL payments 失败", str(e))

        return count
