from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.services.drilldown_service import (
    get_assessments,
    get_prescriptions,
    get_training_completion,
    get_calendar,
    get_equipment_usage,
)
from api.schemas import (
    AssessmentScaleOut,
    TrainingPrescriptionOut,
    TrainingCompletionStats,
    CalendarDay,
    EquipmentRecordOut,
)

router = APIRouter(prefix="/api/drilldown", tags=["drilldown"])


@router.get("/assessments", response_model=List[AssessmentScaleOut])
async def list_assessments(
    patient_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_assessments(db, patient_id, start_date, end_date)


@router.get("/prescriptions", response_model=List[TrainingPrescriptionOut])
async def list_prescriptions(
    patient_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    therapist: Optional[str] = Query(None),
    completion_rate_min: Optional[float] = Query(None),
    completion_rate_max: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_prescriptions(db, patient_id, start_date, end_date, therapist, completion_rate_min, completion_rate_max)


@router.get("/training-completion", response_model=List[TrainingCompletionStats])
async def training_completion(
    department_id: Optional[int] = Query(None),
    therapist_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_training_completion(db, department_id, therapist_id, start_date, end_date)


@router.get("/calendar", response_model=List[CalendarDay])
async def calendar_view(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    patient_id: Optional[int] = Query(None),
    prescription_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_calendar(db, month, year, patient_id, prescription_id)


@router.get("/equipment", response_model=List[EquipmentRecordOut])
async def equipment_usage(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    session_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_equipment_usage(db, start_date, end_date, session_id)
