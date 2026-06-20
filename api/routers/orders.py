from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.services.report_engine import compute_sales_funnel
from api.schemas.common import ApiResponse, TrendDataPoint

router = APIRouter()


@router.get("/trend", response_model=ApiResponse[list[TrendDataPoint]])
async def get_order_trend(
    startDate: str = Query(default="2024-06-01"),
    endDate: str = Query(default="2024-06-30"),
    granularity: str = Query(default="day"),
):
    async with async_session() as session:
        if granularity == "week":
            date_expr = "strftime('%Y-W%W', created_at)"
        elif granularity == "month":
            date_expr = "strftime('%Y-%m', created_at)"
        else:
            date_expr = "DATE(created_at)"

        query = text(f"""
            SELECT {date_expr} AS period, COUNT(*) AS cnt
            FROM orders
            WHERE DATE(created_at) BETWEEN :start AND :end
            GROUP BY period
            ORDER BY period
        """)
        result = await session.execute(query, {"start": startDate, "end": endDate})
        rows = result.fetchall()

        points = [
            TrendDataPoint(date=row[0], value=float(row[1]), seriesName="订单量")
            for row in rows
        ]

        if not points:
            current = datetime.strptime(startDate, "%Y-%m-%d")
            end = datetime.strptime(endDate, "%Y-%m-%d")
            while current <= end:
                points.append(
                    TrendDataPoint(
                        date=current.strftime("%Y-%m-%d"),
                        value=0.0,
                        seriesName="订单量",
                    )
                )
                current += timedelta(days=1)

        return ApiResponse(data=points)


@router.get("/funnel", response_model=ApiResponse[dict])
async def get_sales_funnel():
    funnel = compute_sales_funnel()
    return ApiResponse(data=funnel)
