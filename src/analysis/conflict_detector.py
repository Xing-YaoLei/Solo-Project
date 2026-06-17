import polars as pl
from typing import Dict, List, Tuple
from datetime import date


class ConflictDetector:
    def __init__(self, db):
        self.db = db

    def detect_time_slot_conflicts(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            c1.apartment_id,
            c1.room_id,
            c1.cleaning_date as conflict_date,
            c1.time_slot,
            c1.id as schedule_id_1,
            c2.id as schedule_id_2,
            c1.cleaner_id as cleaner_1,
            c2.cleaner_id as cleaner_2,
            'time_slot' as conflict_type,
            CASE 
                WHEN c1.cleaner_id = c2.cleaner_id THEN 'high'
                ELSE 'medium'
            END as severity,
            CONCAT(c1.room_id, ' 与 ', c2.room_id, ' 在 ', c1.time_slot, ' 时段冲突') as description
        FROM crm_schedules c1
        JOIN crm_schedules c2 
            ON c1.apartment_id = c2.apartment_id
            AND c1.cleaning_date = c2.cleaning_date
            AND c1.time_slot = c2.time_slot
            AND c1.id < c2.id
        WHERE c1.cleaning_date BETWEEN '{start_date}' AND '{end_date}'
          AND c2.cleaning_date BETWEEN '{start_date}' AND '{end_date}'
          AND c1.status != 'cancelled'
          AND c2.status != 'cancelled'
        ORDER BY c1.cleaning_date, c1.time_slot
        """
        return self.db.query(sql)

    def detect_crm_contract_diff(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        WITH contract_schedules AS (
            SELECT 
                ec.apartment_id,
                ec.room_id,
                ec.cleaning_frequency,
                ec.cleaning_weekday,
                ec.cleaning_time_slot as contract_time_slot
            FROM e_contracts ec
            WHERE ec.is_current = true
        ),
        crm_cleaning_dates AS (
            SELECT 
                cs.apartment_id,
                cs.room_id,
                cs.cleaning_date,
                cs.time_slot as crm_time_slot,
                cs.status
            FROM crm_schedules cs
            WHERE cs.cleaning_date BETWEEN '{start_date}' AND '{end_date}'
              AND cs.status != 'cancelled'
        )
        SELECT 
            c.apartment_id,
            c.room_id,
            c.cleaning_frequency,
            c.cleaning_weekday,
            c.contract_time_slot,
            crm.cleaning_date,
            crm.crm_time_slot,
            CASE 
                WHEN c.contract_time_slot != crm.crm_time_slot THEN 'time_slot_mismatch'
                ELSE 'other'
            END as diff_type,
            CASE 
                WHEN c.contract_time_slot != crm.crm_time_slot THEN 'high'
                ELSE 'low'
            END as severity,
            CONCAT('合同约定:', c.contract_time_slot, ', CRM排班:', crm.crm_time_slot) as description
        FROM contract_schedules c
        JOIN crm_cleaning_dates crm 
            ON c.apartment_id = crm.apartment_id 
            AND c.room_id = crm.room_id
        WHERE c.contract_time_slot != crm.crm_time_slot
        ORDER BY crm.cleaning_date
        """
        return self.db.query(sql)

    def detect_reschedule_conflicts(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            r.apartment_id,
            r.room_id,
            r.original_date,
            r.original_time_slot,
            r.new_date,
            r.new_time_slot,
            r.reason,
            r.status as reschedule_status,
            cs.status as schedule_status,
            'reschedule' as conflict_type,
            CASE 
                WHEN r.status = 'pending' THEN 'medium'
                ELSE 'low'
            END as severity,
            CONCAT('改约:', r.original_date, ' ', r.original_time_slot, ' → ', r.new_date, ' ', r.new_time_slot) as description
        FROM reschedule_records r
        LEFT JOIN crm_schedules cs ON r.new_date = cs.cleaning_date 
            AND r.apartment_id = cs.apartment_id
            AND r.room_id = cs.room_id
        WHERE (r.original_date BETWEEN '{start_date}' AND '{end_date}'
            OR r.new_date BETWEEN '{start_date}' AND '{end_date}')
        ORDER BY r.new_date
        """
        return self.db.query(sql)

    def detect_attendance_anomalies(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            a.apartment_id,
            a.room_id,
            a.scheduled_date,
            a.scheduled_time_slot,
            a.actual_arrival_time,
            a.status,
            a.remark,
            CASE 
                WHEN a.status = 'no_show' THEN 'high'
                WHEN a.status = 'late' THEN 'medium'
                WHEN a.remark IS NOT NULL AND a.remark != '' THEN 'low'
                ELSE 'none'
            END as severity,
            CASE 
                WHEN a.status = 'no_show' THEN '未到场'
                WHEN a.status = 'late' THEN '迟到'
                ELSE '异常'
            END as description
        FROM attendance_records a
        WHERE a.scheduled_date BETWEEN '{start_date}' AND '{end_date}'
          AND a.status IN ('no_show', 'late', 'abnormal')
        ORDER BY a.scheduled_date
        """
        return self.db.query(sql)

    def detect_data_gaps(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            r.apartment_id,
            r.room_id,
            r.original_date,
            r.new_date,
            r.data_quality,
            CASE 
                WHEN r.data_quality != 'complete' THEN 'high'
                ELSE 'none'
            END as severity,
            CASE 
                WHEN r.data_quality = 'missing_reason' THEN '缺失改约原因'
                WHEN r.data_quality = 'missing_operator' THEN '缺失操作人'
                WHEN r.data_quality = 'incomplete' THEN '记录不完整'
                ELSE '正常'
            END as description
        FROM reschedule_records r
        WHERE (r.original_date BETWEEN '{start_date}' AND '{end_date}'
            OR r.new_date BETWEEN '{start_date}' AND '{end_date}')
          AND r.data_quality != 'complete'
        ORDER BY r.new_date
        """
        return self.db.query(sql)

    def get_all_conflicts(self, start_date: date, end_date: date) -> Dict[str, pl.DataFrame]:
        return {
            "time_slot": self.detect_time_slot_conflicts(start_date, end_date),
            "crm_contract_diff": self.detect_crm_contract_diff(start_date, end_date),
            "reschedule": self.detect_reschedule_conflicts(start_date, end_date),
            "attendance": self.detect_attendance_anomalies(start_date, end_date),
            "data_gaps": self.detect_data_gaps(start_date, end_date),
        }

    def get_conflict_summary(self, start_date: date, end_date: date) -> Dict:
        conflicts = self.get_all_conflicts(start_date, end_date)
        return {
            "time_slot_count": len(conflicts["time_slot"]),
            "crm_contract_diff_count": len(conflicts["crm_contract_diff"]),
            "reschedule_count": len(conflicts["reschedule"]),
            "attendance_anomaly_count": len(conflicts["attendance"]),
            "data_gap_count": len(conflicts["data_gaps"]),
            "total_high_severity": sum(
                len(df.filter(pl.col("severity") == "high"))
                for df in conflicts.values()
                if "severity" in df.columns
            ),
        }

    def generate_alert_list(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT * FROM (
            SELECT 
                id,
                alert_type,
                apartment_id,
                room_id,
                schedule_id,
                alert_date,
                description,
                severity,
                is_resolved
            FROM alert_list
            WHERE alert_date BETWEEN '{start_date}' AND '{end_date}'
            UNION ALL
            SELECT 
                CONCAT('att_', id) as id,
                'attendance' as alert_type,
                apartment_id,
                room_id,
                NULL as schedule_id,
                scheduled_date as alert_date,
                description,
                severity,
                false as is_resolved
            FROM (
                SELECT 
                    id,
                    apartment_id,
                    room_id,
                    scheduled_date,
                    CASE 
                        WHEN status = 'no_show' THEN '未到场'
                        WHEN status = 'late' THEN '迟到'
                        ELSE status
                    END as description,
                    CASE 
                        WHEN status = 'no_show' THEN 'high'
                        WHEN status = 'late' THEN 'medium'
                        ELSE 'low'
                    END as severity
                FROM attendance_records
                WHERE scheduled_date BETWEEN '{start_date}' AND '{end_date}'
                  AND status IN ('no_show', 'late', 'abnormal')
            )
        )
        ORDER BY 
            CASE severity 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                ELSE 3 
            END,
            alert_date DESC
        """
        return self.db.query(sql)
