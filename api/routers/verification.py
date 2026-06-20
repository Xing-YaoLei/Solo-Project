from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
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
    async with async_session() as session:
        if dimension == "date":
            group_expr = "DATE(o.created_at)"
        elif dimension == "area":
            group_expr = "a.name"
        elif dimension == "ticket_type":
            group_expr = "tt.name"
        else:
            group_expr = "DATE(o.created_at)"

        query = text(f"""
            SELECT
                :dim AS dimension,
                {group_expr} AS dim_value,
                COUNT(o.id) AS total_tickets,
                COUNT(CASE WHEN o.status = 'used' THEN 1 END) AS verified_tickets,
                CASE WHEN COUNT(o.id) > 0
                     THEN ROUND(COUNT(CASE WHEN o.status = 'used' THEN 1 END) * 100.0 / COUNT(o.id), 2)
                     ELSE 0 END AS vrate
            FROM orders o
            LEFT JOIN seats s ON o.seat_id = s.id
            LEFT JOIN areas a ON s.area_id = a.id
            LEFT JOIN ticket_types tt ON o.ticket_type_id = tt.id
            WHERE DATE(o.created_at) BETWEEN :start AND :end
            GROUP BY dim_value
            ORDER BY dim_value
        """)
        result = await session.execute(
            query, {"dim": dimension, "start": startDate, "end": endDate}
        )
        rows = result.fetchall()

        data = []
        for row in rows:
            avg_time = 0.0
            if row[2] > 0 and row[3] > 0:
                time_result = await session.execute(
                    text("""
                        SELECT AVG(
                            CAST((julianday(o.verified_at) - julianday(o.created_at)) * 24 AS REAL)
                        )
                        FROM orders o
                        WHERE o.status = 'used' AND DATE(o.created_at) BETWEEN :start AND :end
                    """),
                    {"start": startDate, "end": endDate},
                )
                avg_time = round(time_result.scalar() or 0, 2)

            data.append(
                VerificationData(
                    dimension=row[0],
                    dimensionValue=str(row[1]),
                    totalTickets=row[2],
                    verifiedTickets=row[3],
                    verificationRate=row[4],
                    avgVerifyTime=avg_time,
                    caliberVersion=caliberVersion,
                )
            )

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
