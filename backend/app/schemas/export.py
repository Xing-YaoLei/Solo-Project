from datetime import date, datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ExportFormat(StrEnum):
    EXCEL = "excel"
    CSV = "csv"
    PDF = "pdf"
    PARQUET = "parquet"


class ExportType(StrEnum):
    CASES = "cases"
    INVOICES = "invoices"
    PAYMENTS = "payments"
    APPROVALS = "approvals"
    FULL_REPORT = "full_report"


class ExportRequest(BaseModel):
    export_type: ExportType
    format: ExportFormat = ExportFormat.EXCEL
    start_date: date | None = None
    end_date: date | None = None
    case_ids: list[UUID] | None = None
    include_attachments: bool = False
    hide_sensitive: bool = True


class ExportResponse(BaseModel):
    export_id: UUID
    export_type: ExportType
    format: ExportFormat
    status: str
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    file_name: str | None = None
    file_size: int | None = None
    download_url: str | None = None
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ExportProgress(BaseModel):
    export_id: UUID
    status: str
    progress: int = Field(ge=0, le=100)
    message: str | None = None
