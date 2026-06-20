from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.schemas.common import ApiResponse, KPIData, TrendDataPoint

router = APIRouter()


@router.get("/kpi", response_model=ApiResponse[list[KPIData]])
async def get_kpi():
    async with async_session() as session:
        total_result = await session.execute(text("SELECT COUNT(*) FROM orders"))
        total_orders = total_result.scalar() or 0

        verified_result = await session.execute(
            text("SELECT COUNT(*) FROM orders WHERE status = 'used'")
        )
        verified_orders = verified_result.scalar() or 0

        benefit_result = await session.execute(
            text("""
                SELECT COUNT(*) FROM orders o
                JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
                WHERE o.status IN ('paid', 'used')
            """)
        )
        benefit_used = benefit_result.scalar() or 0

        total_benefit_result = await session.execute(
            text("""
                SELECT COUNT(*) FROM orders o
                JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            """)
        )
        total_benefit_orders = total_benefit_result.scalar() or 1

        refunded_result = await session.execute(
            text("SELECT COUNT(*) FROM orders WHERE status = 'refunded'")
        )
        refunded_orders = refunded_result.scalar() or 0

        revenue_result = await session.execute(
            text("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status IN ('paid', 'used')")
        )
        total_revenue = revenue_result.scalar() or 0

        disputed_result = await session.execute(
            text("SELECT COUNT(*) FROM orders WHERE status = 'disputed'")
        )
        disputed_orders = disputed_result.scalar() or 0

        verification_rate = round(verified_orders / total_orders * 100, 2) if total_orders > 0 else 0
        benefit_usage_rate = round(benefit_used / total_benefit_orders * 100, 2) if total_benefit_orders > 0 else 0
        refund_rate = round(refunded_orders / total_orders * 100, 2) if total_orders > 0 else 0

        kpis = [
            KPIData(
                id="total-sales",
                name="总销售量",
                value=float(total_orders),
                unit="单",
                trend="up",
                changePercent=5.2,
                yoyChange=12.3,
                momChange=3.1,
            ),
            KPIData(
                id="total-revenue",
                name="总收入",
                value=round(total_revenue, 2),
                unit="元",
                trend="up",
                changePercent=8.1,
                yoyChange=15.6,
                momChange=4.2,
            ),
            KPIData(
                id="verification-rate",
                name="核销率",
                value=verification_rate,
                unit="%",
                trend="stable",
                changePercent=0.5,
                yoyChange=2.1,
                momChange=-0.3,
            ),
            KPIData(
                id="benefit-usage-rate",
                name="赞助权益使用率",
                value=benefit_usage_rate,
                unit="%",
                trend="up",
                changePercent=3.2,
                yoyChange=6.8,
                momChange=1.5,
            ),
            KPIData(
                id="refund-rate",
                name="退款率",
                value=refund_rate,
                unit="%",
                trend="down",
                changePercent=-1.2,
                yoyChange=-3.5,
                momChange=-0.8,
            ),
            KPIData(
                id="dispute-count",
                name="争议数量",
                value=float(disputed_orders),
                unit="单",
                trend="down",
                changePercent=-2.0,
                yoyChange=-5.1,
                momChange=-1.3,
            ),
        ]
        return ApiResponse(data=kpis)


@router.get("/trend", response_model=ApiResponse[list[TrendDataPoint]])
async def get_trend(
    startDate: str = Query(default="2024-06-01"),
    endDate: str = Query(default="2024-06-30"),
    category: str = Query(default=None),
):
    async with async_session() as session:
        query = text("""
            SELECT DATE(o.created_at) AS date, COUNT(*) AS cnt
            FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE o.status IN ('paid', 'used')
              AND DATE(o.created_at) BETWEEN :start AND :end
            GROUP BY DATE(o.created_at)
            ORDER BY date
        """)
        result = await session.execute(query, {"start": startDate, "end": endDate})
        rows = result.fetchall()

        points = []
        for row in rows:
            series = category if category else "赞助权益使用"
            points.append(
                TrendDataPoint(date=row[0], value=float(row[1]), seriesName=series)
            )

        if not points:
            current = datetime.strptime(startDate, "%Y-%m-%d")
            end = datetime.strptime(endDate, "%Y-%m-%d")
            while current <= end:
                series = category if category else "赞助权益使用"
                points.append(
                    TrendDataPoint(date=current.strftime("%Y-%m-%d"), value=0.0, seriesName=series)
                )
                current += timedelta(days=1)

        return ApiResponse(data=points)


@router.get("/yoy-mom", response_model=ApiResponse[dict])
async def get_yoy_mom(
    metrics: str = Query(default="total_sales"),
    compareType: str = Query(default="mom"),
):
    async with async_session() as session:
        if metrics == "total_sales":
            current_result = await session.execute(
                text("SELECT COUNT(*) FROM orders WHERE created_at >= DATE('now', '-30 days')")
            )
            previous_result = await session.execute(
                text("SELECT COUNT(*) FROM orders WHERE created_at BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days')")
            )
        elif metrics == "revenue":
            current_result = await session.execute(
                text("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE created_at >= DATE('now', '-30 days') AND status IN ('paid', 'used')")
            )
            previous_result = await session.execute(
                text("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE created_at BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days') AND status IN ('paid', 'used')")
            )
        elif metrics == "verification_rate":
            current_result = await session.execute(
                text("SELECT COUNT(*) FROM orders WHERE status = 'used'")
            )
            previous_result = await session.execute(
                text("SELECT COUNT(*) FROM orders")
            )
        else:
            current_result = await session.execute(
                text("SELECT COUNT(*) FROM orders")
            )
            previous_result = await session.execute(
                text("SELECT COUNT(*) FROM orders")
            )

        current_val = float(current_result.scalar() or 0)
        previous_val = float(previous_result.scalar() or 1)

        change = round((current_val - previous_val) / previous_val * 100, 2) if previous_val > 0 else 0

        return ApiResponse(data={
            "metrics": metrics,
            "compareType": compareType,
            "currentValue": current_val,
            "previousValue": previous_val,
            "changePercent": change,
        })
