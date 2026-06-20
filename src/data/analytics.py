from __future__ import annotations

import polars as pl
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple

from src.data.database import db


class TicketAnalytics:
    def __init__(self, event_id: Optional[str] = None):
        self.event_id = event_id

    def _event_filter(self, table_alias: str = "") -> str:
        prefix = f"{table_alias}." if table_alias else ""
        if self.event_id is None:
            return "WHERE 1=1"
        return f"WHERE {prefix}event_id = '{self.event_id}'"

    def get_funnel_data(self) -> pl.DataFrame:
        funnel_sql = f"""
        WITH stats AS (
            SELECT
                (SELECT COUNT(*) FROM tickets t {self._event_filter('t')}) as total_issued,
                (SELECT COUNT(*) FROM tickets t {self._event_filter('t')} AND payment_status = 'paid') as paid_tickets,
                (SELECT COUNT(*) FROM tickets t {self._event_filter('t')} AND ticket_status = 'refunded') as refunded_tickets,
                (SELECT COUNT(DISTINCT ticket_id) FROM gate_records g {self._event_filter('g')} AND check_status = 'success') as checked_in,
                (SELECT COUNT(DISTINCT ticket_id) FROM gate_records g {self._event_filter('g')}
                    AND check_status = 'success' AND check_out_time IS NOT NULL) as checked_out,
                (SELECT COUNT(DISTINCT ticket_id) FROM gate_records g {self._event_filter('g')} AND check_status != 'success') as failed_checkins
        )
        SELECT * FROM stats
        """
        return db.query_to_df(funnel_sql)

    def get_funnel_chart_data(self) -> pl.DataFrame:
        stats = self.get_funnel_data().row(0, named=True)
        data = [
            {"stage": "已出票", "count": stats["total_issued"], "color": "#6366F1"},
            {"stage": "已支付", "count": stats["paid_tickets"], "color": "#8B5CF6"},
            {"stage": "有效票（扣除退票）", "count": stats["paid_tickets"] - stats["refunded_tickets"], "color": "#10B981"},
            {"stage": "已检票入场", "count": stats["checked_in"], "color": "#F59E0B"},
            {"stage": "已出场", "count": stats["checked_out"], "color": "#EF4444"},
        ]
        return pl.DataFrame(data)

    def get_payment_reconciliation(self) -> Dict[str, Any]:
        recon_sql = f"""
        WITH
        ticket_payments AS (
            SELECT
                COUNT(*) as ticket_paid_count,
                COALESCE(SUM(final_price), 0) as ticket_paid_amount
            FROM tickets
            {self._event_filter()}
              AND payment_status = 'paid'
        ),
        payment_records AS (
            SELECT
                COUNT(*) as payment_count,
                COUNT(CASE WHEN payment_status IN ('success', 'paid') THEN 1 END) as payment_success_count,
                COALESCE(SUM(CASE WHEN payment_status IN ('success', 'paid') THEN amount ELSE 0 END), 0) as payment_success_amount,
                COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END), 0) as payment_refund_amount
            FROM payments
            {self._event_filter()}
        )
        SELECT
            tp.*,
            pr.*,
            pr.payment_success_count - tp.ticket_paid_count as count_diff,
            pr.payment_success_amount - tp.ticket_paid_amount as amount_diff
        FROM ticket_payments tp, payment_records pr
        """
        result = db.query_to_df(recon_sql)
        if result.height == 0:
            return {}
        row = result.row(0, named=True)

        recon_status = "✅ 一致"
        recon_detail = ""
        count_diff = row.get("count_diff", 0) or 0
        amount_diff = row.get("amount_diff", 0) or 0

        if count_diff == 0 and amount_diff == 0:
            recon_status = "✅ 对账一致"
            recon_detail = "票务已支付与支付流水完全匹配"
        elif count_diff > 0 or amount_diff > 0:
            recon_status = "⚠️ 支付多于票务"
            recon_detail = f"支付流水多 {count_diff} 张 / 金额多 ¥{amount_diff:.2f}"
        else:
            recon_status = "⚠️ 票务多于支付"
            recon_detail = f"票务已支付多 {abs(count_diff)} 张 / 金额多 ¥{abs(amount_diff):.2f}"

        return {
            "票务已支付票数": row.get("ticket_paid_count", 0),
            "票务已支付金额": row.get("ticket_paid_amount", 0),
            "支付流水总数": row.get("payment_count", 0),
            "支付流水成功数": row.get("payment_success_count", 0),
            "支付流水成功金额": row.get("payment_success_amount", 0),
            "支付已退款金额": row.get("payment_refund_amount", 0),
            "对账状态": recon_status,
            "对账详情": recon_detail,
            "数量差异": count_diff,
            "金额差异": float(amount_diff),
        }


    def get_efficiency_metrics(self) -> Dict[str, Any]:
        metrics_sql = f"""
        WITH
        ticket_stats AS (
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN payment_status='paid' THEN 1 END) as paid,
                COUNT(CASE WHEN ticket_status='refunded' THEN 1 END) as refunded
            FROM tickets {self._event_filter()}
        ),
        check_stats AS (
            SELECT
                COUNT(DISTINCT ticket_id) as checked_in_count,
                COUNT(CASE WHEN check_status != 'success' THEN 1 END) as failed_count,
                COUNT(*) as total_gate_records,
                MIN(check_in_time) as first_checkin,
                MAX(check_in_time) as last_checkin
            FROM gate_records {self._event_filter()}
        ),
        time_distribution AS (
            SELECT
                DATE_TRUNC('minute', check_in_time) as minute_bucket,
                COUNT(*) as count
            FROM gate_records {self._event_filter()}
            AND check_status = 'success'
            GROUP BY DATE_TRUNC('minute', check_in_time)
        )
        SELECT
            ts.*,
            cs.checked_in_count,
            cs.failed_count,
            cs.total_gate_records,
            cs.first_checkin,
            cs.last_checkin,
            CASE WHEN ts.paid > 0 THEN ROUND(cs.checked_in_count * 100.0 / ts.paid, 2) ELSE 0 END as checkin_rate,
            CASE WHEN ts.total > 0 THEN ROUND(ts.refunded * 100.0 / ts.total, 2) ELSE 0 END as refund_rate,
            CASE WHEN cs.total_gate_records > 0 THEN ROUND(cs.failed_count * 100.0 / cs.total_gate_records, 2) ELSE 0 END as failure_rate,
            (SELECT MAX(count) FROM time_distribution) as peak_throughput_per_min
        FROM ticket_stats ts, check_stats cs
        """
        result = db.query_to_df(metrics_sql)
        if result.height == 0:
            return {}
        row = result.row(0, named=True)
        return {
            "总出票数": row["total"],
            "已支付票数": row["paid"],
            "已核销票数": row["checked_in_count"],
            "核销率": f"{row['checkin_rate']}%",
            "退票数": row["refunded"],
            "退票率": f"{row['refund_rate']}%",
            "检票失败次数": row["failed_count"],
            "失败率": f"{row['failure_rate']}%",
            "首个入场时间": row["first_checkin"],
            "最后入场时间": row["last_checkin"],
            "峰值吞吐量(票/分钟)": row["peak_throughput_per_min"],
        }

    def get_sponsor_breakdown(self) -> pl.DataFrame:
        sql = f"""
        SELECT
            s.sponsor_id,
            s.sponsor_name,
            s.sponsor_level,
            s.contact_person,
            s.allocated_tickets,
            COUNT(DISTINCT t.ticket_id) as actual_issued,
            COUNT(DISTINCT CASE WHEN t.payment_status='paid' THEN t.ticket_id END) as paid_count,
            COUNT(DISTINCT CASE WHEN t.ticket_status='refunded' THEN t.ticket_id END) as refunded_count,
            COUNT(DISTINCT g.ticket_id) as checked_in_count,
            ROUND(
                CASE WHEN s.allocated_tickets > 0
                THEN COUNT(DISTINCT g.ticket_id) * 100.0 / s.allocated_tickets
                ELSE 0 END, 2
            ) as utilization_rate
        FROM sponsors s
        LEFT JOIN tickets t ON s.sponsor_id = t.sponsor_id {'' if not self.event_id else f"AND t.event_id = '{self.event_id}'"}
        LEFT JOIN gate_records g ON t.ticket_id = g.ticket_id AND g.check_status = 'success'
        {self._event_filter('s')}
        GROUP BY s.sponsor_id, s.sponsor_name, s.sponsor_level, s.contact_person, s.allocated_tickets
        ORDER BY utilization_rate DESC
        """
        return db.query_to_df(sql)

    def get_ticket_type_breakdown(self) -> pl.DataFrame:
        sql = f"""
        SELECT
            tt.ticket_type_id,
            tt.type_name,
            tt.price,
            s.sponsor_name,
            tt.total_quantity,
            COUNT(DISTINCT t.ticket_id) as issued_count,
            COUNT(DISTINCT CASE WHEN t.payment_status='paid' THEN t.ticket_id END) as paid_count,
            COUNT(DISTINCT CASE WHEN t.ticket_status='refunded' THEN t.ticket_id END) as refunded_count,
            COUNT(DISTINCT g.ticket_id) as checked_in_count,
            ROUND(
                CASE WHEN tt.total_quantity > 0
                THEN COUNT(DISTINCT g.ticket_id) * 100.0 / tt.total_quantity
                ELSE 0 END, 2
            ) as redemption_rate,
            ROUND(SUM(CASE WHEN t.payment_status='paid' THEN t.final_price ELSE 0 END), 2) as total_revenue
        FROM ticket_types tt
        LEFT JOIN sponsors s ON tt.sponsor_id = s.sponsor_id
        LEFT JOIN tickets t ON tt.ticket_type_id = t.ticket_type_id {'' if not self.event_id else f"AND t.event_id = '{self.event_id}'"}
        LEFT JOIN gate_records g ON t.ticket_id = g.ticket_id AND g.check_status = 'success'
        {self._event_filter('tt')}
        GROUP BY tt.ticket_type_id, tt.type_name, tt.price, s.sponsor_name, tt.total_quantity
        ORDER BY redemption_rate DESC
        """
        return db.query_to_df(sql)

    def get_checkin_timeline(self, interval: str = "5minute") -> pl.DataFrame:
        interval_seconds = {
            "minute": 60,
            "5minute": 300,
            "15minute": 900,
            "hour": 3600,
        }
        seconds = interval_seconds.get(interval, 300)
        sql = f"""
        SELECT
            TO_TIMESTAMP(FLOOR(EPOCH(check_in_time) / {seconds}) * {seconds})::TIMESTAMP as time_bucket,
            COUNT(*) as checkin_count,
            COUNT(CASE WHEN check_status = 'success' THEN 1 END) as success_count,
            COUNT(CASE WHEN check_status != 'success' THEN 1 END) as fail_count,
            COUNT(DISTINCT gate_id) as active_gates
        FROM gate_records
        {self._event_filter()}
        GROUP BY 1
        ORDER BY time_bucket
        """
        return db.query_to_df(sql)

    def get_gate_efficiency(self) -> pl.DataFrame:
        sql = f"""
        SELECT
            gate_id,
            gate_name,
            COUNT(*) as total_scans,
            COUNT(CASE WHEN check_status = 'success' THEN 1 END) as success_count,
            COUNT(CASE WHEN check_status != 'success' THEN 1 END) as fail_count,
            ROUND(
                CASE WHEN COUNT(*) > 0
                THEN COUNT(CASE WHEN check_status != 'success' THEN 1 END) * 100.0 / COUNT(*)
                ELSE 0 END, 2
            ) as fail_rate,
            MIN(check_in_time) as first_scan,
            MAX(check_in_time) as last_scan,
            COUNT(DISTINCT staff_id) as staff_count
        FROM gate_records
        {self._event_filter()}
        GROUP BY gate_id, gate_name
        ORDER BY total_scans DESC
        """
        return db.query_to_df(sql)

    def get_staff_performance(self) -> pl.DataFrame:
        sql = f"""
        SELECT
            s.staff_id,
            s.staff_name,
            s.staff_role,
            s.assigned_gate,
            COUNT(g.record_id) as total_scans,
            COUNT(CASE WHEN g.check_status = 'success' THEN 1 END) as success_count,
            ROUND(
                CASE WHEN COUNT(g.record_id) > 0
                THEN COUNT(CASE WHEN g.check_status = 'success' THEN 1 END) * 100.0 / COUNT(g.record_id)
                ELSE 0 END, 2
            ) as success_rate,
            MIN(g.check_in_time) as first_scan,
            MAX(g.check_in_time) as last_scan
        FROM staff s
        LEFT JOIN gate_records g ON s.staff_id = g.staff_id
        {self._event_filter('s')}
        GROUP BY s.staff_id, s.staff_name, s.staff_role, s.assigned_gate
        ORDER BY total_scans DESC
        """
        return db.query_to_df(sql)

    def get_raw_gate_records(
        self,
        ticket_id: Optional[str] = None,
        ticket_code: Optional[str] = None,
        gate_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 500,
    ) -> pl.DataFrame:
        conditions = []
        if ticket_id:
            conditions.append(f"ticket_id = '{ticket_id}'")
        if ticket_code:
            conditions.append(f"ticket_code = '{ticket_code}'")
        if gate_id:
            conditions.append(f"gate_id = '{gate_id}'")
        if status_filter:
            conditions.append(f"check_status = '{status_filter}'")
        if self.event_id:
            conditions.append(f"event_id = '{self.event_id}'")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        sql = f"""
        SELECT
            record_id,
            ticket_id,
            ticket_code,
            gate_id,
            gate_name,
            staff_id,
            check_in_time,
            check_out_time,
            check_status,
            fail_reason,
            raw_payload
        FROM gate_records
        {where_clause}
        ORDER BY check_in_time DESC
        LIMIT {limit}
        """
        return db.query_to_df(sql)

    def get_ticket_details(
        self,
        ticket_id: Optional[str] = None,
        ticket_code: Optional[str] = None,
    ) -> pl.DataFrame:
        conditions = []
        if ticket_id:
            conditions.append(f"t.ticket_id = '{ticket_id}'")
        if ticket_code:
            conditions.append(f"t.ticket_code = '{ticket_code}'")
        if self.event_id:
            conditions.append(f"t.event_id = '{self.event_id}'")
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        sql = f"""
        SELECT
            t.ticket_id,
            t.ticket_code,
            t.order_id,
            t.ticket_status,
            t.payment_status,
            t.refund_status,
            tt.type_name,
            tt.price as original_price,
            t.final_price,
            s.sponsor_name,
            t.attendee_name,
            t.seat_info,
            t.buyer_name,
            t.buyer_phone,
            o.order_source,
            o.sales_channel,
            t.purchase_time,
            p.payment_method,
            p.transaction_id,
            p.payment_time
        FROM tickets t
        LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
        LEFT JOIN sponsors s ON t.sponsor_id = s.sponsor_id
        LEFT JOIN orders o ON t.order_id = o.order_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        {where_clause}
        ORDER BY t.purchase_time DESC
        LIMIT 500
        """
        return db.query_to_df(sql)

    def get_refund_disputes(self, status: Optional[str] = None) -> pl.DataFrame:
        conditions = []
        if status:
            conditions.append(f"dispute_status = '{status}'")
        if self.event_id:
            conditions.append(f"event_id = '{self.event_id}'")
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        sql = f"""
        SELECT
            rd.dispute_id,
            rd.ticket_id,
            rd.order_id,
            rd.dispute_type,
            rd.dispute_reason,
            rd.applicant_name,
            rd.applicant_contact,
            rd.dispute_status,
            rd.filed_time,
            rd.assigned_to,
            rd.deadline,
            rd.resolution,
            rd.conclusion,
            t.ticket_code,
            t.attendee_name,
            t.final_price as ticket_price,
            COUNT(nt.task_id) as related_tasks
        FROM refund_disputes rd
        LEFT JOIN tickets t ON rd.ticket_id = t.ticket_id
        LEFT JOIN notes_tasks nt ON rd.dispute_id = nt.dispute_id
        {where_clause}
        GROUP BY
            rd.dispute_id, rd.ticket_id, rd.order_id, rd.dispute_type,
            rd.dispute_reason, rd.applicant_name, rd.applicant_contact,
            rd.dispute_status, rd.filed_time, rd.assigned_to, rd.deadline,
            rd.resolution, rd.conclusion, t.ticket_code, t.attendee_name, t.final_price
        ORDER BY rd.filed_time DESC
        """
        return db.query_to_df(sql)

    def get_events_list(self) -> pl.DataFrame:
        sql = """
        SELECT
            event_id,
            event_name,
            event_date,
            event_time,
            venue,
            organizer,
            total_capacity,
            created_at
        FROM events
        ORDER BY event_date DESC
        """
        return db.query_to_df(sql)

    def get_processing_conclusions(self, related_type: Optional[str] = None) -> pl.DataFrame:
        conditions = []
        if related_type:
            conditions.append(f"related_type = '{related_type}'")
        if self.event_id:
            conditions.append(f"event_id = '{self.event_id}'")
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        sql = f"""
        SELECT
            conclusion_id,
            related_type,
            related_id,
            conclusion_title,
            conclusion_content,
            chart_reference,
            conclusion_type,
            author,
            created_at,
            updated_at
        FROM processing_conclusions
        {where_clause}
        ORDER BY updated_at DESC
        """
        return db.query_to_df(sql)


analytics = TicketAnalytics()
