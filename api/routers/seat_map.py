from typing import Optional
from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.schemas.common import ApiResponse
from api.schemas.seat import SeatData, AreaData

router = APIRouter()


@router.get("/layout", response_model=ApiResponse[list[SeatData]])
async def get_seat_layout(eventId: str = Query(default="event-001")):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT s.id, s.row_label, s.col_number, a.name, s.status, s.price, s.order_id
                FROM seats s
                JOIN areas a ON s.area_id = a.id
                WHERE s.event_id = :eid
                ORDER BY a.name, s.row_label, s.col_number
            """),
            {"eid": eventId},
        )
        rows = result.fetchall()

        seats = [
            SeatData(
                seatId=row[0],
                row=row[1],
                col=row[2],
                area=row[3],
                status=row[4],
                price=row[5],
                orderId=row[6],
            )
            for row in rows
        ]
        return ApiResponse(data=seats)


@router.get("/areas", response_model=ApiResponse[list[AreaData]])
async def get_areas(eventId: str = Query(default="event-001")):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT
                    a.id,
                    a.name,
                    a.total_seats,
                    COUNT(CASE WHEN s.status IN ('sold', 'used') THEN 1 END) AS sold_count,
                    ROUND(AVG(s.price), 2) AS avg_price,
                    COALESCE(SUM(CASE WHEN s.status IN ('sold', 'used') THEN s.price ELSE 0 END), 0) AS revenue
                FROM areas a
                JOIN seats s ON a.id = s.area_id
                WHERE a.event_id = :eid
                GROUP BY a.id, a.name, a.total_seats
            """),
            {"eid": eventId},
        )
        rows = result.fetchall()

        areas = [
            AreaData(
                areaId=row[0],
                areaName=row[1],
                totalSeats=row[2],
                soldSeats=row[3],
                avgPrice=row[4],
                revenue=round(row[5], 2),
            )
            for row in rows
        ]
        return ApiResponse(data=areas)


@router.get("/seats/{seatId}", response_model=ApiResponse[dict])
async def get_seat_detail(seatId: str):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT s.id, s.row_label, s.col_number, a.name, s.status, s.price, s.order_id
                FROM seats s
                JOIN areas a ON s.area_id = a.id
                WHERE s.id = :sid
            """),
            {"sid": seatId},
        )
        row = result.fetchone()

        if not row:
            return ApiResponse(code=404, message="座位不存在", data=None)

        seat = SeatData(
            seatId=row[0],
            row=row[1],
            col=row[2],
            area=row[3],
            status=row[4],
            price=row[5],
            orderId=row[6],
        )

        order_info = None
        if row[6]:
            order_result = await session.execute(
                text("""
                    SELECT o.id, o.order_no, o.buyer_name, o.amount, o.status, o.created_at
                    FROM orders o
                    WHERE o.id = :oid
                """),
                {"oid": row[6]},
            )
            order_row = order_result.fetchone()
            if order_row:
                order_info = {
                    "orderId": order_row[0],
                    "orderNo": order_row[1],
                    "buyerName": order_row[2],
                    "amount": order_row[3],
                    "status": order_row[4],
                    "createTime": order_row[5],
                }

        return ApiResponse(data={"seat": seat.model_dump(), "order": order_info})
