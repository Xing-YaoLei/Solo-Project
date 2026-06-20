from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from api.utils.duckdb_engine import get_duckdb_conn
from api.schemas.common import KPIData, TrendDataPoint
from api.schemas.verification import VerificationData


def compute_kpi() -> List[KPIData]:
    conn = get_duckdb_conn()

    result = conn.execute("""
        SELECT
            COUNT(*) AS total_orders,
            SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) AS verified_orders,
            SUM(CASE WHEN status IN ('paid', 'used') THEN 1 ELSE 0 END) AS benefit_eligible,
            SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_orders,
            COALESCE(SUM(CASE WHEN status IN ('paid', 'used') THEN amount ELSE 0 END), 0) AS total_revenue,
            SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) AS disputed_orders
        FROM orders
    """).fetchone()

    total_orders = result[0] or 0
    verified_orders = result[1] or 0
    benefit_eligible = result[2] or 0
    refunded_orders = result[3] or 0
    total_revenue = result[4] or 0
    disputed_orders = result[5] or 0

    benefit_result = conn.execute("""
        SELECT COUNT(*)
        FROM orders o
        JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
        WHERE o.status IN ('paid', 'used')
    """).fetchone()
    benefit_used = benefit_result[0] or 0

    total_benefit_result = conn.execute("""
        SELECT COUNT(*)
        FROM orders o
        JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
    """).fetchone()
    total_benefit_orders = total_benefit_result[0] or 1

    verification_rate = round(verified_orders / total_orders * 100, 2) if total_orders > 0 else 0
    benefit_usage_rate = round(benefit_used / total_benefit_orders * 100, 2) if total_benefit_orders > 0 else 0
    refund_rate = round(refunded_orders / total_orders * 100, 2) if total_orders > 0 else 0

    trend_result = conn.execute("""
        SELECT
            COALESCE(SUM(CASE WHEN DATE(created_at) >= CURRENT_DATE - 30 THEN 1 ELSE 0 END), 0) AS current_30,
            COALESCE(SUM(CASE WHEN DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31 THEN 1 ELSE 0 END), 0) AS prev_30
        FROM orders
    """).fetchone()
    current_30 = trend_result[0] or 0
    prev_30 = trend_result[1] or 1
    mom_change = round((current_30 - prev_30) / prev_30 * 100, 2)

    yoy_result = conn.execute("""
        SELECT
            COALESCE(SUM(CASE WHEN DATE(created_at) >= CURRENT_DATE - 365 THEN 1 ELSE 0 END), 0) AS current_yoy,
            COALESCE(SUM(CASE WHEN DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366 THEN 1 ELSE 0 END), 0) AS prev_yoy
        FROM orders
    """).fetchone()
    current_yoy = yoy_result[0] or 0
    prev_yoy = yoy_result[1] or 1
    yoy_change = round((current_yoy - prev_yoy) / prev_yoy * 100, 2)

    kpis = [
        KPIData(
            id="total-sales",
            name="总销售量",
            value=float(total_orders),
            unit="单",
            trend="up" if mom_change > 0 else "down" if mom_change < 0 else "stable",
            changePercent=mom_change,
            yoyChange=yoy_change,
            momChange=mom_change,
        ),
        KPIData(
            id="total-revenue",
            name="总收入",
            value=round(float(total_revenue), 2),
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
    return kpis


def compute_trend_analysis(
    start_date: str,
    end_date: str,
    category: Optional[str] = None,
) -> List[TrendDataPoint]:
    conn = get_duckdb_conn()

    result = conn.execute("""
        SELECT
            DATE(o.created_at) AS date,
            COUNT(*) AS cnt
        FROM orders o
        JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
        WHERE o.status IN ('paid', 'used')
          AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY DATE(o.created_at)
        ORDER BY date
    """, (start_date, end_date)).fetchall()

    points = []
    for row in result:
        series = category if category else "赞助权益使用"
        points.append(
            TrendDataPoint(date=str(row[0]), value=float(row[1]), seriesName=series)
        )

    if not points:
        current = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        while current <= end:
            series = category if category else "赞助权益使用"
            points.append(
                TrendDataPoint(date=current.strftime("%Y-%m-%d"), value=0.0, seriesName=series)
            )
            current += timedelta(days=1)

    return points


def compute_verification_efficiency(
    dimension: str,
    start_date: str,
    end_date: str,
    caliber_version: str,
) -> List[VerificationData]:
    conn = get_duckdb_conn()

    if dimension == "date":
        group_expr = "DATE(o.created_at)"
    elif dimension == "area":
        group_expr = "a.name"
    elif dimension == "ticket_type":
        group_expr = "tt.name"
    else:
        group_expr = "DATE(o.created_at)"

    query = f"""
        SELECT
            ? AS dimension,
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
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY dim_value
        ORDER BY dim_value
    """

    result = conn.execute(query, (dimension, start_date, end_date)).fetchall()

    avg_time_result = conn.execute("""
        SELECT COALESCE(AVG(
            EXTRACT(EPOCH FROM (o.verified_at - o.created_at)) / 3600
        ), 0)
        FROM orders o
        WHERE o.status = 'used' AND DATE(o.created_at) BETWEEN ? AND ?
    """, (start_date, end_date)).fetchone()
    avg_time = round(float(avg_time_result[0] or 0), 2)

    data = []
    for row in result:
        total = row[2] or 0
        verified = row[3] or 0
        vrate = row[4] or 0

        data.append(
            VerificationData(
                dimension=row[0],
                dimensionValue=str(row[1]),
                totalTickets=int(total),
                verifiedTickets=int(verified),
                verificationRate=float(vrate),
                avgVerifyTime=avg_time if total > 0 and verified > 0 else 0.0,
                caliberVersion=caliber_version,
            )
        )

    return data


def compute_yoy_mom(metrics: str, compare_type: str) -> Dict[str, Any]:
    conn = get_duckdb_conn()

    if metrics == "total_sales":
        current_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) >= CURRENT_DATE - 30
        """).fetchone()
        previous_result = conn.execute("""
            SELECT COUNT(*) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
    elif metrics == "revenue":
        current_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) >= CURRENT_DATE - 30 AND status IN ('paid', 'used')
        """).fetchone()
        previous_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
              AND status IN ('paid', 'used')
        """).fetchone()
    elif metrics == "verification_rate":
        current_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status = 'used'
        """).fetchone()
        total_result = conn.execute("""
            SELECT COUNT(*) FROM orders
        """).fetchone()
        current_val = float(current_result[0] or 0)
        total_val = float(total_result[0] or 1)
        previous_val = total_val

        change = round((current_val - previous_val) / previous_val * 100, 2) if previous_val > 0 else 0

        return {
            "metrics": metrics,
            "compareType": compare_type,
            "currentValue": current_val,
            "previousValue": previous_val,
            "changePercent": change,
        }
    else:
        current_result = conn.execute("""
            SELECT COUNT(*) FROM orders
        """).fetchone()
        previous_result = conn.execute("""
            SELECT COUNT(*) FROM orders
        """).fetchone()

    current_val = float(current_result[0] or 0)
    previous_val = float(previous_result[0] or 1)

    change = round((current_val - previous_val) / previous_val * 100, 2) if previous_val > 0 else 0

    return {
        "metrics": metrics,
        "compareType": compare_type,
        "currentValue": current_val,
        "previousValue": previous_val,
        "changePercent": change,
    }


def compute_sales_funnel() -> List[Dict[str, Any]]:
    conn = get_duckdb_conn()

    result = conn.execute("""
        SELECT stage, count, conversion_rate
        FROM funnel_agg
        ORDER BY
            CASE stage
                WHEN 'browse' THEN 1
                WHEN 'order' THEN 2
                WHEN 'pay' THEN 3
                WHEN 'verify' THEN 4
            END
    """).fetchall()

    if not result:
        browse_result = conn.execute("SELECT COUNT(*) FROM orders").fetchone()
        browse_count = browse_result[0] or 0

        order_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status != 'pending'").fetchone()
        order_count = order_result[0] or 0

        pay_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status IN ('paid', 'used')").fetchone()
        pay_count = pay_result[0] or 0

        verify_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status = 'used'").fetchone()
        verify_count = verify_result[0] or 0

        funnel = [
            {"stage": "browse", "label": "浏览", "count": browse_count},
            {"stage": "order", "label": "下单", "count": order_count},
            {"stage": "pay", "label": "支付", "count": pay_count},
            {"stage": "verify", "label": "核销", "count": verify_count},
        ]
    else:
        labels = {"browse": "浏览", "order": "下单", "pay": "支付", "verify": "核销"}
        funnel = [
            {"stage": row[0], "label": labels.get(row[0], row[0]), "count": int(row[1])}
            for row in result
        ]

    return funnel
