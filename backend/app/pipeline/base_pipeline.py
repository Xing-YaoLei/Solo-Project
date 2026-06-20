import time
import random
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, List, Optional

import duckdb

from ..database import get_duckdb
from ..utils.logger import logger
from ..repositories.pg_repository import is_pg_enabled, get_pg_session, create_tables_if_not_exists


TASK_NAMES = {
    "REG_SYNC": "报名表同步",
    "PAY_SYNC": "支付流水同步",
    "GATE_SYNC": "闸机记录同步"
}
SOURCE_TYPES = {
    "REG_SYNC": "PostgreSQL",
    "PAY_SYNC": "PostgreSQL",
    "GATE_SYNC": "闸机API"
}


class BasePipeline(ABC):
    task_code: str = ""
    task_name: str = ""
    source_type: str = ""

    def __init__(self) -> None:
        if not self.task_code:
            raise ValueError("task_code must be defined in subclass")
        self.task_name = TASK_NAMES.get(self.task_code, self.task_code)
        self.source_type = SOURCE_TYPES.get(self.task_code, "unknown")
        self._log_id_counter: int = 0
        self._pg_available = is_pg_enabled()
        if self._pg_available:
            create_tables_if_not_exists()
            logger.info(f"[{self.task_name}] PostgreSQL 双写已启用")

    def run(self) -> List[dict]:
        all_logs: List[dict] = []
        logger.info(f"[{self.task_name}] Pipeline started")

        self._ensure_task_exists()
        self._update_task_status("running", None)

        try:
            extract_start = time.time()
            self.log_info("extract", "开始数据抽取", f"数据源类型: {self.source_type}")
            extracted_data = self.extract()
            extract_cost = round(time.time() - extract_start, 3)
            self.log_info(
                "extract",
                "数据抽取完成",
                f"抽取记录数: {len(extracted_data) if hasattr(extracted_data, '__len__') else 'N/A'}, 耗时: {extract_cost}s"
            )
            all_logs.append({"step": "extract", "data": extracted_data, "cost": extract_cost})

            transform_start = time.time()
            self.log_info("transform", "开始数据转换", "字段校验与格式转换")
            transformed_data = self.transform(extracted_data)
            transform_cost = round(time.time() - transform_start, 3)
            self.log_info(
                "transform",
                "数据转换完成",
                f"转换记录数: {len(transformed_data) if hasattr(transformed_data, '__len__') else 'N/A'}, 耗时: {transform_cost}s"
            )
            all_logs.append({"step": "transform", "data": transformed_data, "cost": transform_cost})

            load_start = time.time()
            target = "DuckDB" + (" + PostgreSQL" if self._pg_available else "")
            self.log_info("load", "开始数据加载", f"写入目标表 ({target})")
            loaded_count = self.load(transformed_data)
            load_cost = round(time.time() - load_start, 3)
            self.log_info("load", "数据加载完成", f"写入记录数: {loaded_count}, 耗时: {load_cost}s")
            all_logs.append({"step": "load", "data": loaded_count, "cost": load_cost})

            total_cost = round(extract_cost + transform_cost + load_cost, 3)
            self.log_info("run", f"[{self.task_name}] Pipeline 完成", f"总耗时: {total_cost}s")
            self._update_task_status("success", loaded_count if isinstance(loaded_count, int) else None)
            logger.info(f"[{self.task_name}] Pipeline completed in {total_cost}s")

        except Exception as e:
            error_msg = str(e)
            self.log_error("run", f"[{self.task_name}] Pipeline 执行失败", error_msg)
            self._update_task_status("failed", None)
            logger.error(f"[{self.task_name}] Pipeline failed: {error_msg}")
            raise

        return all_logs

    @abstractmethod
    def extract(self) -> Any:
        ...

    @abstractmethod
    def transform(self, data: Any) -> Any:
        ...

    @abstractmethod
    def load(self, data: Any) -> int:
        ...

    def log_info(self, step: str, message: str, detail: Optional[str] = None) -> None:
        self._write_log("INFO", f"[{step.upper()}] {message}", detail)

    def log_warn(self, step: str, message: str, detail: Optional[str] = None) -> None:
        self._write_log("WARN", f"[{step.upper()}] {message}", detail)

    def log_error(self, step: str, message: str, detail: Optional[str] = None) -> None:
        self._write_log("ERROR", f"[{step.upper()}] {message}", detail)

    def _write_log(self, level: str, message: str, detail: Optional[str] = None) -> None:
        log_id = str(uuid.uuid4())
        now = datetime.now()
        with get_duckdb() as conn:
            conn.execute(
                "INSERT INTO sync_logs (id, task_code, level, message, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [log_id, self.task_code, level, message, detail, now]
            )
            self._log_id_counter += 1

        if self._pg_available:
            try:
                from ..repositories.pg_repository import SyncLog as PgSyncLog
                with get_pg_session() as session:
                    if session:
                        pg_log = PgSyncLog(
                            id=log_id,
                            task_code=self.task_code,
                            level=level,
                            message=message,
                            detail=detail,
                            created_at=now
                        )
                        session.add(pg_log)
                        session.commit()
            except Exception as e:
                logger.warning(f"[{self.task_name}] 写入 PostgreSQL sync_logs 失败: {e}")

    def _ensure_task_exists(self) -> None:
        with get_duckdb() as conn:
            row = conn.execute(
                "SELECT task_code FROM sync_tasks WHERE task_code = ?",
                [self.task_code]
            ).fetchone()
            if not row:
                now = datetime.now()
                conn.execute(
                    "INSERT INTO sync_tasks (task_code, task_name, source_type, last_sync_time, last_sync_count, status) VALUES (?, ?, ?, ?, ?, ?)",
                    [self.task_code, self.task_name, self.source_type, now, 0, "idle"]
                )

        if self._pg_available:
            try:
                from ..repositories.pg_repository import SyncTask as PgSyncTask
                with get_pg_session() as session:
                    if session:
                        pg_task = session.query(PgSyncTask).filter_by(task_code=self.task_code).first()
                        if not pg_task:
                            now = datetime.now()
                            pg_task = PgSyncTask(
                                task_code=self.task_code,
                                task_name=self.task_name,
                                source_type=self.source_type,
                                last_sync_time=now,
                                last_sync_count=0,
                                status="idle"
                            )
                            session.add(pg_task)
                            session.commit()
            except Exception as e:
                logger.warning(f"[{self.task_name}] 写入 PostgreSQL sync_tasks 失败: {e}")

    def _update_task_status(self, status: str, last_count: Optional[int]) -> None:
        with get_duckdb() as conn:
            now = datetime.now()
            if last_count is not None:
                conn.execute(
                    "UPDATE sync_tasks SET status = ?, last_sync_time = ?, last_sync_count = ? WHERE task_code = ?",
                    [status, now, last_count, self.task_code]
                )
            else:
                conn.execute(
                    "UPDATE sync_tasks SET status = ?, last_sync_time = ? WHERE task_code = ?",
                    [status, now, self.task_code]
                )

        if self._pg_available:
            try:
                from ..repositories.pg_repository import SyncTask as PgSyncTask
                with get_pg_session() as session:
                    if session:
                        now = datetime.now()
                        pg_task = session.query(PgSyncTask).filter_by(task_code=self.task_code).first()
                        if pg_task:
                            pg_task.status = status
                            pg_task.last_sync_time = now
                            if last_count is not None:
                                pg_task.last_sync_count = last_count
                            session.commit()
            except Exception as e:
                logger.warning(f"[{self.task_name}] 更新 PostgreSQL sync_tasks 失败: {e}")
