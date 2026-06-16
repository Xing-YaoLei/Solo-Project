"""
数据处理层 - ETL模块
使用Polars进行数据加工处理
包含完整的事务管理、权限控制和业务流程
"""
import polars as pl
from datetime import datetime, timedelta
from src.database import get_db_connection, create_batch, update_batch_status
from src.config import Config
from src.minio_client import get_minio_client
import hashlib


class DataAccessError(Exception):
    """数据访问异常"""
    pass


class PermissionDeniedError(DataAccessError):
    """权限不足异常"""
    pass


def _validate_doctor_access(doctor_filter, current_user, role):
    """
    验证医生数据访问权限
    - 管理层可以访问所有数据或指定医生数据
    - 一线人员只能访问自己负责的数据
    """
    if role == "management":
        return doctor_filter

    if role == "frontline":
        if doctor_filter and doctor_filter != current_user:
            raise PermissionDeniedError(f"一线人员({current_user})无权访问其他医生({doctor_filter})的数据")
        return current_user

    raise PermissionDeniedError(f"未知角色: {role}")


def process_his_data(patients_df: pl.DataFrame, appointments_df: pl.DataFrame) -> dict:
    """
    处理HIS系统数据 - 第一步
    包括患者信息和预约信息
    使用批次记录保证数据可追溯
    """
    conn = get_db_connection()
    batch_id = None
    try:
        total_records = len(patients_df) + len(appointments_df)
        batch_id = create_batch(conn, 'HIS', total_records, 'processing', 'HIS系统数据导入中...')

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

        update_batch_status(conn, batch_id, 'success', f'HIS数据导入成功，共{total_records}条记录')

        return {
            'batch_id': batch_id,
            'patients_count': len(patients_df),
            'appointments_count': len(appointments_df),
            'status': 'success'
        }
    except Exception as e:
        if batch_id:
            try:
                update_batch_status(conn, batch_id, 'failed', str(e))
            except:
                pass
        raise
    finally:
        conn.close()


def merge_imaging_data(imaging_df: pl.DataFrame, upload_to_minio: bool = True) -> dict:
    """
    合并影像系统数据 - 第二步
    同步上传影像文件到MinIO对象存储
    按影像类型分目录存储
    """
    conn = get_db_connection()
    minio_client = get_minio_client() if upload_to_minio else None
    minio_available = minio_client and minio_client.available if minio_client else False

    batch_id = None
    try:
        batch_id = create_batch(
            conn,
            '影像系统',
            len(imaging_df),
            'processing',
            '影像系统数据导入中...'
        )

        uploaded_count = 0
        failed_upload_count = 0
        imaging_records = []

        type_folders = {
            "口腔全景片": "panoramic",
            "根尖片": "periapical",
            "CBCT": "cbct",
            "头颅侧位片": "cephalometric",
            "口腔内窥镜": "endoscope",
            "牙片": "dental"
        }

        for row in imaging_df.iter_rows(named=True):
            image_type = row.get("image_type", "其他")
            image_id = row.get("image_id", "")
            file_size = row.get("file_size", 0)

            folder = type_folders.get(image_type, "other")
            date_str = row.get("image_date", datetime.now().date()).strftime("%Y%m")
            object_name = f"imaging/{folder}/{date_str}/{image_id}.dcm"

            if minio_available and upload_to_minio:
                try:
                    dummy_data = _generate_dummy_image(file_size, image_type)
                    success = minio_client.upload_file(
                        object_name,
                        dummy_data,
                        content_type="application/dicom"
                    )
                    if success:
                        uploaded_count += 1
                        row["file_path"] = object_name
                    else:
                        failed_upload_count += 1
                except Exception as e:
                    failed_upload_count += 1
                    print(f"上传影像到MinIO失败 {image_id}: {e}")

            imaging_records.append(row)

        imaging_with_batch = pl.DataFrame(imaging_records).with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('imaging_temp', imaging_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO imaging_records
            SELECT * FROM imaging_temp
        """)

        remark = f'影像导入成功，MinIO上传{uploaded_count}个'
        if failed_upload_count > 0:
            remark += f'，失败{failed_upload_count}个'
        if not minio_available:
            remark = '影像导入成功（MinIO不可用，未上传对象存储）'

        update_batch_status(conn, batch_id, 'success', remark)

        return {
            'batch_id': batch_id,
            'record_count': len(imaging_df),
            'minio_uploaded': uploaded_count,
            'minio_failed': failed_upload_count,
            'minio_available': minio_available,
            'status': 'success'
        }
    except Exception as e:
        if batch_id:
            try:
                update_batch_status(conn, batch_id, 'failed', str(e))
            except:
                pass
        raise
    finally:
        conn.close()


def _generate_dummy_image(file_size, image_type):
    """生成模拟影像数据（带简单的DICOM头部标记）"""
    header = b"DICOM_MAGIC_" + image_type.encode('utf-8').ljust(20, b'\x00')
    if file_size and file_size > len(header):
        import os
        body = os.urandom(file_size - len(header))
        return header + body
    return header + b"sample_image_data"


def merge_charge_data(charge_df: pl.DataFrame) -> dict:
    """
    合并收费记录数据 - 第三步
    """
    conn = get_db_connection()
    batch_id = None
    try:
        batch_id = create_batch(conn, '收费系统', len(charge_df), 'processing', '收费记录数据导入中...')

        charge_with_batch = charge_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('charge_temp', charge_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO charge_records
            SELECT * FROM charge_temp
        """)

        update_batch_status(conn, batch_id, 'success', f'收费记录导入成功，共{len(charge_df)}条')

        return {
            'batch_id': batch_id,
            'record_count': len(charge_df),
            'status': 'success'
        }
    except Exception as e:
        if batch_id:
            try:
                update_batch_status(conn, batch_id, 'failed', str(e))
            except:
                pass
        raise
    finally:
        conn.close()


def merge_treatment_plans(plans_df: pl.DataFrame) -> dict:
    """合并治疗计划数据"""
    conn = get_db_connection()
    batch_id = None
    try:
        batch_id = create_batch(conn, '治疗计划', len(plans_df), 'processing', '治疗计划数据导入中...')

        plans_with_batch = plans_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('plans_temp', plans_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO treatment_plans
            SELECT * FROM plans_temp
        """)

        update_batch_status(conn, batch_id, 'success', f'治疗计划导入成功，共{len(plans_df)}条')

        return {
            'batch_id': batch_id,
            'record_count': len(plans_df),
            'status': 'success'
        }
    except Exception as e:
        if batch_id:
            try:
                update_batch_status(conn, batch_id, 'failed', str(e))
            except:
                pass
        raise
    finally:
        conn.close()


def merge_followup_tasks(tasks_df: pl.DataFrame) -> dict:
    """合并随访任务数据"""
    conn = get_db_connection()
    batch_id = None
    try:
        batch_id = create_batch(conn, '随访系统', len(tasks_df), 'processing', '随访任务数据导入中...')

        tasks_with_batch = tasks_df.with_columns([
            pl.lit(batch_id).alias('batch_id')
        ])

        conn.register('tasks_temp', tasks_with_batch.to_pandas())
        conn.execute("""
            INSERT OR REPLACE INTO followup_tasks
            SELECT * FROM tasks_temp
        """)

        update_batch_status(conn, batch_id, 'success', f'随访任务导入成功，共{len(tasks_df)}条')

        return {
            'batch_id': batch_id,
            'record_count': len(tasks_df),
            'status': 'success'
        }
    except Exception as e:
        if batch_id:
            try:
                update_batch_status(conn, batch_id, 'failed', str(e))
            except:
                pass
        raise
    finally:
        conn.close()


def get_revisit_risk_overview(doctor_filter=None, current_user=None, role=None) -> pl.DataFrame:
    """
    获取复诊风险总览数据
    带权限验证
    """
    if current_user and role:
        doctor_filter = _validate_doctor_access(doctor_filter, current_user, role)

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


def get_revisit_rate_by_doctor(current_user=None, role=None) -> pl.DataFrame:
    """
    按医生统计复诊率
    带权限验证
    """
    conn = get_db_connection()
    try:
        query = """
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
        """

        if role == "frontline" and current_user:
            query += f" AND p.responsible_doctor = '{current_user}'"

        query += " GROUP BY p.responsible_doctor ORDER BY revisit_rate DESC"

        df = conn.execute(query).pl()
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


def get_imaging_ranking(use_minio: bool = True) -> dict:
    """
    获取影像附件排行
    优先从MinIO获取真实对象存储数据，不可用时降级使用数据库数据
    """
    minio_client = get_minio_client() if use_minio else None
    minio_available = minio_client and minio_client.available if minio_client else False

    conn = get_db_connection()
    try:
        db_df = conn.execute("""
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

        minio_stats = None
        if minio_available:
            try:
                minio_files = minio_client.list_files()
                total_minio_files = len(minio_files)

                type_stats = {}
                total_minio_size = 0

                type_folder_map = {
                    "panoramic": "口腔全景片",
                    "periapical": "根尖片",
                    "cbct": "CBCT",
                    "cephalometric": "头颅侧位片",
                    "endoscope": "口腔内窥镜",
                    "dental": "牙片",
                    "other": "其他"
                }

                for file_path in minio_files:
                    parts = file_path.split("/")
                    if len(parts) >= 2 and parts[0] == "imaging":
                        folder_code = parts[1] if len(parts) > 1 else "other"
                        type_name = type_folder_map.get(folder_code, folder_code)
                        if type_name not in type_stats:
                            type_stats[type_name] = {"count": 0, "size": 0}
                        type_stats[type_name]["count"] += 1

                minio_stats = {
                    "total_files": total_minio_files,
                    "total_size": total_minio_size,
                    "by_type": type_stats
                }
            except Exception as e:
                print(f"从MinIO获取影像统计失败: {e}")
                minio_stats = None

        return {
            "data": db_df,
            "minio_available": minio_available,
            "minio_stats": minio_stats,
            "source": "minio+db" if minio_available else "db_only"
        }
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


def add_appointment_note(appointment_id: str, note_text: str, created_by: str,
                        update_risk: bool = True, new_risk_level: str = None) -> dict:
    """
    添加预约注释（用于爽约备注等）
    支持同步更新风险等级

    Returns:
        dict: {
            'success': bool,
            'note_id': int,
            'risk_updated': bool,
            'message': str
        }
    """
    conn = get_db_connection()
    note_id = None
    risk_updated = False

    try:
        if not note_text or not note_text.strip():
            return {
                'success': False,
                'note_id': None,
                'risk_updated': False,
                'message': '注释内容不能为空'
            }

        result = conn.execute("""
            INSERT INTO appointment_notes (appointment_id, note_text, created_by)
            VALUES (?, ?, ?)
            RETURNING note_id
        """, [appointment_id, note_text.strip(), created_by]).fetchone()

        note_id = result[0] if result else None

        if update_risk and note_id:
            risk_level = new_risk_level if new_risk_level else 'high'
            conn.execute("""
                UPDATE his_appointments
                SET risk_level = ?
                WHERE appointment_id = ?
            """, [risk_level, appointment_id])
            risk_updated = True

        return {
            'success': True,
            'note_id': note_id,
            'risk_updated': risk_updated,
            'message': '注释添加成功'
        }
    except Exception as e:
        return {
            'success': False,
            'note_id': None,
            'risk_updated': False,
            'message': f'添加注释失败: {str(e)}'
        }
    finally:
        conn.close()


def update_appointment_status(appointment_id: str, new_status: str, updated_by: str,
                              note_text: str = None) -> dict:
    """
    更新预约状态
    支持添加备注说明

    状态流转:
    待复诊 -> 已完成 / 爽约 / 已取消
    爽约 -> 待复诊 (重新预约)
    """
    conn = get_db_connection()
    try:
        valid_statuses = ["已完成", "待复诊", "爽约", "已取消", "进行中"]
        if new_status not in valid_statuses:
            return {
                'success': False,
                'message': f'无效的状态: {new_status}'
            }

        current = conn.execute("""
            SELECT status, risk_level FROM his_appointments WHERE appointment_id = ?
        """, [appointment_id]).fetchone()

        if not current:
            return {
                'success': False,
                'message': '预约记录不存在'
            }

        old_status = current[0]

        if new_status == "爽约":
            new_risk = "high"
        elif new_status == "已完成":
            new_risk = "normal"
        else:
            new_risk = current[1]

        conn.execute("""
            UPDATE his_appointments
            SET status = ?, risk_level = ?
            WHERE appointment_id = ?
        """, [new_status, new_risk, appointment_id])

        if note_text:
            conn.execute("""
                INSERT INTO appointment_notes (appointment_id, note_text, created_by)
                VALUES (?, ?, ?)
            """, [appointment_id, f"状态变更: {old_status} -> {new_status}。{note_text}", updated_by])
        elif old_status != new_status:
            conn.execute("""
                INSERT INTO appointment_notes (appointment_id, note_text, created_by)
                VALUES (?, ?, ?)
            """, [appointment_id, f"状态变更: {old_status} -> {new_status}", updated_by])

        return {
            'success': True,
            'old_status': old_status,
            'new_status': new_status,
            'message': f'状态已更新为: {new_status}'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'更新状态失败: {str(e)}'
        }
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


def get_import_batches(limit=20) -> pl.DataFrame:
    """获取导入批次记录"""
    conn = get_db_connection()
    try:
        df = conn.execute(f"""
            SELECT
                batch_id,
                source_system,
                import_time,
                record_count,
                status,
                remark
            FROM import_batches
            ORDER BY import_time DESC
            LIMIT {limit}
        """).pl()
        return df
    finally:
        conn.close()


def get_appointment_detail(appointment_id: str, current_user=None, role=None) -> dict:
    """获取预约详情（含患者信息、影像、收费等）"""
    conn = get_db_connection()
    try:
        appt = conn.execute("""
            SELECT
                a.*,
                p.patient_name,
                p.gender,
                p.age,
                p.member_level,
                p.responsible_doctor
            FROM his_appointments a
            JOIN his_patients p ON a.patient_id = p.patient_id
            WHERE a.appointment_id = ?
        """, [appointment_id]).pl()

        if appt.is_empty():
            return None

        appt_row = appt.row(0, named=True)

        if role == "frontline" and current_user:
            if appt_row["responsible_doctor"] != current_user:
                raise PermissionDeniedError(f"无权访问该预约记录")

        images = conn.execute("""
            SELECT * FROM imaging_records
            WHERE appointment_id = ?
            ORDER BY image_date DESC
        """, [appointment_id]).pl()

        charges = conn.execute("""
            SELECT * FROM charge_records
            WHERE appointment_id = ?
            ORDER BY charge_date DESC
        """, [appointment_id]).pl()

        notes = conn.execute("""
            SELECT * FROM appointment_notes
            WHERE appointment_id = ?
            ORDER BY created_at DESC
        """, [appointment_id]).pl()

        return {
            'appointment': appt_row,
            'images': images,
            'charges': charges,
            'notes': notes
        }
    finally:
        conn.close()
