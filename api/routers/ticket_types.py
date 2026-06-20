from fastapi import APIRouter
from sqlalchemy import text

from api.utils.database import async_session
from api.schemas.common import ApiResponse
from api.schemas.ticket import TicketType

router = APIRouter()


@router.get("/", response_model=ApiResponse[list[TicketType]])
async def list_ticket_types():
    async with async_session() as session:
        result = await session.execute(text("""
            SELECT
                tt.id,
                tt.name,
                tt.price,
                COALESCE(sales.vol, 0) AS sales_volume,
                COALESCE(sales.rev, 0) AS revenue,
                COALESCE(verify.vrate, 0) AS verification_rate
            FROM ticket_types tt
            LEFT JOIN (
                SELECT ticket_type_id, COUNT(*) AS vol, SUM(amount) AS rev
                FROM orders WHERE status IN ('paid', 'used')
                GROUP BY ticket_type_id
            ) sales ON tt.id = sales.ticket_type_id
            LEFT JOIN (
                SELECT o.ticket_type_id,
                       CASE WHEN COUNT(o.id) > 0
                            THEN ROUND(COUNT(CASE WHEN o.status = 'used' THEN 1 END) * 100.0 / COUNT(o.id), 2)
                            ELSE 0 END AS vrate
                FROM orders o
                GROUP BY o.ticket_type_id
            ) verify ON tt.id = verify.ticket_type_id
        """))
        rows = result.fetchall()

        ticket_types = []
        for row in rows:
            benefits_result = await session.execute(
                text("SELECT name FROM ticket_benefits WHERE ticket_type_id = :tid"),
                {"tid": row[0]},
            )
            benefits = [b[0] for b in benefits_result.fetchall()]

            ticket_types.append(
                TicketType(
                    id=row[0],
                    name=row[1],
                    price=row[2],
                    benefits=benefits,
                    salesVolume=row[3],
                    revenue=round(row[4], 2),
                    verificationRate=row[5],
                )
            )

        return ApiResponse(data=ticket_types)


@router.get("/{id}", response_model=ApiResponse[TicketType])
async def get_ticket_type(id: str):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT
                    tt.id,
                    tt.name,
                    tt.price,
                    COALESCE(sales.vol, 0) AS sales_volume,
                    COALESCE(sales.rev, 0) AS revenue,
                    COALESCE(verify.vrate, 0) AS verification_rate
                FROM ticket_types tt
                LEFT JOIN (
                    SELECT ticket_type_id, COUNT(*) AS vol, SUM(amount) AS rev
                    FROM orders WHERE status IN ('paid', 'used')
                    GROUP BY ticket_type_id
                ) sales ON tt.id = sales.ticket_type_id
                LEFT JOIN (
                    SELECT o.ticket_type_id,
                           CASE WHEN COUNT(o.id) > 0
                                THEN ROUND(COUNT(CASE WHEN o.status = 'used' THEN 1 END) * 100.0 / COUNT(o.id), 2)
                                ELSE 0 END AS vrate
                    FROM orders o
                    GROUP BY o.ticket_type_id
                ) verify ON tt.id = verify.ticket_type_id
                WHERE tt.id = :id
            """),
            {"id": id},
        )
        row = result.fetchone()

        if not row:
            return ApiResponse(code=404, message="票种不存在", data=None)

        benefits_result = await session.execute(
            text("SELECT name FROM ticket_benefits WHERE ticket_type_id = :tid"),
            {"tid": id},
        )
        benefits = [b[0] for b in benefits_result.fetchall()]

        data = TicketType(
            id=row[0],
            name=row[1],
            price=row[2],
            benefits=benefits,
            salesVolume=row[3],
            revenue=round(row[4], 2),
            verificationRate=row[5],
        )
        return ApiResponse(data=data)
