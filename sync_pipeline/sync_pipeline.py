from typing import Optional, Dict, Any, Callable
from datetime import datetime
from dataclasses import dataclass, field
import polars as pl
import logging

from data_layer import DataRepository
from config import DataSource, SyncStatus, DATA_SOURCE_LABELS

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    batch_id: str
    data_source: str
    status: str
    total_count: int = 0
    success_count: int = 0
    failed_count: int = 0
    error_message: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.now)
    finished_at: Optional[datetime] = None
    details: Dict[str, Any] = field(default_factory=dict)

    @property
    def duration_seconds(self) -> float:
        if self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return 0.0

    @property
    def data_source_label(self) -> str:
        return DATA_SOURCE_LABELS.get(self.data_source, self.data_source)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "batch_id": self.batch_id,
            "data_source": self.data_source,
            "data_source_label": DATA_SOURCE_LABELS.get(self.data_source, self.data_source),
            "status": self.status,
            "total_count": self.total_count,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
            "error_message": self.error_message,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "duration_seconds": self.duration_seconds,
            "details": self.details,
        }


class BaseSync:
    def __init__(self, repository: Optional[DataRepository] = None):
        self.repository = repository or DataRepository()

    def data_source(self) -> str:
        raise NotImplementedError

    def extract(self) -> pl.DataFrame:
        raise NotImplementedError

    def load(self, df: pl.DataFrame, batch_id: str) -> Dict[str, int]:
        raise NotImplementedError

    def run(self) -> SyncResult:
        batch_id = self.repository.create_sync_batch(self.data_source())
        result = SyncResult(
            batch_id=batch_id,
            data_source=self.data_source(),
            status=SyncStatus.RUNNING,
        )

        try:
            df = self.extract()
            result.total_count = df.height

            load_result = self.load(df, batch_id)
            result.success_count = load_result.get("success", 0)
            result.failed_count = load_result.get("failed", 0)
            result.details = load_result

            if result.failed_count == 0:
                result.status = SyncStatus.SUCCESS
            elif result.success_count == 0:
                result.status = SyncStatus.FAILED
            else:
                result.status = SyncStatus.PARTIAL

            self.repository.update_sync_batch(
                batch_id=batch_id,
                status=result.status,
                success_count=result.success_count,
                failed_count=result.failed_count,
            )

        except Exception as e:
            logger.exception(f"Sync failed for {self.data_source()}: {e}")
            result.status = SyncStatus.FAILED
            result.error_message = str(e)
            self.repository.update_sync_batch(
                batch_id=batch_id,
                status=SyncStatus.FAILED,
                error_message=str(e),
            )

        result.finished_at = datetime.now()
        return result


class SyncPipeline:
    def __init__(self, repository: Optional[DataRepository] = None):
        self.repository = repository or DataRepository()
        self.syncs: Dict[str, BaseSync] = {}

    def register(self, sync: BaseSync):
        self.syncs[sync.data_source()] = sync

    def run_all(self, refresh_confirmations: bool = True) -> Dict[str, SyncResult]:
        results = {}
        for data_source, sync in self.syncs.items():
            results[data_source] = sync.run()

        if refresh_confirmations:
            try:
                self.repository.refresh_project_confirmations()
            except Exception as e:
                logger.warning(f"Failed to refresh project confirmations: {e}")

        return results

    def run_single(self, data_source: str, refresh_confirmations: bool = True) -> Optional[SyncResult]:
        sync = self.syncs.get(data_source)
        if not sync:
            return None

        result = sync.run()

        if refresh_confirmations:
            try:
                self.repository.refresh_project_confirmations()
            except Exception as e:
                logger.warning(f"Failed to refresh project confirmations: {e}")

        return result

    def get_sync_history(self, data_source: Optional[str] = None, limit: int = 20) -> pl.DataFrame:
        return self.repository.get_sync_batches(data_source=data_source, limit=limit)
