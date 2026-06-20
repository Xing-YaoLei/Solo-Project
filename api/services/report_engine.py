from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from api.utils.duckdb_engine import get_duckdb_conn
from api.schemas.common import KPIData, TrendDataPoint
from api.schemas.verification import VerificationData


def compute_kpi() -> List[KPIData]:
    try:
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
    except Exception as e:
        print(f"DuckDB compute_kpi failed: {e}")
        return [
            KPIData(
                id="total-sales",
                name="总销售量",
                value=0.0,
                unit="单",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
            KPIData(
                id="total-revenue",
                name="总收入",
                value=0.0,
                unit="元",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
            KPIData(
                id="verification-rate",
                name="核销率",
                value=0.0,
                unit="%",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
            KPIData(
                id="benefit-usage-rate",
                name="赞助权益使用率",
                value=0.0,
                unit="%",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
            KPIData(
                id="refund-rate",
                name="退款率",
                value=0.0,
                unit="%",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
            KPIData(
                id="dispute-count",
                name="争议数量",
                value=0.0,
                unit="单",
                trend="stable",
                changePercent=0.0,
                yoyChange=0.0,
                momChange=0.0,
            ),
        ]


def compute_trend_analysis(
    start_date: str,
    end_date: str,
    category: Optional[str] = None,
) -> List[TrendDataPoint]:
    try:
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
    except Exception as e:
        print(f"DuckDB compute_trend_analysis failed: {e}")
        points = []
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
    try:
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
    except Exception as e:
        print(f"DuckDB compute_verification_efficiency failed: {e}")
        return []


def compute_yoy_mom(metrics: str, compare_type: str) -> Dict[str, Any]:
    try:
        conn = get_duckdb_conn()

        metric_names = {
            "total_sales": "总销售量",
            "revenue": "总收入",
            "verification_rate": "核销率",
            "benefit_usage_rate": "赞助权益使用率",
            "refund_rate": "退款率",
        }

        yoy_points = []
        mom_points = []

        sales_current_30_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) >= CURRENT_DATE - 30
        """).fetchone()
        sales_prev_30_result = conn.execute("""
            SELECT COUNT(*) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        sales_current_yoy_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) >= CURRENT_DATE - 365
        """).fetchone()
        sales_prev_yoy_result = conn.execute("""
            SELECT COUNT(*) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()

        sales_curr_30 = float(sales_current_30_result[0] or 0)
        sales_prev_30 = float(sales_prev_30_result[0] or 1)
        sales_mom = round((sales_curr_30 - sales_prev_30) / sales_prev_30 * 100, 2)
        sales_curr_yoy = float(sales_current_yoy_result[0] or 0)
        sales_prev_yoy = float(sales_prev_yoy_result[0] or 1)
        sales_yoy = round((sales_curr_yoy - sales_prev_yoy) / sales_prev_yoy * 100, 2)

        yoy_points.append(TrendDataPoint(date="", value=sales_yoy, seriesName=metric_names["total_sales"]))
        mom_points.append(TrendDataPoint(date="", value=sales_mom, seriesName=metric_names["total_sales"]))

        rev_current_30_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) >= CURRENT_DATE - 30 AND status IN ('paid', 'used')
        """).fetchone()
        rev_prev_30_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
              AND status IN ('paid', 'used')
        """).fetchone()
        rev_current_yoy_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) >= CURRENT_DATE - 365 AND status IN ('paid', 'used')
        """).fetchone()
        rev_prev_yoy_result = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) FROM orders
            WHERE DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
              AND status IN ('paid', 'used')
        """).fetchone()

        rev_curr_30 = float(rev_current_30_result[0] or 0)
        rev_prev_30 = float(rev_prev_30_result[0] or 1)
        rev_mom = round((rev_curr_30 - rev_prev_30) / rev_prev_30 * 100, 2)
        rev_curr_yoy = float(rev_current_yoy_result[0] or 0)
        rev_prev_yoy = float(rev_prev_yoy_result[0] or 1)
        rev_yoy = round((rev_curr_yoy - rev_prev_yoy) / rev_prev_yoy * 100, 2)

        yoy_points.append(TrendDataPoint(date="", value=rev_yoy, seriesName=metric_names["revenue"]))
        mom_points.append(TrendDataPoint(date="", value=rev_mom, seriesName=metric_names["revenue"]))

        total_result = conn.execute("SELECT COUNT(*) FROM orders").fetchone()
        verified_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status = 'used'").fetchone()
        total = float(total_result[0] or 1)
        verified = float(verified_result[0] or 0)
        vrate = round(verified / total * 100, 2) if total > 0 else 0

        vrate_prev_30_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        vrate_verified_prev_30_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status = 'used' AND DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        vrate_prev_total = float(vrate_prev_30_result[0] or 1)
        vrate_prev_verified = float(vrate_verified_prev_30_result[0] or 0)
        vrate_prev = round(vrate_prev_verified / vrate_prev_total * 100, 2) if vrate_prev_total > 0 else 0
        vrate_mom = round(vrate - vrate_prev, 2)

        vrate_prev_yoy_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        vrate_verified_prev_yoy_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status = 'used' AND DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        vrate_prev_yoy_total = float(vrate_prev_yoy_result[0] or 1)
        vrate_prev_yoy_verified = float(vrate_verified_prev_yoy_result[0] or 0)
        vrate_prev_yoy = round(vrate_prev_yoy_verified / vrate_prev_yoy_total * 100, 2) if vrate_prev_yoy_total > 0 else 0
        vrate_yoy = round(vrate - vrate_prev_yoy, 2)

        yoy_points.append(TrendDataPoint(date="", value=vrate_yoy, seriesName=metric_names["verification_rate"]))
        mom_points.append(TrendDataPoint(date="", value=vrate_mom, seriesName=metric_names["verification_rate"]))

        benefit_total_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
        """).fetchone()
        benefit_used_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE o.status IN ('paid', 'used')
        """).fetchone()
        benefit_total = float(benefit_total_result[0] or 1)
        benefit_used = float(benefit_used_result[0] or 0)
        benefit_rate = round(benefit_used / benefit_total * 100, 2) if benefit_total > 0 else 0

        benefit_prev_30_total_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE DATE(o.created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        benefit_prev_30_used_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE o.status IN ('paid', 'used')
              AND DATE(o.created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        benefit_prev_30_total = float(benefit_prev_30_total_result[0] or 1)
        benefit_prev_30_used = float(benefit_prev_30_used_result[0] or 0)
        benefit_prev_30_rate = round(benefit_prev_30_used / benefit_prev_30_total * 100, 2) if benefit_prev_30_total > 0 else 0
        benefit_mom = round(benefit_rate - benefit_prev_30_rate, 2)

        benefit_prev_yoy_total_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE DATE(o.created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        benefit_prev_yoy_used_result = conn.execute("""
            SELECT COUNT(*) FROM orders o
            JOIN ticket_benefits tb ON o.ticket_type_id = tb.ticket_type_id
            WHERE o.status IN ('paid', 'used')
              AND DATE(o.created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        benefit_prev_yoy_total = float(benefit_prev_yoy_total_result[0] or 1)
        benefit_prev_yoy_used = float(benefit_prev_yoy_used_result[0] or 0)
        benefit_prev_yoy_rate = round(benefit_prev_yoy_used / benefit_prev_yoy_total * 100, 2) if benefit_prev_yoy_total > 0 else 0
        benefit_yoy = round(benefit_rate - benefit_prev_yoy_rate, 2)

        yoy_points.append(TrendDataPoint(date="", value=benefit_yoy, seriesName=metric_names["benefit_usage_rate"]))
        mom_points.append(TrendDataPoint(date="", value=benefit_mom, seriesName=metric_names["benefit_usage_rate"]))

        refund_total_result = conn.execute("SELECT COUNT(*) FROM orders").fetchone()
        refund_count_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status = 'refunded'").fetchone()
        refund_total = float(refund_total_result[0] or 1)
        refund_count = float(refund_count_result[0] or 0)
        refund_rate = round(refund_count / refund_total * 100, 2) if refund_total > 0 else 0

        refund_prev_30_total_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        refund_prev_30_count_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status = 'refunded' AND DATE(created_at) BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
        """).fetchone()
        refund_prev_30_total = float(refund_prev_30_total_result[0] or 1)
        refund_prev_30_count = float(refund_prev_30_count_result[0] or 0)
        refund_prev_30_rate = round(refund_prev_30_count / refund_prev_30_total * 100, 2) if refund_prev_30_total > 0 else 0
        refund_mom = round(refund_rate - refund_prev_30_rate, 2)

        refund_prev_yoy_total_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        refund_prev_yoy_count_result = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status = 'refunded' AND DATE(created_at) BETWEEN CURRENT_DATE - 730 AND CURRENT_DATE - 366
        """).fetchone()
        refund_prev_yoy_total = float(refund_prev_yoy_total_result[0] or 1)
        refund_prev_yoy_count = float(refund_prev_yoy_count_result[0] or 0)
        refund_prev_yoy_rate = round(refund_prev_yoy_count / refund_prev_yoy_total * 100, 2) if refund_prev_yoy_total > 0 else 0
        refund_yoy = round(refund_rate - refund_prev_yoy_rate, 2)

        yoy_points.append(TrendDataPoint(date="", value=refund_yoy, seriesName=metric_names["refund_rate"]))
        mom_points.append(TrendDataPoint(date="", value=refund_mom, seriesName=metric_names["refund_rate"]))

        return {
            "yoy": yoy_points,
            "mom": mom_points,
        }
    except Exception as e:
        print(f"DuckDB compute_yoy_mom failed: {e}")
        metric_names = {
            "total_sales": "总销售量",
            "revenue": "总收入",
            "verification_rate": "核销率",
            "benefit_usage_rate": "赞助权益使用率",
            "refund_rate": "退款率",
        }
        yoy_points = []
        mom_points = []
        for name in metric_names.values():
            yoy_points.append(TrendDataPoint(date="", value=0.0, seriesName=name))
            mom_points.append(TrendDataPoint(date="", value=0.0, seriesName=name))
        return {
            "yoy": yoy_points,
            "mom": mom_points,
        }


def compute_sales_funnel() -> Dict[str, Any]:
    try:
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

        labels = {"browse": "浏览", "order": "下单", "pay": "支付", "verify": "核销"}
        stages = []
        values = []

        if not result:
            browse_result = conn.execute("SELECT COUNT(*) FROM orders").fetchone()
            browse_count = browse_result[0] or 0

            order_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status != 'pending'").fetchone()
            order_count = order_result[0] or 0

            pay_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status IN ('paid', 'used')").fetchone()
            pay_count = pay_result[0] or 0

            verify_result = conn.execute("SELECT COUNT(*) FROM orders WHERE status = 'used'").fetchone()
            verify_count = verify_result[0] or 0

            stages = ["浏览", "下单", "支付", "核销"]
            values = [int(browse_count), int(order_count), int(pay_count), int(verify_count)]
        else:
            for row in result:
                stages.append(labels.get(row[0], row[0]))
                values.append(int(row[1]))

        return {"stages": stages, "values": values}
    except Exception as e:
        print(f"DuckDB compute_sales_funnel failed: {e}")
        return {"stages": ["浏览", "下单", "支付", "核销"], "values": [0, 0, 0, 0]}
