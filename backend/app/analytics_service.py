import duckdb
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session

from . import models


class AnalyticsService:
    def __init__(self, duckdb_conn: duckdb.DuckDBPyConnection, pg_db: Session):
        self.conn = duckdb_conn
        self.pg_db = pg_db
        self._init_duckdb_tables()
        self._sync_data_from_pg()

    def _init_duckdb_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS image_archive_trend (
                date DATE,
                patient_id VARCHAR,
                image_type VARCHAR,
                image_count INTEGER,
                file_size_mb DOUBLE,
                department VARCHAR,
                source_system VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS patient_visits (
                date DATE,
                patient_id VARCHAR,
                visit_type VARCHAR,
                department VARCHAR,
                doctor VARCHAR,
                has_image BOOLEAN
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS treatment_plans_analytics (
                date DATE,
                patient_id VARCHAR,
                plan_id VARCHAR,
                plan_name VARCHAR,
                priority VARCHAR,
                status VARCHAR,
                estimated_cost DOUBLE,
                department VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS medical_records_analytics (
                date DATE,
                patient_id VARCHAR,
                record_id VARCHAR,
                diagnosis VARCHAR,
                department VARCHAR,
                has_treatment_plan BOOLEAN,
                has_image BOOLEAN
            )
        """)

    def _sync_data_from_pg(self):
        images = self.pg_db.query(models.ImageRecord).all()
        if images:
            image_data = []
            for img in images:
                image_data.append({
                    'date': img.study_date.date() if img.study_date else None,
                    'patient_id': img.patient_id,
                    'image_type': img.image_type,
                    'image_count': img.image_count,
                    'file_size_mb': img.file_size_mb,
                    'department': self._get_patient_department(img.patient_id),
                    'source_system': img.source_system
                })
            if image_data:
                df = pd.DataFrame(image_data)
                self.conn.execute("DELETE FROM image_archive_trend")
                self.conn.execute("INSERT INTO image_archive_trend SELECT * FROM df")

        appointments = self.pg_db.query(models.Appointment).all()
        if appointments:
            visit_data = []
            for appt in appointments:
                has_image = self.pg_db.query(models.ImageRecord).filter(
                    models.ImageRecord.patient_id == appt.patient_id
                ).first() is not None
                visit_data.append({
                    'date': appt.appointment_date.date() if appt.appointment_date else None,
                    'patient_id': appt.patient_id,
                    'visit_type': appt.treatment_type,
                    'department': appt.department,
                    'doctor': appt.doctor,
                    'has_image': has_image
                })
            if visit_data:
                df = pd.DataFrame(visit_data)
                self.conn.execute("DELETE FROM patient_visits")
                self.conn.execute("INSERT INTO patient_visits SELECT * FROM df")

        plans = self.pg_db.query(models.TreatmentPlan).all()
        if plans:
            plan_data = []
            for plan in plans:
                record = self.pg_db.query(models.MedicalRecord).filter(
                    models.MedicalRecord.record_id == plan.record_id
                ).first()
                plan_data.append({
                    'date': plan.created_at.date() if plan.created_at else None,
                    'patient_id': record.patient_id if record else None,
                    'plan_id': plan.plan_id,
                    'plan_name': plan.plan_name,
                    'priority': plan.priority,
                    'status': plan.status,
                    'estimated_cost': plan.estimated_cost,
                    'department': record.department if record else None
                })
            if plan_data:
                df = pd.DataFrame(plan_data)
                self.conn.execute("DELETE FROM treatment_plans_analytics")
                self.conn.execute("INSERT INTO treatment_plans_analytics SELECT * FROM df")

        records = self.pg_db.query(models.MedicalRecord).all()
        if records:
            record_data = []
            for rec in records:
                has_plan = self.pg_db.query(models.TreatmentPlan).filter(
                    models.TreatmentPlan.record_id == rec.record_id
                ).first() is not None
                has_image = self.pg_db.query(models.ImageRecord).filter(
                    models.ImageRecord.patient_id == rec.patient_id
                ).first() is not None
                record_data.append({
                    'date': rec.visit_date.date() if rec.visit_date else None,
                    'patient_id': rec.patient_id,
                    'record_id': rec.record_id,
                    'diagnosis': rec.diagnosis,
                    'department': rec.department,
                    'has_treatment_plan': has_plan,
                    'has_image': has_image
                })
            if record_data:
                df = pd.DataFrame(record_data)
                self.conn.execute("DELETE FROM medical_records_analytics")
                self.conn.execute("INSERT INTO medical_records_analytics SELECT * FROM df")

    def _get_patient_department(self, patient_id: str) -> Optional[str]:
        appt = self.pg_db.query(models.Appointment).filter(
            models.Appointment.patient_id == patient_id
        ).order_by(models.Appointment.appointment_date.desc()).first()
        return appt.department if appt else None

    def get_image_archive_trend(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: str = 'monthly'
    ) -> List[Dict[str, Any]]:
        date_format = {
            'daily': '%Y-%m-%d',
            'weekly': '%Y-W%W',
            'monthly': '%Y-%m',
            'quarterly': '%Y-Q%Q',
            'yearly': '%Y'
        }.get(period, '%Y-%m')

        date_trunc = {
            'daily': 'day',
            'weekly': 'week',
            'monthly': 'month',
            'quarterly': 'quarter',
            'yearly': 'year'
        }.get(period, 'month')

        where_clause = ""
        params = {}
        if start_date:
            where_clause += " AND date >= ? "
            params['start_date'] = start_date
        if end_date:
            where_clause += " AND date <= ? "
            params['end_date'] = end_date

        query = f"""
            SELECT
                DATE_TRUNC('{date_trunc}', date) as period_date,
                COUNT(DISTINCT patient_id) as patient_count,
                SUM(image_count) as total_images,
                SUM(file_size_mb) as total_size_mb,
                COUNT(*) as study_count
            FROM image_archive_trend
            WHERE date IS NOT NULL {where_clause}
            GROUP BY period_date
            ORDER BY period_date
        """

        result = self.conn.execute(query, list(params.values())).fetchdf()

        trend_data = []
        for _, row in result.iterrows():
            period_date = row['period_date']
            if isinstance(period_date, str):
                period_date = datetime.strptime(period_date[:10], '%Y-%m-%d')
            trend_data.append({
                'date': period_date.strftime(date_format),
                'patient_count': int(row['patient_count']),
                'total_images': int(row['total_images']),
                'total_size_mb': float(row['total_size_mb']),
                'study_count': int(row['study_count'])
            })

        return trend_data

    def get_image_type_distribution(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND date >= ? "
            params.append(start_date)
        if end_date:
            where_clause += " AND date <= ? "
            params.append(end_date)

        query = f"""
            SELECT
                COALESCE(image_type, '未知') as image_type,
                COUNT(*) as count,
                SUM(image_count) as total_images,
                SUM(file_size_mb) as total_size_mb
            FROM image_archive_trend
            WHERE date IS NOT NULL {where_clause}
            GROUP BY image_type
            ORDER BY count DESC
        """

        result = self.conn.execute(query, params).fetchdf()

        return [
            {
                'image_type': row['image_type'],
                'count': int(row['count']),
                'total_images': int(row['total_images']),
                'total_size_mb': float(row['total_size_mb'])
            }
            for _, row in result.iterrows()
        ]

    def get_patient_archive_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND date >= ? "
            params.append(start_date)
        if end_date:
            where_clause += " AND date <= ? "
            params.append(end_date)

        total_patients = self.pg_db.query(models.Patient).count()

        patients_with_images = self.conn.execute(f"""
            SELECT COUNT(DISTINCT patient_id) as count
            FROM image_archive_trend
            WHERE date IS NOT NULL {where_clause}
        """, params).fetchone()[0]

        avg_images_per_patient = self.conn.execute(f"""
            SELECT AVG(image_count) as avg
            FROM (
                SELECT patient_id, SUM(image_count) as image_count
                FROM image_archive_trend
                WHERE date IS NOT NULL {where_clause}
                GROUP BY patient_id
            )
        """, params).fetchone()[0] or 0

        return {
            'total_patients': total_patients,
            'patients_with_archive': int(patients_with_images),
            'archive_coverage_rate': round(int(patients_with_images) / total_patients * 100, 2) if total_patients > 0 else 0,
            'avg_images_per_patient': round(float(avg_images_per_patient), 2)
        }

    def get_medical_record_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND date >= ? "
            params.append(start_date)
        if end_date:
            where_clause += " AND date <= ? "
            params.append(end_date)

        total_records = self.conn.execute(f"""
            SELECT COUNT(*) FROM medical_records_analytics
            WHERE date IS NOT NULL {where_clause}
        """, params).fetchone()[0]

        records_with_images = self.conn.execute(f"""
            SELECT COUNT(*) FROM medical_records_analytics
            WHERE date IS NOT NULL AND has_image = true {where_clause}
        """, params).fetchone()[0]

        records_with_plans = self.conn.execute(f"""
            SELECT COUNT(*) FROM medical_records_analytics
            WHERE date IS NOT NULL AND has_treatment_plan = true {where_clause}
        """, params).fetchone()[0]

        top_diagnoses = self.conn.execute(f"""
            SELECT diagnosis, COUNT(*) as count
            FROM medical_records_analytics
            WHERE date IS NOT NULL AND diagnosis IS NOT NULL {where_clause}
            GROUP BY diagnosis
            ORDER BY count DESC
            LIMIT 10
        """, params).fetchdf()

        dept_dist = self.conn.execute(f"""
            SELECT COALESCE(department, '未知') as dept, COUNT(*) as count
            FROM medical_records_analytics
            WHERE date IS NOT NULL {where_clause}
            GROUP BY department
            ORDER BY count DESC
        """, params).fetchdf()

        return {
            'total_records': int(total_records),
            'records_with_images': int(records_with_images),
            'records_with_treatment_plans': int(records_with_plans),
            'image_attachment_rate': round(int(records_with_images) / int(total_records) * 100, 2) if total_records > 0 else 0,
            'top_diagnoses': [
                {'diagnosis': row['diagnosis'], 'count': int(row['count'])}
                for _, row in top_diagnoses.iterrows()
            ],
            'department_distribution': {
                row['dept']: int(row['count'])
                for _, row in dept_dist.iterrows()
            }
        }

    def get_treatment_plan_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND date >= ? "
            params.append(start_date)
        if end_date:
            where_clause += " AND date <= ? "
            params.append(end_date)

        total_plans = self.conn.execute(f"""
            SELECT COUNT(*) FROM treatment_plans_analytics
            WHERE date IS NOT NULL {where_clause}
        """, params).fetchone()[0]

        completed_plans = self.conn.execute(f"""
            SELECT COUNT(*) FROM treatment_plans_analytics
            WHERE date IS NOT NULL AND status = 'completed' {where_clause}
        """, params).fetchone()[0]

        pending_plans = self.conn.execute(f"""
            SELECT COUNT(*) FROM treatment_plans_analytics
            WHERE date IS NOT NULL AND status = 'pending' {where_clause}
        """, params).fetchone()[0]

        avg_cost = self.conn.execute(f"""
            SELECT AVG(estimated_cost) FROM treatment_plans_analytics
            WHERE date IS NOT NULL {where_clause}
        """, params).fetchone()[0] or 0

        priority_dist = self.conn.execute(f"""
            SELECT priority, COUNT(*) as count
            FROM treatment_plans_analytics
            WHERE date IS NOT NULL {where_clause}
            GROUP BY priority
        """, params).fetchdf()

        return {
            'total_plans': int(total_plans),
            'completed_plans': int(completed_plans),
            'pending_plans': int(pending_plans),
            'avg_estimated_cost': round(float(avg_cost), 2),
            'completion_rate': round(int(completed_plans) / int(total_plans) * 100, 2) if total_plans > 0 else 0,
            'priority_distribution': {
                row['priority']: int(row['count'])
                for _, row in priority_dist.iterrows()
            }
        }

    def get_department_archive_trend(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND date >= ? "
            params.append(start_date)
        if end_date:
            where_clause += " AND date <= ? "
            params.append(end_date)

        query = f"""
            SELECT
                DATE_TRUNC('month', date) as month,
                COALESCE(department, '未知') as department,
                SUM(image_count) as total_images,
                COUNT(DISTINCT patient_id) as patient_count
            FROM image_archive_trend
            WHERE date IS NOT NULL {where_clause}
            GROUP BY month, department
            ORDER BY month, department
        """

        result = self.conn.execute(query, params).fetchdf()

        return [
            {
                'month': row['month'].strftime('%Y-%m') if isinstance(row['month'], datetime) else str(row['month'])[:7],
                'department': row['department'],
                'total_images': int(row['total_images']),
                'patient_count': int(row['patient_count'])
            }
            for _, row in result.iterrows()
        ]

    def get_patient_gender_age_distribution(self) -> Dict[str, Any]:
        patients = self.pg_db.query(models.Patient).all()

        gender_dist = {'男': 0, '女': 0, '未知': 0}
        age_dist = {'0-18': 0, '19-35': 0, '36-55': 0, '56+': 0, '未知': 0}

        today = datetime.now().date()

        for patient in patients:
            gender = patient.gender or '未知'
            if gender in gender_dist:
                gender_dist[gender] += 1
            else:
                gender_dist['未知'] += 1

            if patient.birth_date:
                try:
                    age = today.year - patient.birth_date.year
                    if today.month < patient.birth_date.month or (today.month == patient.birth_date.month and today.day < patient.birth_date.day):
                        age -= 1

                    if age <= 18:
                        age_dist['0-18'] += 1
                    elif age <= 35:
                        age_dist['19-35'] += 1
                    elif age <= 55:
                        age_dist['36-55'] += 1
                    else:
                        age_dist['56+'] += 1
                except (TypeError, ValueError):
                    age_dist['未知'] += 1
            else:
                age_dist['未知'] += 1

        return {
            'gender_distribution': gender_dist,
            'age_distribution': age_dist
        }

    def get_no_show_follow_up_analysis(self) -> Dict[str, Any]:
        appointments = self.pg_db.query(models.Appointment).filter(
            models.Appointment.is_no_show == True
        ).all()

        total_no_shows = len(appointments)

        follow_up_count = 0
        patient_follow_up = {}

        for appt in appointments:
            patient_id = appt.patient_id
            if patient_id not in patient_follow_up:
                patient_follow_up[patient_id] = {'no_shows': 0, 'follow_ups': 0}

            patient_follow_up[patient_id]['no_shows'] += 1

            subsequent = self.pg_db.query(models.Appointment).filter(
                models.Appointment.patient_id == patient_id,
                models.Appointment.appointment_date > appt.appointment_date,
                models.Appointment.is_no_show == False,
                models.Appointment.status == 'completed'
            ).count()

            if subsequent > 0:
                follow_up_count += 1
                patient_follow_up[patient_id]['follow_ups'] += 1

        overall_follow_up_rate = round(follow_up_count / total_no_shows * 100, 2) if total_no_shows > 0 else 0

        high_risk_patients = []
        for pid, data in patient_follow_up.items():
            if data['no_shows'] >= 2:
                rate = round(data['follow_ups'] / data['no_shows'] * 100, 2) if data['no_shows'] > 0 else 0
                patient = self.pg_db.query(models.Patient).filter(
                    models.Patient.patient_id == pid
                ).first()
                high_risk_patients.append({
                    'patient_id': pid,
                    'patient_name': patient.name if patient else '未知',
                    'no_show_count': data['no_shows'],
                    'follow_up_count': data['follow_ups'],
                    'follow_up_rate': rate
                })

        high_risk_patients.sort(key=lambda x: x['no_show_count'], reverse=True)

        return {
            'total_no_shows': total_no_shows,
            'follow_up_count': follow_up_count,
            'overall_follow_up_rate': overall_follow_up_rate,
            'high_risk_patients': high_risk_patients[:20]
        }

    def get_daily_archive_volume(self, days: int = 30) -> List[Dict[str, Any]]:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)

        query = """
            SELECT
                date,
                SUM(image_count) as total_images,
                SUM(file_size_mb) as total_size_mb,
                COUNT(DISTINCT patient_id) as patient_count
            FROM image_archive_trend
            WHERE date >= ? AND date <= ?
            GROUP BY date
            ORDER BY date
        """

        result = self.conn.execute(query, [start_date, end_date]).fetchdf()

        return [
            {
                'date': row['date'].strftime('%Y-%m-%d'),
                'total_images': int(row['total_images']),
                'total_size_mb': round(float(row['total_size_mb']), 2),
                'patient_count': int(row['patient_count'])
            }
            for _, row in result.iterrows()
        ]

    def refresh_analytics(self):
        self._sync_data_from_pg()
        return {'status': 'success', 'message': '分析数据已刷新'}
