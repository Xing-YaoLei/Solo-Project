from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.services.rejection_service import (
    get_rejection_list,
    add_remark,
    update_conclusion,
    get_rejection_reasons_distribution,
    upsert_remark_task,
)
from api.schemas import RejectionRecordOut, RemarkCreate, ConclusionUpdate, RemarkTaskOut, RemarkTaskUpsert

router = APIRouter(prefix="/api/rejection", tags=["rejection"])


@router.get("/list", response_model=List[RejectionRecordOut])
async def rejection_list(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_rejection_list(db, start_date, end_date, status, department)


@router.get("/reasons", response_model=List[dict])
async def rejection_reasons(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_rejection_reasons_distribution(db, start_date, end_date, status, department)


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


@router.post("/remark-task", response_model=RemarkTaskOut)
async def remark_task_upsert(
    data: RemarkTaskUpsert,
    db: AsyncSession = Depends(get_db),
):
    result = await upsert_remark_task(db, data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create/update remark task")
    return result
