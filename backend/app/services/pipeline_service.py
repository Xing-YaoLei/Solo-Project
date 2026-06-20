from typing import List, Optional

from ..repositories import duckdb_repository
from ..models.schemas import PipelineStatus, PageResponse, SyncLog
from ..pipeline.registration_pipeline import RegistrationPipeline
from ..pipeline.payment_pipeline import PaymentPipeline
from ..pipeline.gate_pipeline import GatePipeline
from ..utils.logger import logger


PIPELINE_MAP = {
    "REG_SYNC": RegistrationPipeline,
    "PAY_SYNC": PaymentPipeline,
    "GATE_SYNC": GatePipeline,
}


def get_pipeline_status() -> List[PipelineStatus]:
    logger.info("Fetching pipeline status")
    result = duckdb_repository.pipeline_status()
    logger.info(f"Pipeline status fetched: {len(result)} tasks")
    return result


def get_sync_logs(
    task_code: Optional[str] = None,
    level: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> PageResponse[SyncLog]:
    logger.info(f"Fetching sync logs: task_code={task_code}, level={level}, page={page}, page_size={page_size}")
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 200:
        page_size = 200
    result = duckdb_repository.sync_logs(
        task_code=task_code, level=level, page=page, page_size=page_size
    )
    logger.info(f"Sync logs fetched: {len(result.items)} items, total={result.page_info.total}")
    return result


def run_pipeline(task_code: str) -> List[SyncLog]:
    logger.info(f"Running pipeline: {task_code}")
    pipeline_cls = PIPELINE_MAP.get(task_code)
    if pipeline_cls is None:
        raise ValueError(f"Unknown task_code: {task_code}")
    pipeline = pipeline_cls()
    pipeline.run()
    logs = duckdb_repository.run_pipeline_sync(task_code)
    logger.info(f"Pipeline {task_code} completed, {len(logs)} logs generated")
    return logs
