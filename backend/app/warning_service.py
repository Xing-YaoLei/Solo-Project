from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import duckdb

from . import models, schemas
from .analytics_service import AnalyticsService


class WarningService:
    def __init__(self, db: Session, duckdb_conn: duckdb.DuckDBPyConnection):
        self.db = db
        self.analytics = AnalyticsService(duckdb_conn, db)
        self._init_default_thresholds()

    def _init_default_thresholds(self):
        default_thresholds = [
            {
                'metric_name': '影像归档覆盖率',
                'metric_code': 'archive_coverage',
                'warning_threshold': 70.0,
                'critical_threshold': 50.0,
                'operator': '<=',
                'unit': '%',
                'description': '有影像归档的患者占总患者的比例',
                'category': '归档质量'
            },
            {
                'metric_name': '单患者平均影像数',
                'metric_code': 'avg_images_per_patient',
                'warning_threshold': 5.0,
                'critical_threshold': 2.0,
                'operator': '<=',
                'unit': '张',
                'description': '每个有影像患者的平均影像数量',
                'category': '归档质量'
            },
            {
                'metric_name': '病历影像附件率',
                'metric_code': 'image_attachment_rate',
                'warning_threshold': 60.0,
                'critical_threshold': 40.0,
                'operator': '<=',
                'unit': '%',
                'description': '附有影像的病历占总病历的比例',
                'category': '病历质量'
            },
            {
                'metric_name': '治疗计划完成率',
                'metric_code': 'plan_completion_rate',
                'warning_threshold': 70.0,
                'critical_threshold': 50.0,
                'operator': '<=',
                'unit': '%',
                'description': '已完成治疗计划占总计划的比例',
                'category': '治疗质量'
            },
            {
                'metric_name': '患者爽约率',
                'metric_code': 'no_show_rate',
                'warning_threshold': 10.0,
                'critical_threshold': 20.0,
                'operator': '>=',
                'unit': '%',
                'description': '爽约预约占总预约的比例',
                'category': '预约管理'
            },
            {
                'metric_code': 'daily_archive_volume',
                'metric_name': '日均影像归档量',
                'warning_threshold': 100.0,
                'critical_threshold': 50.0,
                'operator': '<=',
                'unit': '张',
                'description': '每日平均影像归档数量',
                'category': '归档质量'
            },
            {
                'metric_code': 'caliber_conflict_count',
                'metric_name': '口径冲突数量',
                'warning_threshold': 5.0,
                'critical_threshold': 15.0,
                'operator': '>=',
                'unit': '条',
                'description': '待处理的口径冲突记录数量',
                'category': '数据质量'
            }
        ]

        for threshold in default_thresholds:
            existing = self.db.query(models.WarningThreshold).filter(
                models.WarningThreshold.metric_code == threshold['metric_code']
            ).first()
            if not existing:
                db_threshold = models.WarningThreshold(**threshold)
                self.db.add(db_threshold)
        self.db.commit()

    def get_all_thresholds(self, category: Optional[str] = None, enabled_only: bool = True) -> List[models.WarningThreshold]:
        query = self.db.query(models.WarningThreshold)
        if category:
            query = query.filter(models.WarningThreshold.category == category)
        if enabled_only:
            query = query.filter(models.WarningThreshold.is_enabled == True)
        return query.order_by(models.WarningThreshold.category, models.WarningThreshold.metric_name).all()

    def create_threshold(self, threshold_data: schemas.WarningThresholdCreate) -> models.WarningThreshold:
        threshold = models.WarningThreshold(**threshold_data.model_dump())
        self.db.add(threshold)
        self.db.commit()
        self.db.refresh(threshold)
        return threshold

    def update_threshold(self, threshold_id: int, update_data: schemas.WarningThresholdUpdate) -> Optional[models.WarningThreshold]:
        threshold = self.db.query(models.WarningThreshold).filter(
            models.WarningThreshold.id == threshold_id
        ).first()
        if not threshold:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(threshold, key, value)

        self.db.commit()
        self.db.refresh(threshold)
        return threshold

    def delete_threshold(self, threshold_id: int) -> bool:
        threshold = self.db.query(models.WarningThreshold).filter(
            models.WarningThreshold.id == threshold_id
        ).first()
        if not threshold:
            return False

        self.db.delete(threshold)
        self.db.commit()
        return True

    def _get_metric_value(self, metric_code: str) -> Optional[float]:
        try:
            if metric_code == 'archive_coverage':
                stats = self.analytics.get_patient_archive_stats()
                return stats.get('archive_coverage_rate', 0.0)

            elif metric_code == 'avg_images_per_patient':
                stats = self.analytics.get_patient_archive_stats()
                return stats.get('avg_images_per_patient', 0.0)

            elif metric_code == 'image_attachment_rate':
                stats = self.analytics.get_medical_record_stats()
                return stats.get('image_attachment_rate', 0.0)

            elif metric_code == 'plan_completion_rate':
                stats = self.analytics.get_treatment_plan_stats()
                return stats.get('completion_rate', 0.0)

            elif metric_code == 'no_show_rate':
                total_appointments = self.db.query(models.Appointment).count()
                no_show_count = self.db.query(models.Appointment).filter(
                    models.Appointment.is_no_show == True
                ).count()
                return round(no_show_count / total_appointments * 100, 2) if total_appointments > 0 else 0.0

            elif metric_code == 'daily_archive_volume':
                daily_data = self.analytics.get_daily_archive_volume(days=7)
                if daily_data:
                    avg = sum(d['total_images'] for d in daily_data) / len(daily_data)
                    return round(avg, 2)
                return 0.0

            elif metric_code == 'caliber_conflict_count':
                return float(self.db.query(models.CaliberConflict).filter(
                    models.CaliberConflict.resolution_status == 'pending'
                ).count())

            return None
        except Exception as e:
            print(f"Error getting metric value for {metric_code}: {e}")
            return None

    def _check_threshold(self, value: float, threshold: models.WarningThreshold) -> Optional[str]:
        op = threshold.operator
        warning_thresh = threshold.warning_threshold
        critical_thresh = threshold.critical_threshold

        def compare(a: float, op: str, b: float) -> bool:
            ops = {
                '>': a > b,
                '>=': a >= b,
                '<': a < b,
                '<=': a <= b,
                '==': a == b,
                '!=': a != b
            }
            return ops.get(op, False)

        if critical_thresh is not None:
            if compare(value, op, critical_thresh):
                return 'critical'

        if compare(value, op, warning_thresh):
            return 'warning'

        return None

    def check_all_warnings(self) -> List[schemas.WarningAlert]:
        alerts = []
        thresholds = self.get_all_thresholds(enabled_only=True)

        for threshold in thresholds:
            current_value = self._get_metric_value(threshold.metric_code)
            if current_value is None:
                continue

            level = self._check_threshold(current_value, threshold)
            if level:
                message = self._build_alert_message(threshold, current_value, level)
                alert = schemas.WarningAlert(
                    metric_code=threshold.metric_code,
                    metric_name=threshold.metric_name,
                    current_value=current_value,
                    threshold=threshold.critical_threshold if level == 'critical' else threshold.warning_threshold,
                    level=level,
                    message=message,
                    timestamp=datetime.utcnow()
                )
                alerts.append(alert)

        alerts.sort(key=lambda x: 0 if x.level == 'critical' else 1)
        return alerts

    def _build_alert_message(self, threshold: models.WarningThreshold, current_value: float, level: str) -> str:
        unit = threshold.unit or ''
        thresh = threshold.critical_threshold if level == 'critical' else threshold.warning_threshold
        level_text = '严重' if level == 'critical' else '预警'

        return f"{level_text}：{threshold.metric_name} 当前值为 {current_value}{unit}，{threshold.operator} 阈值 {thresh}{unit}。{threshold.description}"

    def generate_no_show_review_materials(self, patient_id: str) -> Optional[Dict[str, Any]]:
        patient = self.db.query(models.Patient).filter(
            models.Patient.patient_id == patient_id
        ).first()
        if not patient:
            return None

        no_show_appointments = self.db.query(models.Appointment).filter(
            models.Appointment.patient_id == patient_id,
            models.Appointment.is_no_show == True
        ).order_by(models.Appointment.appointment_date.desc()).all()

        completed_appointments = self.db.query(models.Appointment).filter(
            models.Appointment.patient_id == patient_id,
            models.Appointment.status == 'completed',
            models.Appointment.is_no_show == False
        ).order_by(models.Appointment.appointment_date.desc()).all()

        no_show_count = len(no_show_appointments)
        total_appointments = no_show_count + len(completed_appointments)
        no_show_rate = round(no_show_count / total_appointments * 100, 2) if total_appointments > 0 else 0

        follow_up_appointments = self.db.query(models.Appointment).filter(
            models.Appointment.patient_id == patient_id,
            models.Appointment.appointment_date > no_show_appointments[0].appointment_date if no_show_appointments else datetime.min,
            models.Appointment.status == 'completed'
        ).count()

        last_no_show = no_show_appointments[0] if no_show_appointments else None

        medical_records = self.db.query(models.MedicalRecord).filter(
            models.MedicalRecord.patient_id == patient_id
        ).order_by(models.MedicalRecord.visit_date.desc()).limit(5).all()

        images = self.db.query(models.ImageRecord).filter(
            models.ImageRecord.patient_id == patient_id
        ).order_by(models.ImageRecord.study_date.desc()).limit(5).all()

        treatment_plans = self.db.query(models.TreatmentPlan).join(
            models.MedicalRecord
        ).filter(
            models.MedicalRecord.patient_id == patient_id
        ).order_by(models.TreatmentPlan.created_at.desc()).limit(3).all()

        materials = {
            'patient_info': {
                'patient_id': patient.patient_id,
                'name': patient.name,
                'gender': patient.gender,
                'phone': patient.phone,
                'first_visit_date': patient.first_visit_date.isoformat() if patient.first_visit_date else None
            },
            'no_show_summary': {
                'total_no_shows': no_show_count,
                'total_appointments': total_appointments,
                'no_show_rate': no_show_rate,
                'follow_up_count': follow_up_appointments,
                'follow_up_rate': round(follow_up_appointments / no_show_count * 100, 2) if no_show_count > 0 else 0,
                'last_no_show_date': last_no_show.appointment_date.isoformat() if last_no_show else None,
                'last_no_show_type': last_no_show.treatment_type if last_no_show else None
            },
            'historical_no_shows': [
                {
                    'date': appt.appointment_date.isoformat(),
                    'department': appt.department,
                    'treatment_type': appt.treatment_type,
                    'doctor': appt.doctor
                }
                for appt in no_show_appointments
            ],
            'recent_visits': [
                {
                    'date': appt.appointment_date.isoformat(),
                    'department': appt.department,
                    'treatment_type': appt.treatment_type,
                    'doctor': appt.doctor
                }
                for appt in completed_appointments[:5]
            ],
            'recent_medical_records': [
                {
                    'date': rec.visit_date.isoformat(),
                    'diagnosis': rec.diagnosis,
                    'treatment_summary': rec.treatment_summary,
                    'department': rec.department
                }
                for rec in medical_records
            ],
            'recent_images': [
                {
                    'date': img.study_date.isoformat(),
                    'image_type': img.image_type,
                    'body_part': img.body_part,
                    'study_description': img.study_description
                }
                for img in images
            ],
            'active_treatment_plans': [
                {
                    'plan_name': plan.plan_name,
                    'plan_description': plan.plan_description,
                    'priority': plan.priority,
                    'status': plan.status,
                    'estimated_cost': plan.estimated_cost
                }
                for plan in treatment_plans
            ],
            'review_suggestions': self._generate_review_suggestions(no_show_count, no_show_rate, follow_up_appointments)
        }

        return materials

    def _generate_review_suggestions(self, no_show_count: int, no_show_rate: float, follow_up_count: int) -> List[str]:
        suggestions = []

        if no_show_count >= 3:
            suggestions.append('患者爽约次数较多，建议主动电话联系了解原因，考虑建立预约提醒机制')

        if no_show_rate >= 30:
            suggestions.append('患者爽约率超过30%，属于高风险患者，建议纳入重点关注名单')

        if follow_up_count == 0 and no_show_count >= 1:
            suggestions.append('患者爽约后未复诊，建议主动回访，了解治疗需求是否变化')

        suggestions.append('复核患者联系方式准确性，确保预约提醒能够送达')
        suggestions.append('评估患者治疗方案复杂度，是否需要调整预约时间或分阶段治疗')
        suggestions.append('检查影像归档完整性，确保爽约当日如有影像已正确归档')

        return suggestions

    def create_no_show_review(self, patient_id: str, appointment_id: Optional[str] = None) -> Optional[models.NoShowReview]:
        materials = self.generate_no_show_review_materials(patient_id)
        if not materials:
            return None

        no_show_date = materials['no_show_summary']['last_no_show_date']
        if not no_show_date:
            no_show_date = datetime.utcnow()
        else:
            no_show_date = datetime.fromisoformat(no_show_date)

        review = models.NoShowReview(
            review_id=f"REVIEW_{datetime.utcnow().strftime('%Y%m%d')}_{patient_id}",
            patient_id=patient_id,
            appointment_id=appointment_id,
            no_show_date=no_show_date,
            follow_up_rate=materials['no_show_summary']['follow_up_rate'],
            historical_no_show_count=materials['no_show_summary']['total_no_shows'],
            review_materials=materials,
            review_status='pending'
        )

        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_pending_reviews(self) -> List[models.NoShowReview]:
        return self.db.query(models.NoShowReview).filter(
            models.NoShowReview.review_status == 'pending'
        ).order_by(models.NoShowReview.created_at.desc()).all()

    def update_review_status(self, review_id: int, status: str, reviewer: Optional[str] = None, notes: Optional[str] = None) -> Optional[models.NoShowReview]:
        review = self.db.query(models.NoShowReview).filter(
            models.NoShowReview.id == review_id
        ).first()
        if not review:
            return None

        review.review_status = status
        if reviewer:
            review.reviewer = reviewer
        if notes:
            review.review_notes = notes

        self.db.commit()
        self.db.refresh(review)
        return review
