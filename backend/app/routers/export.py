import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.export import ExportProgress, ExportRequest, ExportResponse
from app.services.export_service import ExportService

router = APIRouter()


@router.post(
    "",
    response_model=ExportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建导出任务",
)
async def create_export(
    export_request: ExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportResponse:
    return await ExportService.create_export(db, export_request, current_user)


@router.get(
    "/{export_id}/progress",
    response_model=ExportProgress,
    status_code=status.HTTP_200_OK,
    summary="获取导出进度",
)
async def get_export_progress(
    export_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportProgress:
    progress = await ExportService.get_export_progress(export_id, current_user)
    return ExportProgress(**progress)


@router.get(
    "/download/{file_name}",
    status_code=status.HTTP_200_OK,
    summary="下载导出文件",
)
async def download_export(
    file_name: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> FileResponse:
    file_path = os.path.join(settings.EXPORT_DIR, file_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found",
        )

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/octet-stream",
    )


@router.get(
    "/cases",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
    summary="导出案件数据",
)
async def export_cases(
    start_date: str | None = None,
    end_date: str | None = None,
    format: str = "excel",
    hide_sensitive: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportResponse:
    from datetime import date
    from app.schemas.export import ExportFormat, ExportType

    export_request = ExportRequest(
        export_type=ExportType.CASES,
        format=ExportFormat(format),
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        hide_sensitive=hide_sensitive,
    )
    return await ExportService.create_export(db, export_request, current_user)


@router.get(
    "/invoices",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
    summary="导出单据数据",
)
async def export_invoices(
    start_date: str | None = None,
    end_date: str | None = None,
    format: str = "excel",
    hide_sensitive: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportResponse:
    from datetime import date
    from app.schemas.export import ExportFormat, ExportType

    export_request = ExportRequest(
        export_type=ExportType.INVOICES,
        format=ExportFormat(format),
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        hide_sensitive=hide_sensitive,
    )
    return await ExportService.create_export(db, export_request, current_user)


@router.get(
    "/payments",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
    summary="导出回款数据",
)
async def export_payments(
    start_date: str | None = None,
    end_date: str | None = None,
    format: str = "excel",
    hide_sensitive: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportResponse:
    from datetime import date
    from app.schemas.export import ExportFormat, ExportType

    export_request = ExportRequest(
        export_type=ExportType.PAYMENTS,
        format=ExportFormat(format),
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        hide_sensitive=hide_sensitive,
    )
    return await ExportService.create_export(db, export_request, current_user)


@router.get(
    "/full-report",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
    summary="导出完整报告",
)
async def export_full_report(
    start_date: str | None = None,
    end_date: str | None = None,
    format: str = "excel",
    hide_sensitive: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ExportResponse:
    from datetime import date
    from app.schemas.export import ExportFormat, ExportType

    export_request = ExportRequest(
        export_type=ExportType.FULL_REPORT,
        format=ExportFormat(format),
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        hide_sensitive=hide_sensitive,
    )
    return await ExportService.create_export(db, export_request, current_user)
