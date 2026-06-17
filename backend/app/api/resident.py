from fastapi import APIRouter, Query
from app.services.resident_service import ResidentService

router = APIRouter(prefix="/residents", tags=["老人档案"])


@router.get("")
async def get_residents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    care_level: str = None
):
    data = ResidentService.get_residents(page, page_size, care_level)
    return {"code": 0, "message": "success", "data": data}


@router.get("/bed-utilization")
async def get_bed_utilization():
    data = ResidentService.get_bed_utilization()
    return {"code": 0, "message": "success", "data": data}


@router.get("/care-level-distribution")
async def get_care_level_distribution():
    data = ResidentService.get_care_level_distribution()
    return {"code": 0, "message": "success", "data": data}


@router.get("/age-distribution")
async def get_age_distribution():
    data = ResidentService.get_age_distribution()
    return {"code": 0, "message": "success", "data": data}


@router.get("/disease-distribution")
async def get_disease_distribution():
    data = ResidentService.get_disease_distribution()
    return {"code": 0, "message": "success", "data": data}
