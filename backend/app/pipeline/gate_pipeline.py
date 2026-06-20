import uuid
import random
from datetime import datetime, timedelta
from typing import List, Tuple

import duckdb

from .base_pipeline import BasePipeline
from ..database import get_duckdb

GATE_NOS = ["G01", "G02", "G03", "G04", "G05", "G06"]
GRID_STATUSES = ["通过", "通过", "通过", "通过", "通过", "通过", "通过", "通过", "通过", "异常"]


def _rand_uuid() -> str:
    return str(uuid.uuid4())


class GatePipeline(BasePipeline):
    task_code = "GATE_SYNC"

    def extract(self) -> List[Tuple]:
        with get_duckdb() as conn:
            ticket_rows = conn.execute("""
                SELECT t.id, t.checkin_code, t.checked_at
                FROM tickets t
                WHERE t.is_checked = true AND t.checked_at IS NOT NULL
                ORDER BY t.checked_at DESC
                LIMIT ?
            """, [random.randint(300, 1500)]).fetchall()

        rows: List[Tuple] = []
        for tid, checkin_code, checked_at in ticket_rows:
            gate = random.choice(GATE_NOS)
            pass_time = checked_at + timedelta(seconds=random.randint(-300, 300))
            status = random.choice(GRID_STATUSES)
            rows.append((
                _rand_uuid(), str(tid), gate, checkin_code, pass_time, status
            ))
        self.log_info("extract", "模拟从闸机API实时拉取过闸记录", f"通道数: 6, 拉取条数: {len(rows)}")
        if random.random() < 0.12:
            self.log_warn("extract", "闸机API限流，已分批补拉", f"补拉批次: {random.randint(1, 4)}")
        return rows

    def transform(self, data: List[Tuple]) -> List[Tuple]:
        transformed: List[Tuple] = []
        anomalies = 0
        now = datetime.now()
        for row in data:
            gid, tid, gate, cc, pass_time, status = row
            if pass_time > now:
                anomalies += 1
                continue
            if not cc or not cc.startswith("CK"):
                anomalies += 1
                continue
            transformed.append((gid, tid, gate, cc, pass_time, status))
        if anomalies > 0:
            self.log_warn("transform", "异常过闸记录已剔除", f"异常数: {anomalies}, 原因: 时间异常/核销码格式")
        self.log_info("transform", "闸机数据转换完成", f"时间校验/格式校验/异常过滤")
        return transformed

    def load(self, data: List[Tuple]) -> int:
        with get_duckdb() as conn:
            conn.executemany(
                "INSERT OR IGNORE INTO gate_records (id, ticket_id, gate_no, checkin_code, pass_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                data
            )
            count = len(data)
            self.log_info("load", "写入 DuckDB gate_records 表", f"追加模式, 目标条数: {count}")
        return count
