import pandas as pd
import numpy as np
from datetime import date, timedelta
from sqlalchemy import and_
from database.models import (
    PaymentRecord, MedicalRecord, AttendanceRecord, InsuranceClaim,
    AnomalyMarker, ReviewNote
)
from config.settings import settings


class AnomalyDetector:
    def __init__(self, db_session, thresholds):
        self.db = db_session
        self.thresholds = thresholds

    def detect_payment_delays(self, target_date):
        anomalies = []

        payments = self.db.query(PaymentRecord).filter(
            and_(
                PaymentRecord.due_date <= target_date,
                PaymentRecord.is_delayed == True,
                PaymentRecord.delay_days >= self.thresholds["payment_delay_days"],
            )
        ).all()

        if payments:
            affected_ids = [p.id for p in payments]
            avg_delay = sum(p.delay_days for p in payments) / len(payments)

            anomalies.append({
                "anomaly_type": "payment_delay",
                "marker_date": target_date,
                "severity": "high" if avg_delay > 7 else "medium",
                "description": f"发现 {len(payments)} 条收费表延迟记录，平均延迟 {avg_delay:.1f} 天",
                "affected_records": {"payment_ids": affected_ids, "avg_delay_days": avg_delay},
            })

        return anomalies

    def detect_medical_record_gaps(self, target_date):
        anomalies = []
        start_date = target_date - timedelta(days=6)

        records = self.db.query(MedicalRecord).filter(
            and_(
                MedicalRecord.record_date >= start_date,
                MedicalRecord.record_date <= target_date,
            )
        ).all()

        if records:
            incomplete_count = sum(1 for r in records if not r.is_complete)
            incomplete_rate = incomplete_count / len(records)

            if incomplete_rate >= self.thresholds["medical_record_missing_rate"]:
                affected_ids = [r.id for r in records if not r.is_complete]
                missing_fields_list = [r.missing_fields for r in records if not r.is_complete and r.missing_fields]

                anomalies.append({
                    "anomaly_type": "medical_record_missing",
                    "marker_date": target_date,
                    "severity": "high" if incomplete_rate > 0.3 else "medium",
                    "description": f"病历系统缺失率 {incomplete_rate*100:.1f}%，共 {incomplete_count} 份不完整",
                    "affected_records": {
                        "record_ids": affected_ids,
                        "missing_rate": incomplete_rate,
                        "common_missing_fields": self._get_common_missing_fields(missing_fields_list),
                    },
                })

        return anomalies

    def detect_punch_card_caliber_changes(self, target_date):
        anomalies = []
        start_date = target_date - timedelta(days=13)

        records = self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.attendance_date >= start_date,
                AttendanceRecord.attendance_date <= target_date,
            )
        ).all()

        if records:
            week1_end = target_date - timedelta(days=7)
            week1 = [r for r in records if r.attendance_date <= week1_end]
            week2 = [r for r in records if r.attendance_date > week1_end]

            if week1 and week2:
                week1_present_rate = sum(1 for r in week1 if r.is_present) / len(week1)
                week2_present_rate = sum(1 for r in week2 if r.is_present) / len(week2)

                week1_versions = set(r.caliber_version for r in week1)
                week2_versions = set(r.caliber_version for r in week2)

                rate_diff = abs(week2_present_rate - week1_present_rate)
                version_changed = week1_versions != week2_versions

                if version_changed or rate_diff > self.thresholds["punch_card_std_ratio"]:
                    anomalies.append({
                        "anomaly_type": "punch_card_caliber_change",
                        "marker_date": target_date,
                        "severity": "medium",
                        "description": f"打卡记录口径变化检测：上周出席率 {week1_present_rate*100:.1f}%，本周 {week2_present_rate*100:.1f}%，口径版本：{week1_versions} -> {week2_versions}",
                        "affected_records": {
                            "week1_rate": week1_present_rate,
                            "week2_rate": week2_present_rate,
                            "version_change": version_changed,
                            "old_version": list(week1_versions),
                            "new_version": list(week2_versions),
                        },
                    })

        return anomalies

    def detect_insurance_rejection_trends(self, target_date):
        anomalies = []
        start_date = target_date - timedelta(days=89)

        claims = self.db.query(InsuranceClaim).filter(
            and_(
                InsuranceClaim.claim_date >= start_date,
                InsuranceClaim.claim_date <= target_date,
            )
        ).all()

        if len(claims) < 10:
            return anomalies

        weekly_data = []
        for i in range(12):
            week_start = target_date - timedelta(days=(i + 1) * 7)
            week_end = target_date - timedelta(days=i * 7)
            week_claims = [c for c in claims if week_start <= c.claim_date < week_end]

            if week_claims:
                total = sum(c.claim_amount for c in week_claims)
                rejected = sum(c.rejected_amount for c in week_claims)
                rate = (rejected / total) * 100 if total > 0 else 0
                weekly_data.append({
                    "week": i,
                    "start_date": week_start,
                    "end_date": week_end,
                    "rejection_rate": rate,
                    "claim_count": len(week_claims),
                })

        if len(weekly_data) >= 4:
            recent_rates = [w["rejection_rate"] for w in weekly_data[:4]]
            older_rates = [w["rejection_rate"] for w in weekly_data[4:8]]

            if recent_rates and older_rates:
                recent_avg = sum(recent_rates) / len(recent_rates)
                older_avg = sum(older_rates) / len(older_rates)

                if recent_avg > older_avg * 1.5 and recent_avg > 5:
                    related_claims = self.db.query(InsuranceClaim).filter(
                        and_(
                            InsuranceClaim.claim_date >= target_date - timedelta(days=28),
                            InsuranceClaim.claim_date <= target_date,
                            InsuranceClaim.rejected_amount > 0,
                        )
                    ).all()

                    claim_ids = [c.id for c in related_claims]

                    anomalies.append({
                        "anomaly_type": "insurance_rejection",
                        "marker_date": target_date,
                        "severity": "high" if recent_avg > 15 else "medium",
                        "description": f"医保拒付率趋势变化：近4周平均 {recent_avg:.1f}%，之前4周平均 {older_avg:.1f}%",
                        "affected_records": {
                            "recent_avg_rate": recent_avg,
                            "older_avg_rate": older_avg,
                            "increase_percent": ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else None,
                            "related_claim_ids": claim_ids,
                        },
                    })

        return anomalies

    def get_anomalies_with_reviews(self, start_date, end_date):
        anomalies = self.db.query(AnomalyMarker).filter(
            and_(
                AnomalyMarker.marker_date >= start_date,
                AnomalyMarker.marker_date <= end_date,
            )
        ).order_by(AnomalyMarker.marker_date.desc()).all()

        if not anomalies:
            return pd.DataFrame()

        data = []
        for a in anomalies:
            reviews = self.db.query(ReviewNote).filter(
                ReviewNote.anomaly_marker_id == a.id
            ).order_by(ReviewNote.review_date.desc()).all()

            review_contents = [r.content for r in reviews]
            reviewers = [r.reviewer for r in reviews]

            anomaly_type_names = {
                "payment_delay": "收费表延迟",
                "medical_record_missing": "病历系统缺失",
                "punch_card_caliber_change": "打卡记录口径变化",
                "insurance_rejection": "医保拒付",
            }

            data.append({
                "date": a.marker_date,
                "anomaly_type": anomaly_type_names.get(a.anomaly_type, a.anomaly_type),
                "severity": a.severity,
                "description": a.description,
                "is_resolved": a.is_resolved,
                "resolution_notes": a.resolution_notes,
                "review_count": len(reviews),
                "review_contents": " | ".join(review_contents) if review_contents else None,
                "reviewers": ", ".join(reviewers) if reviewers else None,
                "has_review": len(reviews) > 0,
            })

        return pd.DataFrame(data)

    def _get_common_missing_fields(self, missing_fields_list):
        if not missing_fields_list:
            return []

        field_counts = {}
        for fields in missing_fields_list:
            if isinstance(fields, list):
                for field in fields:
                    field_counts[field] = field_counts.get(field, 0) + 1

        return sorted(field_counts.items(), key=lambda x: x[1], reverse=True)[:5]
