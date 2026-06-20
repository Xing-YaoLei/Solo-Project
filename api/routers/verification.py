from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.services.report_engine import compute_verification_efficiency
from api.schemas.common import ApiResponse
from api.schemas.verification import VerificationData, CaliberVersion

router = APIRouter()


@router.get("/efficiency", response_model=ApiResponse[list[VerificationData]])
async def get_verification_efficiency(
    dimension: str = Query(default="date"),
    startDate: str = Query(default="2024-06-01"),
    endDate: str = Query(default="2024-06-30"),
    caliberVersion: str = Query(default="v2.0"),
):
    data = compute_verification_efficiency(dimension, startDate, endDate, caliberVersion)
    return ApiResponse(data=data)


@router.get("/calibers", response_model=ApiResponse[list[CaliberVersion]])
async def get_caliber_versions():
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT version, name, formula, description, effective_date, change_reason
                FROM caliber_versions
                ORDER BY effective_date DESC
            """)
        )
        rows = result.fetchall()

        calibers = [
            CaliberVersion(
                version=row[0],
                name=row[1],
                formula=row[2],
                description=row[3],
                effectiveDate=row[4],
                changeReason=row[5],
            )
            for row in rows
        ]
        return ApiResponse(data=calibers)
