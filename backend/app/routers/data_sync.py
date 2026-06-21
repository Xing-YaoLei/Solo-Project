from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import get_current_user
from app.models.data_sync_log import SyncType
from app.schemas.auth import CurrentUser
from app.services.data_sync_service import DataSyncService

router = APIRouter()


@router.post(
    "/email",
    status_code=status.HTTP_200_OK,
    summary="从邮件同步数据",
)
async def sync_from_email(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    import os
    import tempfile

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".eml") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        result = await DataSyncService.sync_from_email(db, tmp_path, current_user)

        os.unlink(tmp_path)

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process email: {str(e)}",
        )


@router.post(
    "/duckdb",
    status_code=status.HTTP_200_OK,
    summary="同步数据到DuckDB",
)
async def sync_to_duckdb(
    sync_type: str = "incremental",
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    sync_type_enum = SyncType(sync_type)
    return await DataSyncService.sync_to_duckdb(db, sync_type_enum, current_user)


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="获取同步历史",
)
async def get_sync_history(
    limit: int = 20,
    source_system: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    return await DataSyncService.get_sync_history(db, current_user, limit, source_system)


@router.post(
    "/link-email/{email_attachment_id}/invoice/{invoice_id}",
    status_code=status.HTTP_200_OK,
    summary="关联邮件附件到单据",
)
async def link_email_to_invoice(
    email_attachment_id: UUID,
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return await DataSyncService.link_email_to_invoice(
        db,
        email_attachment_id,
        invoice_id,
        current_user,
    )


@router.post(
    "/process-attachments",
    status_code=status.HTTP_200_OK,
    summary="处理邮件附件",
)
async def process_email_attachments(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return await DataSyncService.process_email_attachments(db, current_user)


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="获取数据同步状态",
)
async def get_sync_status(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    history = await DataSyncService.get_sync_history(db, current_user, limit=5)

    latest_sync = history[0] if history else None

    return {
        "latest_sync": latest_sync,
        "total_syncs": len(history),
        "successful_syncs": sum(1 for h in history if h["status"] == "completed"),
        "failed_syncs": sum(1 for h in history if h["status"] == "failed"),
    }
