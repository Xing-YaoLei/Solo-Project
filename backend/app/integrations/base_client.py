import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Awaitable, Callable, Generic, TypeVar
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.models.data_sync_log import DataSyncLog, SyncStatus, SyncType

logger = logging.getLogger(__name__)

T = TypeVar("T")


class IntegrationError(Exception):
    pass


class IntegrationConnectionError(IntegrationError):
    pass


class IntegrationAuthError(IntegrationError):
    pass


class IntegrationTimeoutError(IntegrationError):
    pass


class IntegrationConfig(BaseModel):
    model_config = ConfigDict(extra="allow")

    base_url: str | None = None
    api_key: str | None = None
    timeout: int = 30
    max_retries: int = 3
    retry_delay: int = 1
    use_mock: bool = False


class BaseIntegrationClient(ABC, Generic[T]):
    def __init__(
        self,
        config: IntegrationConfig | None = None,
        db: AsyncSession | None = None,
        source_system: str = "unknown",
    ) -> None:
        self.config = config or IntegrationConfig()
        self.db = db
        self.source_system = source_system
        self._sync_log: DataSyncLog | None = None

    @property
    def use_mock(self) -> bool:
        return self.config.use_mock or settings.DEBUG

    async def _retry(
        self,
        func: Callable[..., Awaitable[Any]],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        last_exception: Exception | None = None
        for attempt in range(self.config.max_retries):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=self.config.timeout,
                )
            except asyncio.TimeoutError as e:
                last_exception = IntegrationTimeoutError(
                    f"Request timed out after {self.config.timeout}s"
                )
                logger.warning(
                    f"Timeout on attempt {attempt + 1}/{self.config.max_retries}: {last_exception}"
                )
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Attempt {attempt + 1}/{self.config.max_retries} failed: {e}"
                )

            if attempt < self.config.max_retries - 1:
                await asyncio.sleep(self.config.retry_delay * (2**attempt))

        raise last_exception or IntegrationError("Unknown error")

    async def _start_sync_log(
        self,
        sync_type: SyncType = SyncType.INCREMENTAL,
    ) -> UUID:
        if not self.db:
            logger.warning("No database session provided, skipping sync log")
            return uuid4()

        sync_id = uuid4()
        self._sync_log = DataSyncLog(
            id=sync_id,
            source_system=self.source_system,
            sync_type=sync_type,
            status=SyncStatus.RUNNING,
        )
        self.db.add(self._sync_log)
        await self.db.commit()
        logger.info(f"Started sync log {sync_id} for {self.source_system}")
        return sync_id

    async def _update_sync_log(
        self,
        records_processed: int = 0,
        status: SyncStatus = SyncStatus.RUNNING,
        error_message: str | None = None,
    ) -> None:
        if not self._sync_log or not self.db:
            return

        self._sync_log.records_processed = records_processed
        self._sync_log.status = status
        if error_message:
            self._sync_log.error_message = error_message
        if status in (SyncStatus.COMPLETED, SyncStatus.FAILED):
            self._sync_log.completed_at = datetime.now()

        await self.db.commit()
        logger.info(
            f"Updated sync log {self._sync_log.id}: {status.value}, "
            f"records: {records_processed}"
        )

    async def _complete_sync(
        self,
        records_processed: int,
    ) -> dict[str, Any]:
        await self._update_sync_log(
            records_processed=records_processed,
            status=SyncStatus.COMPLETED,
        )
        return {
            "sync_id": str(self._sync_log.id) if self._sync_log else None,
            "status": "completed",
            "records_processed": records_processed,
            "source_system": self.source_system,
        }

    async def _fail_sync(
        self,
        error: Exception,
        records_processed: int = 0,
    ) -> None:
        await self._update_sync_log(
            records_processed=records_processed,
            status=SyncStatus.FAILED,
            error_message=str(error),
        )
        logger.error(
            f"Sync failed for {self.source_system}: {error}",
            exc_info=True,
        )
        raise IntegrationError(f"Sync failed: {error}") from error

    @abstractmethod
    async def fetch_data(self, *args: Any, **kwargs: Any) -> list[T]:
        pass

    @abstractmethod
    async def transform_data(self, raw_data: list[Any]) -> list[T]:
        pass

    @abstractmethod
    async def _generate_mock_data(self, *args: Any, **kwargs: Any) -> list[T]:
        pass
