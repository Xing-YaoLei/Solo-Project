from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SyncStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SyncType(StrEnum):
    FULL = "full"
    INCREMENTAL = "incremental"
    DELTA = "delta"


class DataSyncLog(Base):
    __tablename__ = "data_sync_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    source_system: Mapped[str] = mapped_column(String(100), nullable=False)
    sync_type: Mapped[SyncType] = mapped_column(String(50), nullable=False)
    records_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[SyncStatus] = mapped_column(String(20), nullable=False, default=SyncStatus.PENDING)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
