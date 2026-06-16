"""
数据处理层 - ETL模块
使用Polars进行数据加工处理
"""
import polars as pl
from datetime import datetime, timedelta
from src.database import get_db_connection, create_batch
from src.config import Config


def process_his_data(patients_df: pl.DataFrame, appointments_df: pl.DataFrame) -> dict:
    """
    处理HIS系统数据 - 第一步
    包括患者信息和预约信息
    """
    conn = get_db_connection()
    try:
        total_records = len(patients_df) + len(appointments_df)
        batch_id = create_batch(conn, 'HIS', total_records, 'success', 'HIS系统数据导入')

        patients_polars = patients_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        appointments_polars = appointments_df.with_columns([
            pl.lit(batch_id).alias('batch_id'),
            pl.when(pl.col('status') == '爽约')
              .then(pl.lit('high'))
              .when(pl.col('next_appointment_date').is_null())
              .then(pl.lit('medium'))
              .otherwise(pl.lit('normal'))
              .alias('risk_level')
        ])

        conn.register('patients_temp', patients_polars.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO his_patients
            SELECT * FROM patients_temp
        """)

        conn.register('appointments_temp', appointments_polars.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO his_appointments
            SELECT * FROM appointments_temp
        """)

        return {
            'batch_id': batch_id,
            'patients_count': len(patients_df),
            'appointments_count': len(appointments_df),
            'status': 'success'
        }
    except Exception as e:
        create_batch(conn, 'HIS', 0, 'failed', str(e))
        raise
    finally:
        conn.close()


def merge_imaging_data(imaging_df: pl.DataFrame) -> dict:
    """
    合并影像系统数据 - 第二步
    """
    conn = get_db_connection()
    try:
        batch_id = create_batch(conn, '影像系统', len(imaging_df), 'success', '影像系统数据导入')

        imaging_with_batch = imaging_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('imaging_temp', imaging_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO imaging_records
            SELECT * FROM imaging_temp
        """)

        return {
            'batch_id': batch_id,
            'record_count': len(imaging_df),
            'status': 'success'
        }
    except Exception as e:
        create_batch(conn, '影像系统', 0, 'failed', str(e))
        raise
    finally:
        conn.close()


def merge_charge_data(charge_df: pl.DataFrame) -> dict:
    """
    合并收费记录数据 - 第三步
    """
    conn = get_db_connection()
    try:
        batch_id = create_batch(conn, '收费系统', len(charge_df), 'success', '收费记录数据导入')

        charge_with_batch = charge_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('charge_temp', charge_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO charge_records
            SELECT * FROM charge_temp
        """)

        return {
            'batch_id': batch_id,
            'record_count': len(charge_df),
            'status': 'success'
        }
    except Exception as e:
        create_batch(conn, '收费系统', 0, 'failed', str(e))
        raise
    finally:
        conn.close()


def merge_treatment_plans(plans_df: pl.DataFrame) -> dict:
    """合并治疗计划数据"""
    conn = get_db_connection()
    try:
        batch_id = create_batch(conn, '治疗计划', len(plans_df), 'success', '治疗计划数据导入')

        plans_with_batch = plans_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('plans_temp', plans_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO treatment_plans
            SELECT * FROM plans_temp
        """)

        return {
            'batch_id': batch_id,
            'record_count': len(plans_df),
            'status': 'success'
        }
    except Exception as e:
        create_batch(conn, '治疗计划', 0, 'failed', str(e))
        raise
    finally:
        conn.close()


def merge_followup_tasks(tasks_df: pl.DataFrame) -> dict:
    """合并随访任务数据"""
    conn = get_db_connection()
    try:
        batch_id = create_batch(conn, '随访系统', len(tasks_df), 'success', '随访任务数据导入')

        tasks_with_batch = tasks_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('tasks_temp', tasks_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO followup_tasks
            SELECT * FROM tasks_temp
        """)

        return {
            'batch_id': batch_id,
            'record_count': len(tasks_df),
            'status': 'success'
        }
    except Exception as e:
        create_batch(conn, '随访系统', 0, 'failed', str(e))
        raise
    finally:
        conn.close()


def get_revisit_risk_overview(doctor_filter=None) -> pl.DataFrame:
    """获取复诊风险总览数据"""
    conn = get_db_connection()
    try:
        query = """
            SELECT
                a.appointment_id,
                a.patient_id,
                p.patient_name,
                p.member_level,
                a.appointment_date,
                a.treatment_type,
                a.status,
                a.risk_level,
                a.doctor_name,
                a.next_appointment_date,
                p.responsible_doctor
            FROM his_appointments a
            JOIN his_patients p ON a.patient_id = p.patient_id
            WHERE a.is_member = true
        """

        if doctor_filter:
            query += f" AND p.responsible_doctor = '{doctor_filter}'"

        query += " ORDER BY a.appointment_date DESC"

        df = conn.execute(query).pl()
        return df
    finally:
        conn.close()


def get_revisit_rate_by_doctor() -> pl.DataFrame:
    """按医生统计复诊率"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                p.responsible_doctor as doctor_name,
                COUNT(*) as total_appointments,
                SUM(CASE WHEN a.status = '已完成' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN a.status = '待复诊' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN a.status = '爽约' THEN 1 ELSE 0 END) as missed_count,
                ROUND(
                    SUM(CASE WHEN a.status = '已完成' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
                    2
                ) as revisit_rate
            FROM his_appointments a
            JOIN his_patients p ON a.patient_id = p.patient_id
            WHERE a.is_member = true
            GROUP BY p.responsible_doctor
            ORDER BY revisit_rate DESC
        """).pl()
        return df
    finally:
        conn.close()


def get_treatment_plan_distribution() -> pl.DataFrame:
    """获取治疗计划分布"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                treatment_type,
                COUNT(*) as plan_count,
                SUM(total_sessions) as total_sessions,
                SUM(completed_sessions) as completed_sessions,
                ROUND(SUM(completed_sessions) * 100.0 / NULLIF(SUM(total_sessions), 0), 2) as completion_rate
            FROM treatment_plans
            WHERE status = '进行中'
            GROUP BY treatment_type
            ORDER BY plan_count DESC
        """).pl()
        return df
    finally:
        conn.close()


def get_followup_funnel() -> pl.DataFrame:
    """获取随访任务漏斗数据"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                task_status,
                COUNT(*) as task_count
            FROM followup_tasks
            GROUP BY task_status
            ORDER BY
                CASE task_status
                    WHEN '待处理' THEN 1
                    WHEN '进行中' THEN 2
                    WHEN '已完成' THEN 3
                    WHEN '已取消' THEN 4
                    ELSE 5
                END
        """).pl()
        return df
    finally:
        conn.close()


def get_imaging_ranking() -> pl.DataFrame:
    """获取影像附件排行"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                image_type,
                COUNT(*) as image_count,
                SUM(file_size) as total_size,
                ROUND(AVG(file_size), 2) as avg_size
            FROM imaging_records
            GROUP BY image_type
            ORDER BY image_count DESC
            LIMIT 10
        """).pl()
        return df
    finally:
        conn.close()


def get_charge_trend(days=30) -> pl.DataFrame:
    """获取收费明细变化趋势"""
    conn = get_db_connection()
    try:
        df = conn.execute(f"""
            SELECT
                charge_date,
                COUNT(*) as charge_count,
                SUM(amount) as total_amount,
                ROUND(AVG(amount), 2) as avg_amount
            FROM charge_records
            WHERE charge_date >= CURRENT_DATE - INTERVAL {days} DAYS
            GROUP BY charge_date
            ORDER BY charge_date
        """).pl()
        return df
    finally:
        conn.close()


def add_appointment_note(appointment_id: str, note_text: str, created_by: str) -> bool:
    """添加预约注释（用于爽约备注等）"""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO appointment_notes (appointment_id, note_text, created_by)
            VALUES (?, ?, ?)
        """, [appointment_id, note_text, created_by])
        return True
    except Exception as e:
        print(f"添加注释失败: {e}")
        return False
    finally:
        conn.close()


def get_appointment_notes(appointment_id: str) -> pl.DataFrame:
    """获取预约的所有注释"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                note_id,
                note_text,
                created_by,
                created_at
            FROM appointment_notes
            WHERE appointment_id = ?
            ORDER BY created_at DESC
        """, [appointment_id]).pl()
        return df
    finally:
        conn.close()


def get_system_users() -> pl.DataFrame:
    """获取系统用户列表"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT user_id, user_name, role, department
            FROM system_users
            WHERE is_active = true
            ORDER BY role, user_name
        """).pl()
        return df
    finally:
        conn.close()


def get_last_update_time(source_system=None) -> datetime:
    """获取最近更新时间"""
    conn = get_db_connection()
    try:
        if source_system:
            result = conn.execute("""
                SELECT MAX(import_time) as last_update
                FROM import_batches
                WHERE source_system = ? AND status = 'success'
            """, [source_system]).fetchone()
        else:
            result = conn.execute("""
                SELECT MAX(import_time) as last_update
                FROM import_batches
                WHERE status = 'success'
            """).fetchone()
        return result[0] if result and result[0] else None
    finally:
        conn.close()


def get_import_batches() -> pl.DataFrame:
    """获取所有导入批次记录"""
    conn = get_db_connection()
    try:
        df = conn.execute("""
            SELECT
                batch_id,
                source_system,
                import_time,
                record_count,
                status,
                remark
            FROM import_batches
            ORDER BY import_time DESC
        """).pl()
        return df
    finally:
        conn.close()
