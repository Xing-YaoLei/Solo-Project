from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..db.session import get_db
from ..models.models import User, RoleEnum
from ..core.deps import require_roles
from ..services.data_ingestion import DataIngestionService

router = APIRouter(prefix="/data", tags=["数据接入"])


@router.post("/refresh/miniapp-orders")
async def refresh_miniapp_orders(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ADMIN))
):
    count = await DataIngestionService.fetch_miniapp_orders(db, start_date, end_date)
    return {"status": "success", "records_imported": count, "source": "miniapp_orders"}


@router.post("/refresh/merchant-transactions")
async def refresh_merchant_transactions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ADMIN))
):
    count = await DataIngestionService.fetch_merchant_transactions(db, start_date, end_date)
    return {"status": "success", "records_imported": count, "source": "merchant_transactions"}


@router.post("/refresh/camera-statistics")
async def refresh_camera_statistics(
    schedule_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ADMIN))
):
    count = await DataIngestionService.fetch_camera_statistics(db, schedule_id)
    return {"status": "success", "records_imported": count, "source": "camera_statistics"}


@router.post("/refresh/all")
async def refresh_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ADMIN))
):
    miniapp_count = await DataIngestionService.fetch_miniapp_orders(db)
    merchant_count = await DataIngestionService.fetch_merchant_transactions(db)
    camera_count = await DataIngestionService.fetch_camera_statistics(db)
    return {
        "status": "success",
        "total_imported": miniapp_count + merchant_count + camera_count,
        "details": {
            "miniapp_orders": miniapp_count,
            "merchant_transactions": merchant_count,
            "camera_statistics": camera_count
        }
    }
