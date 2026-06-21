from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import polars as pl
import json
import os

from config.settings import DATA_SOURCES, SYNC_DELAY_THRESHOLD_HOURS
from src.data.minio_storage import minio_storage


@dataclass
class SyncStep:
    step_id: str
    step_name: str
    status: str = "pending"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    record_count: int = 0
    error_message: Optional[str] = None

    @property
    def name(self) -> str:
        return self.step_name

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_id": self.step_id,
            "step_name": self.step_name,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "record_count": self.record_count,
            "error_message": self.error_message,
            "duration_seconds": (
                (self.end_time - self.start_time).total_seconds()
                if self.start_time and self.end_time
                else None
            ),
        }


@dataclass
class DataSourcePipeline:
    source_id: str
    source_name: str
    description: str
    steps: List[SyncStep] = field(default_factory=list)
    last_sync_time: Optional[datetime] = None
    is_delayed: bool = False
    delay_hours: float = 0.0

    def add_step(self, step: SyncStep):
        self.steps.append(step)

    def check_delay(self, current_time: Optional[datetime] = None):
        if self.last_sync_time is None:
            self.is_delayed = True
            self.delay_hours = float("inf")
            return
        if current_time is None:
            current_time = datetime.now()
        delta = current_time - self.last_sync_time
        self.delay_hours = delta.total_seconds() / 3600
        self.is_delayed = self.delay_hours > SYNC_DELAY_THRESHOLD_HOURS

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "description": self.description,
            "steps": [s.to_dict() for s in self.steps],
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "is_delayed": self.is_delayed,
            "delay_hours": round(self.delay_hours, 2),
            "overall_status": self._get_overall_status(),
        }

    def _get_overall_status(self) -> str:
        if not self.steps:
            return "unknown"
        statuses = [s.status for s in self.steps]
        if "error" in statuses:
            return "error"
        if "running" in statuses:
            return "running"
        if all(s == "completed" for s in statuses):
            return "completed"
        if all(s == "pending" for s in statuses):
            return "pending"
        return "partial"


class DataPipelineManager:
    def __init__(self):
        self.pipelines: Dict[str, DataSourcePipeline] = {}
        self._init_pipelines()

    def _init_pipelines(self):
        for source_id, source_info in DATA_SOURCES.items():
            pipeline = DataSourcePipeline(
                source_id=source_id,
                source_name=source_info["name"],
                description=source_info["description"],
            )
            self._add_pipeline_steps(pipeline, source_id)
            self.pipelines[source_id] = pipeline

    def _add_pipeline_steps(self, pipeline: DataSourcePipeline, source_id: str):
        if source_id == "payment":
            pipeline.add_step(SyncStep("payment_1", "连接财务系统"))
            pipeline.add_step(SyncStep("payment_2", "拉取收款流水原始数据"))
            pipeline.add_step(SyncStep("payment_3", "数据清洗与去重"))
            pipeline.add_step(SyncStep("payment_4", "关联案件编号"))
            pipeline.add_step(SyncStep("payment_5", "写入数据湖"))
        elif source_id == "calendar":
            pipeline.add_step(SyncStep("calendar_1", "连接日历服务"))
            pipeline.add_step(SyncStep("calendar_2", "同步律师日程数据"))
            pipeline.add_step(SyncStep("calendar_3", "提取排期与截止日期"))
            pipeline.add_step(SyncStep("calendar_4", "匹配案件文书"))
            pipeline.add_step(SyncStep("calendar_5", "写入数据湖"))
        elif source_id == "case":
            pipeline.add_step(SyncStep("case_1", "连接案件管理系统"))
            pipeline.add_step(SyncStep("case_2", "拉取案件基础信息"))
            pipeline.add_step(SyncStep("case_3", "拉取文书归档记录"))
            pipeline.add_step(SyncStep("case_4", "拉取审核意见与互动记录"))
            pipeline.add_step(SyncStep("case_5", "数据合并与质量校验"))
            pipeline.add_step(SyncStep("case_6", "写入数据湖"))

    def get_pipeline(self, source_id: str) -> Optional[DataSourcePipeline]:
        return self.pipelines.get(source_id)

    def get_all_pipelines(self) -> List[DataSourcePipeline]:
        return list(self.pipelines.values())

    def get_pipeline_status(self) -> List[Dict[str, Any]]:
        return [p.to_dict() for p in self.pipelines.values()]

    def get_all_pipelines_status(self) -> List[Dict[str, Any]]:
        result = []
        for p in self.pipelines.values():
            pipeline_dict = p.to_dict()
            pipeline_dict["steps"] = p.steps
            result.append(pipeline_dict)
        return result

    def set_step_status(
        self,
        source_id: str,
        step_id: str,
        status: str,
        record_count: int = 0,
        error_message: Optional[str] = None,
    ):
        pipeline = self.pipelines.get(source_id)
        if not pipeline:
            return
        for step in pipeline.steps:
            if step.step_id == step_id:
                step.status = status
                if status == "running" and step.start_time is None:
                    step.start_time = datetime.now()
                if status in ["completed", "error"]:
                    step.end_time = datetime.now()
                    step.record_count = record_count
                    step.error_message = error_message
                break

    def set_last_sync_time(self, source_id: str, sync_time: datetime):
        pipeline = self.pipelines.get(source_id)
        if pipeline:
            pipeline.last_sync_time = sync_time
            pipeline.check_delay()

    def load_mock_status(self):
        base_time = datetime.now()
        self.set_last_sync_time("case", base_time - timedelta(hours=2))
        self.set_last_sync_time("calendar", base_time - timedelta(hours=5))
        self.set_last_sync_time("payment", base_time - timedelta(hours=30))

        for step in self.pipelines["case"].steps:
            step.status = "completed"
            step.start_time = base_time - timedelta(hours=2, minutes=30)
            step.end_time = base_time - timedelta(hours=2, minutes=5)
            step.record_count = 1000 + hash(step.step_id) % 500

        for step in self.pipelines["calendar"].steps:
            step.status = "completed"
            step.start_time = base_time - timedelta(hours=5, minutes=20)
            step.end_time = base_time - timedelta(hours=5)
            step.record_count = 500 + hash(step.step_id) % 300

        pay_steps = self.pipelines["payment"].steps
        for i, step in enumerate(pay_steps):
            if i < 2:
                step.status = "completed"
                step.start_time = base_time - timedelta(hours=30)
                step.end_time = base_time - timedelta(hours=29, minutes=30)
                step.record_count = 800 + hash(step.step_id) % 200
            elif i == 2:
                step.status = "running"
                step.start_time = base_time - timedelta(minutes=45)
            else:
                step.status = "pending"

        for p in self.pipelines.values():
            p.check_delay(base_time)


pipeline_manager = DataPipelineManager()
