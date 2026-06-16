import pandas as pd
import numpy as np
from datetime import date, timedelta
from sqlalchemy import func, and_
from database.models import (
    TreatmentPlan, TreatmentRecord, PaymentRecord, MedicalRecord,
    AttendanceRecord, InsuranceClaim, Patient, AnomalyMarker
)
from config.settings import settings


class MetricsCalculator:
    def __init__(self, db_session):
        self.db = db_session

    def calculate_all_metrics(self, target_date):
        metrics = {
            "treatment_completion_rate": self.calculate_treatment_completion_rate(target_date),
            "payment_delay_rate": self.calculate_payment_delay_rate(target_date),
            "medical_record_completeness": self.calculate_medical_record_completeness(target_date),
            "punch_card_consistency": self.calculate_punch_card_consistency(target_date),
            "insurance_rejection_rate": self.calculate_insurance_rejection_rate(target_date),
        }
        metrics["overall_risk_score"] = self.calculate_overall_risk_score(metrics)
        metrics["anomaly_count"] = self.count_anomalies(target_date)
        return metrics

    def calculate_treatment_completion_rate(self, target_date):
        start_date = target_date - timedelta(days=6)

        plans = self.db.query(TreatmentPlan).filter(
            and_(
                TreatmentPlan.plan_date >= start_date,
                TreatmentPlan.plan_date <= target_date,
            )
        ).all()

        if not plans:
            return 0.0

        total_planned = sum(p.planned_sessions for p in plans)
        total_completed = sum(p.completed_sessions for p in plans)

        if total_planned == 0:
            return 0.0

        return round((total_completed / total_planned) * 100, 2)

    def calculate_payment_delay_rate(self, target_date):
        payments = self.db.query(PaymentRecord).filter(
            and_(
                PaymentRecord.payment_date <= target_date,
                PaymentRecord.due_date <= target_date,
            )
        ).all()

        if not payments:
            return 0.0

        delayed_count = sum(1 for p in payments if p.is_delayed)
        return round((delayed_count / len(payments)) * 100, 2)

    def calculate_medical_record_completeness(self, target_date):
        start_date = target_date - timedelta(days=6)

        records = self.db.query(MedicalRecord).filter(
            and_(
                MedicalRecord.record_date >= start_date,
                MedicalRecord.record_date <= target_date,
            )
        ).all()

        if not records:
            return 0.0

        complete_count = sum(1 for r in records if r.is_complete)
        return round((complete_count / len(records)) * 100, 2)

    def calculate_punch_card_consistency(self, target_date):
        start_date = target_date - timedelta(days=6)

        attendances = self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.attendance_date >= start_date,
                AttendanceRecord.attendance_date <= target_date,
            )
        ).all()

        if not attendances:
            return 100.0

        patients = self.db.query(Patient).filter(
            Patient.admission_date <= target_date,
        ).all()

        daily_consistency = []
        for d in pd.date_range(start_date, target_date):
            day_attendances = [a for a in attendances if a.attendance_date == d.date()]
            registered_patients = [p for p in patients if p.admission_date <= d.date() and (p.discharge_date is None or p.discharge_date >= d.date())]

            if registered_patients:
                consistency = len(day_attendances) / len(registered_patients)
                daily_consistency.append(min(1.0, consistency))

        if not daily_consistency:
            return 100.0

        return round(sum(daily_consistency) / len(daily_consistency) * 100, 2)

    def calculate_insurance_rejection_rate(self, target_date):
        start_date = target_date - timedelta(days=29)

        claims = self.db.query(InsuranceClaim).filter(
            and_(
                InsuranceClaim.claim_date >= start_date,
                InsuranceClaim.claim_date <= target_date,
            )
        ).all()

        if not claims:
            return 0.0

        total_claimed = sum(c.claim_amount for c in claims)
        total_rejected = sum(c.rejected_amount for c in claims)

        if total_claimed == 0:
            return 0.0

        return round((total_rejected / total_claimed) * 100, 2)

    def calculate_overall_risk_score(self, metrics):
        weights = {
            "treatment_completion_rate": 0.25,
            "payment_delay_rate": 0.20,
            "medical_record_completeness": 0.20,
            "punch_card_consistency": 0.15,
            "insurance_rejection_rate": 0.20,
        }

        score = 100
        score -= (100 - metrics["treatment_completion_rate"]) * weights["treatment_completion_rate"]
        score -= metrics["payment_delay_rate"] * weights["payment_delay_rate"]
        score -= (100 - metrics["medical_record_completeness"]) * weights["medical_record_completeness"]
        score -= (100 - metrics["punch_card_consistency"]) * weights["punch_card_consistency"]
        score -= metrics["insurance_rejection_rate"] * weights["insurance_rejection_rate"]

        return round(max(0, min(100, score)), 2)

    def count_anomalies(self, target_date):
        return self.db.query(AnomalyMarker).filter(
            AnomalyMarker.marker_date == target_date,
            AnomalyMarker.is_resolved == False,
        ).count()

    def get_metrics_dataframe(self, start_date, end_date):
        from database.models import DailyMetrics

        metrics = self.db.query(DailyMetrics).filter(
            and_(
                DailyMetrics.metric_date >= start_date,
                DailyMetrics.metric_date <= end_date,
            )
        ).order_by(DailyMetrics.metric_date).all()

        if not metrics:
            return pd.DataFrame()

        data = []
        for m in metrics:
            data.append({
                "date": m.metric_date,
                "训练完成率": m.treatment_completion_rate,
                "收费表延迟率": m.payment_delay_rate,
                "病历完整度": m.medical_record_completeness,
                "打卡一致性": m.punch_card_consistency,
                "医保拒付率": m.insurance_rejection_rate,
                "综合风险评分": m.overall_risk_score,
                "异常数量": m.anomaly_count,
            })

        return pd.DataFrame(data)

    def get_treatment_calendar_data(self, start_date, end_date):
        treatments = self.db.query(TreatmentRecord).filter(
            and_(
                TreatmentRecord.treatment_date >= start_date,
                TreatmentRecord.treatment_date <= end_date,
            )
        ).all()

        if not treatments:
            return pd.DataFrame()

        data = []
        for t in treatments:
            data.append({
                "date": t.treatment_date,
                "patient_id": t.patient_id,
                "treatment_type": t.treatment_type,
                "therapist": t.therapist,
                "duration": t.duration,
                "is_completed": t.is_completed,
                "pain_reduction": t.pain_before - t.pain_after if t.pain_before and t.pain_after else None,
            })

        return pd.DataFrame(data)

    def get_equipment_status_data(self):
        from database.models import Equipment

        equipment = self.db.query(Equipment).all()

        if not equipment:
            return pd.DataFrame()

        data = []
        for e in equipment:
            data.append({
                "equipment_id": e.equipment_id,
                "name": e.name,
                "type": e.type,
                "location": e.location,
                "status": e.status,
                "utilization_rate": e.utilization_rate,
                "last_maintenance": e.last_maintenance,
                "next_maintenance": e.next_maintenance,
            })

        return pd.DataFrame(data)

    def get_nursing_log_data(self, start_date, end_date):
        from database.models import NursingLog

        logs = self.db.query(NursingLog).filter(
            and_(
                NursingLog.log_date >= start_date,
                NursingLog.log_date <= end_date,
            )
        ).order_by(NursingLog.log_date, NursingLog.log_time).all()

        if not logs:
            return pd.DataFrame()

        data = []
        for log in logs:
            data.append({
                "date": log.log_date,
                "time": log.log_time,
                "patient_id": log.patient_id,
                "nurse": log.nurse,
                "nursing_measures": log.nursing_measures,
                "patient_response": log.patient_response,
                "has_abnormalities": log.abnormalities is not None and len(log.abnormalities) > 0,
            })

        return pd.DataFrame(data)
