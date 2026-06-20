from src.data.duckdb_manager import DuckDBManager
import polars as pl


class Queries:
    def __init__(self):
        self.ddb = DuckDBManager()

    def get_overview_stats(self) -> pl.DataFrame:
        sql = """
        SELECT
            (SELECT COUNT(*) FROM registrations) AS total_registrations,
            (SELECT COUNT(*) FROM registrations WHERE status = 'confirmed') AS confirmed_registrations,
            (SELECT COUNT(*) FROM payments WHERE status = 'success') AS successful_payments,
            (SELECT COUNT(DISTINCT checkin_code) FROM checkin_codes WHERE checked_in = true) AS checked_in_count,
            (SELECT COUNT(*) FROM checkin_codes) AS total_codes,
            (SELECT COUNT(*) FROM refunds WHERE status = 'disputed') AS disputed_refunds,
            (SELECT COUNT(*) FROM refunds) AS total_refunds,
            (SELECT COUNT(*) FROM sponsors) AS sponsor_count
        """
        return self.ddb.query(sql)

    def get_checkin_efficiency_hourly(self) -> pl.DataFrame:
        sql = """
        SELECT
            DATE_TRUNC('hour', CAST(checkin_time AS TIMESTAMP)) AS checkin_hour,
            COUNT(*) AS checkin_count,
            COUNT(DISTINCT registration_id) AS unique_registrations
        FROM checkin_codes
        WHERE checked_in = true
          AND checkin_time IS NOT NULL
        GROUP BY checkin_hour
        ORDER BY checkin_hour
        """
        return self.ddb.query(sql)

    def get_checkin_efficiency_cumulative(self) -> pl.DataFrame:
        sql = """
        WITH hourly AS (
            SELECT
                DATE_TRUNC('hour', CAST(checkin_time AS TIMESTAMP)) AS checkin_hour,
                COUNT(*) AS checkin_count
            FROM checkin_codes
            WHERE checked_in = true
              AND checkin_time IS NOT NULL
            GROUP BY checkin_hour
            ORDER BY checkin_hour
        )
        SELECT
            checkin_hour,
            checkin_count,
            SUM(checkin_count) OVER (ORDER BY checkin_hour) AS cumulative_count,
            SUM(checkin_count) OVER (ORDER BY checkin_hour) * 100.0 /
                (SELECT COUNT(*) FROM checkin_codes WHERE checked_in = true) AS cumulative_pct
        FROM hourly
        ORDER BY checkin_hour
        """
        return self.ddb.query(sql)

    def get_seat_checkin_status(self) -> pl.DataFrame:
        sql = """
        SELECT
            s.seat_id,
            s.seat_row,
            s.seat_number,
            s.section,
            s.seat_type,
            r.registration_id,
            r.attendee_name,
            r.ticket_type,
            cc.checkin_code,
            cc.checked_in,
            cc.checkin_time,
            CASE
                WHEN cc.checkin_code IS NULL THEN 'no_code'
                WHEN cc.checked_in = false THEN 'not_checked_in'
                ELSE 'checked_in'
            END AS status
        FROM seats s
        LEFT JOIN registrations r ON s.seat_id = r.seat_id
        LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
        ORDER BY s.seat_row, s.seat_number
        """
        return self.ddb.query(sql)

    def get_checkin_code_gaps(self) -> pl.DataFrame:
        sql = """
        SELECT
            cc.checkin_code,
            cc.registration_id,
            r.attendee_name,
            r.ticket_type,
            r.seat_id,
            cc.generated,
            cc.sent,
            cc.checked_in,
            cc.checkin_time,
            CASE
                WHEN cc.generated = false THEN 'not_generated'
                WHEN cc.sent = false THEN 'not_sent'
                WHEN cc.checked_in = false THEN 'not_checked_in'
                ELSE 'normal'
            END AS gap_type
        FROM checkin_codes cc
        LEFT JOIN registrations r ON cc.registration_id = r.registration_id
        WHERE cc.generated = false OR cc.sent = false OR cc.checked_in = false
        ORDER BY gap_type, cc.checkin_code
        """
        return self.ddb.query(sql)

    def get_sponsor_list(self) -> pl.DataFrame:
        sql = """
        SELECT
            sp.sponsor_id,
            sp.sponsor_name,
            sp.sponsor_level,
            sp.allocated_tickets,
            COUNT(r.registration_id) AS used_tickets,
            COUNT(cc.checkin_code) AS generated_codes,
            COUNT(CASE WHEN cc.checked_in = true THEN 1 END) AS checked_in_count
        FROM sponsors sp
        LEFT JOIN registrations r ON sp.sponsor_id = r.sponsor_id
        LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
        GROUP BY sp.sponsor_id, sp.sponsor_name, sp.sponsor_level, sp.allocated_tickets
        ORDER BY sp.sponsor_level, sp.sponsor_name
        """
        return self.ddb.query(sql)

    def get_sponsor_attendees(self, sponsor_id: str = None) -> pl.DataFrame:
        if sponsor_id:
            sql = f"""
            SELECT
                r.registration_id,
                r.attendee_name,
                r.email,
                r.ticket_type,
                r.seat_id,
                r.status,
                cc.checkin_code,
                cc.checked_in,
                cc.checkin_time
            FROM registrations r
            LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
            WHERE r.sponsor_id = '{sponsor_id}'
            ORDER BY r.attendee_name
            """
        else:
            sql = """
            SELECT
                r.registration_id,
                r.attendee_name,
                r.email,
                r.ticket_type,
                r.seat_id,
                r.status,
                r.sponsor_id,
                sp.sponsor_name,
                cc.checkin_code,
                cc.checked_in,
                cc.checkin_time
            FROM registrations r
            LEFT JOIN sponsors sp ON r.sponsor_id = sp.sponsor_id
            LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
            WHERE r.sponsor_id IS NOT NULL
            ORDER BY sp.sponsor_name, r.attendee_name
            """
        return self.ddb.query(sql)

    def get_refund_list(self) -> pl.DataFrame:
        sql = """
        SELECT
            rf.refund_id,
            rf.registration_id,
            r.attendee_name,
            r.ticket_type,
            rf.refund_amount,
            rf.refund_reason,
            rf.status AS refund_status,
            CAST(rf.request_time AS TIMESTAMP) AS request_time,
            CAST(rf.resolved_time AS TIMESTAMP) AS resolved_time,
            COUNT(rn.note_id) AS note_count,
            rf.platform_code,
            rf.platform_refund_id
        FROM refunds rf
        LEFT JOIN registrations r ON rf.registration_id = r.registration_id
        LEFT JOIN refund_notes rn ON rf.refund_id = rn.refund_id
        GROUP BY
            rf.refund_id, rf.registration_id, r.attendee_name,
            r.ticket_type, rf.refund_amount, rf.refund_reason,
            rf.status, rf.request_time, rf.resolved_time,
            rf.platform_code, rf.platform_refund_id
        ORDER BY request_time DESC
        """
        return self.ddb.query(sql)

    def get_refund_notes(self, refund_id: str) -> pl.DataFrame:
        sql = f"""
        SELECT
            note_id,
            refund_id,
            note_content,
            created_by,
            CAST(created_at AS TIMESTAMP) AS created_at,
            is_resolution
        FROM refund_notes
        WHERE refund_id = '{refund_id}'
        ORDER BY created_at
        """
        return self.ddb.query(sql)

    def get_registration_detail(self, registration_id: str) -> pl.DataFrame:
        sql = f"""
        SELECT
            r.*,
            s.seat_row,
            s.seat_number,
            s.section,
            s.seat_type,
            sp.sponsor_name,
            sp.sponsor_level,
            p.payment_id,
            p.amount AS payment_amount,
            p.status AS payment_status,
            p.payment_method,
            CAST(p.payment_time AS TIMESTAMP) AS payment_time,
            p.transaction_id,
            p.platform_code AS payment_platform_code,
            p.platform_payment_id,
            cc.checkin_code,
            cc.generated AS code_generated,
            cc.sent AS code_sent,
            cc.checked_in,
            CAST(cc.checkin_time AS TIMESTAMP) AS checkin_time,
            rf.refund_id,
            rf.refund_amount,
            rf.status AS refund_status,
            rf.platform_refund_id
        FROM registrations r
        LEFT JOIN seats s ON r.seat_id = s.seat_id
        LEFT JOIN sponsors sp ON r.sponsor_id = sp.sponsor_id
        LEFT JOIN payments p ON r.registration_id = p.registration_id
        LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
        LEFT JOIN refunds rf ON r.registration_id = rf.registration_id
        WHERE r.registration_id = '{registration_id}'
        """
        return self.ddb.query(sql)

    def get_platform_raw_records(self, source_type: str = None, source_id: str = None) -> pl.DataFrame:
        conditions = []
        if source_type:
            conditions.append(f"source_type = '{source_type}'")
        if source_id:
            conditions.append(f"source_id = '{source_id}'")

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        sql = f"""
        SELECT
            record_id,
            source_type,
            source_id,
            platform_code,
            platform_name,
            platform_record_id,
            platform_url,
            raw_payload,
            CAST(synced_at AS TIMESTAMP) AS synced_at
        FROM platform_raw_records
        {where_clause}
        ORDER BY synced_at DESC
        """
        return self.ddb.query(sql)

    def get_checkin_minute_distribution(self) -> pl.DataFrame:
        sql = """
        SELECT
            DATE_TRUNC('minute', CAST(checkin_time AS TIMESTAMP)) AS checkin_minute,
            COUNT(*) AS count
        FROM checkin_codes
        WHERE checked_in = true
          AND checkin_time IS NOT NULL
        GROUP BY checkin_minute
        ORDER BY checkin_minute
        """
        return self.ddb.query(sql)

    def get_platforms(self) -> pl.DataFrame:
        if self.ddb.table_exists("platforms"):
            return self.ddb.query("SELECT * FROM platforms ORDER BY code")
        return pl.DataFrame(
            {"code": [], "name": [], "base_url": [], "api_prefix": []},
            schema={"code": pl.Utf8, "name": pl.Utf8, "base_url": pl.Utf8, "api_prefix": pl.Utf8}
        )

    def add_refund_note(self, refund_id: str, note_content: str, created_by: str, is_resolution: bool = False):
        import uuid
        from datetime import datetime
        note_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        sql = f"""
        INSERT INTO refund_notes (note_id, refund_id, note_content, created_by, created_at, is_resolution)
        VALUES ('{note_id}', '{refund_id}', '{note_content.replace("'", "''")}', '{created_by}', '{created_at}', {str(is_resolution).lower()})
        """
        self.ddb.execute(sql)

        if is_resolution:
            update_sql = f"""
            UPDATE refunds
            SET status = 'resolved',
                resolved_time = '{created_at}'
            WHERE refund_id = '{refund_id}'
            """
            self.ddb.execute(update_sql)

        return note_id
