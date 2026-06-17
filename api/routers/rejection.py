from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.services.rejection_service import (
    get_rejection_list,
    add_remark,
    update_conclusion,
)
from api.schemas import RejectionRecordOut, RemarkCreate, ConclusionUpdate

router = APIRouter(prefix="/api/rejection", tags=["rejection"])


@router.get("/list", response_model=List[RejectionRecordOut])
async def rejection_list(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_rejection_list(db, start_date, end_date, status)


@router.post("/{id}/remark", response_model=RejectionRecordOut)
async def rejection_remark(
    id: int,
    data: RemarkCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await add_remark(db, id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Rejection record not found")
    return result


@router.put("/{id}/conclusion", response_model=RejectionRecordOut)
async def rejection_conclusion(
    id: int,
    data: ConclusionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await update_conclusion(db, id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Rejection record not found")
    return result
