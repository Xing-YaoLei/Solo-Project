"""
数据库连接和Schema管理模块
基于DuckDB构建

注意: DuckDB作为分析型数据库，外键约束支持有限
本设计保留逻辑关联关系，通过业务代码保证数据一致性
"""
import duckdb
import os
from pathlib import Path
from src.config import Config


def get_db_connection():
    """获取数据库连接"""
    db_path = Path(Config.DB_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = duckdb.connect(str(db_path))
    return conn


def init_database():
    """初始化数据库Schema"""
    conn = get_db_connection()

    conn.execute("""
        CREATE SEQUENCE IF NOT EXISTS batch_id_seq START 1;
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS import_batches (
            batch_id INTEGER PRIMARY KEY DEFAULT nextval('batch_id_seq'),
            source_system VARCHAR NOT NULL,
            import_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            record_count INTEGER NOT NULL DEFAULT 0,
            status VARCHAR NOT NULL DEFAULT 'success',
            remark VARCHAR
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS his_patients (
            patient_id VARCHAR PRIMARY KEY,
            patient_name VARCHAR NOT NULL,
            gender VARCHAR,
            age INTEGER,
            phone VARCHAR,
            member_level VARCHAR,
            register_date DATE,
            responsible_doctor VARCHAR,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS his_appointments (
            appointment_id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time VARCHAR,
            department VARCHAR,
            doctor_name VARCHAR,
            treatment_type VARCHAR,
            status VARCHAR NOT NULL DEFAULT '待复诊',
            is_member BOOLEAN DEFAULT true,
            risk_level VARCHAR DEFAULT 'normal',
            next_appointment_date DATE,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS appointment_notes (
            note_id INTEGER PRIMARY KEY DEFAULT nextval('batch_id_seq'),
            appointment_id VARCHAR NOT NULL,
            note_text TEXT NOT NULL,
            created_by VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS imaging_records (
            image_id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL,
            appointment_id VARCHAR,
            image_type VARCHAR,
            image_date DATE NOT NULL,
            file_path VARCHAR,
            file_size BIGINT,
            description VARCHAR,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS charge_records (
            charge_id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL,
            appointment_id VARCHAR,
            charge_date DATE NOT NULL,
            treatment_item VARCHAR,
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR,
            is_paid BOOLEAN DEFAULT true,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS treatment_plans (
            plan_id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL,
            plan_name VARCHAR NOT NULL,
            treatment_type VARCHAR,
            total_sessions INTEGER,
            completed_sessions INTEGER DEFAULT 0,
            plan_date DATE,
            expected_end_date DATE,
            status VARCHAR DEFAULT '进行中',
            doctor_name VARCHAR,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS followup_tasks (
            task_id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL,
            appointment_id VARCHAR,
            task_type VARCHAR NOT NULL,
            task_status VARCHAR NOT NULL DEFAULT '待处理',
            assigned_to VARCHAR,
            create_date DATE NOT NULL,
            due_date DATE,
            complete_date DATE,
            batch_id INTEGER
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS system_users (
            user_id VARCHAR PRIMARY KEY,
            user_name VARCHAR NOT NULL,
            role VARCHAR NOT NULL,
            department VARCHAR,
            is_active BOOLEAN DEFAULT true
        );
    """)

    conn.close()


def create_batch(conn, source_system, record_count=0, status='success', remark=None):
    """创建导入批次记录"""
    result = conn.execute("""
        INSERT INTO import_batches (source_system, record_count, status, remark)
        VALUES (?, ?, ?, ?)
        RETURNING batch_id
    """, [source_system, record_count, status, remark]).fetchone()
    return result[0] if result else None


def update_batch_status(conn, batch_id, status, remark=None):
    """更新批次状态"""
    if remark:
        conn.execute("""
            UPDATE import_batches
            SET status = ?, remark = ?
            WHERE batch_id = ?
        """, [status, remark, batch_id])
    else:
        conn.execute("""
            UPDATE import_batches
            SET status = ?
            WHERE batch_id = ?
        """, [status, batch_id])


def get_latest_batch(conn, source_system):
    """获取指定系统的最新批次"""
    result = conn.execute("""
        SELECT batch_id, import_time, record_count, status
        FROM import_batches
        WHERE source_system = ?
        ORDER BY import_time DESC
        LIMIT 1
    """, [source_system]).fetchone()
    return result
