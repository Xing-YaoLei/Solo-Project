from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.schemas import AnomalyFlagResponse
from app.services.anomaly_service import detect_anomalies, get_anomaly_flags

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("", response_model=List[AnomalyFlagResponse])
async def list_anomalies(
    session: AsyncSession = Depends(get_pg_session),
):
    flags = await get_anomaly_flags(session)
    return flags


@router.get("/complaint/{complaint_id}", response_model=List[AnomalyFlagResponse])
async def get_complaint_anomalies(
    complaint_id: int,
    session: AsyncSession = Depends(get_pg_session),
):
    flags = await get_anomaly_flags(session, complaint_id=complaint_id)
    return flags


@router.post("/detect", response_model=List[AnomalyFlagResponse])
async def trigger_detect(
    session: AsyncSession = Depends(get_pg_session),
):
    flags = await detect_anomalies(session)
    return flags
