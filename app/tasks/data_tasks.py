from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import pandas as pd
from sqlalchemy import func, and_, or_

from app.tasks.celery_app import celery_app
from app.models import (
    get_session, Prescription, PrescriptionItem, Member, Pharmacy,
    PharmacistReview, PrescriptionNote, FollowUp, PrescriptionPhoto,
    PrescriptionStatus, PharmacistOpinion, FollowUpStatus,
)
from app.data import (
    import_pos_data, import_member_data, import_insurance_data,
    link_members_to_prescriptions,
)


@celery_app.task(bind=True, name="import_pos")
def task_import_pos(self, file_path: str, created_by: int = None):
    try:
        success, failed, batch_no = import_pos_data(file_path, created_by)
        return {"success": success, "failed": failed, "batch_no": batch_no}
    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="import_member")
def task_import_member(self, file_path: str, created_by: int = None):
    try:
        success, failed, batch_no = import_member_data(file_path, created_by)
        result = link_members_to_prescriptions()
        return {
            "success": success,
            "failed": failed,
            "batch_no": batch_no,
            "linked_prescriptions": result,
        }
    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="import_insurance")
def task_import_insurance(self, file_path: str, created_by: int = None):
    try:
        success, failed, batch_no = import_insurance_data(file_path, created_by)
        return {"success": success, "failed": failed, "batch_no": batch_no}
    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise


@celery_app.task(name="compute_daily_metrics")
def task_compute_daily_metrics(report_date: str = None):
    if report_date:
        target_date = datetime.strptime(report_date, "%Y-%m-%d").date()
    else:
        target_date = date.today() - timedelta(days=1)

    session = get_session()
    try:
        daily_rx = session.query(func.count(Prescription.id)).filter(
            func.date(Prescription.prescription_date) == target_date
        ).scalar() or 0

        daily_reviews = session.query(func.count(PharmacistReview.id)).filter(
            func.date(PharmacistReview.reviewed_at) == target_date
        ).scalar() or 0

        approved_count = session.query(func.count(Prescription.id)).filter(
            and_(
                func.date(Prescription.review_date) == target_date,
                Prescription.status == PrescriptionStatus.APPROVED,
            )
        ).scalar() or 0

        rejected_count = session.query(func.count(Prescription.id)).filter(
            and_(
                func.date(Prescription.review_date) == target_date,
                Prescription.status == PrescriptionStatus.REJECTED,
            )
        ).scalar() or 0

        total_amount = session.query(func.sum(Prescription.total_amount)).filter(
            func.date(Prescription.prescription_date) == target_date
        ).scalar() or 0.0

        insurance_amount = session.query(func.sum(Prescription.insurance_amount)).filter(
            func.date(Prescription.prescription_date) == target_date
        ).scalar() or 0.0

        metrics = {
            "date": str(target_date),
            "total_prescriptions": daily_rx,
            "total_reviews": daily_reviews,
            "approved": approved_count,
            "rejected": rejected_count,
            "approval_rate": round(approved_count / max(daily_reviews, 1) * 100, 2),
            "total_amount": float(total_amount or 0),
            "insurance_amount": float(insurance_amount or 0),
        }
        return metrics
    finally:
        session.close()


@celery_app.task(name="expiry_monitor")
def task_expiry_monitor(days_threshold: int = 90):
    session = get_session()
    try:
        today = date.today()
        cutoff = today + timedelta(days=days_threshold)

        expiring_items = (
            session.query(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
                func.count(PrescriptionItem.id).label("appearance_count"),
                func.sum(PrescriptionItem.quantity).label("total_quantity"),
            )
            .filter(
                and_(
                    PrescriptionItem.expiry_date.isnot(None),
                    PrescriptionItem.expiry_date <= cutoff,
                    PrescriptionItem.expiry_date >= today,
                )
            )
            .group_by(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
            )
            .order_by(PrescriptionItem.expiry_date.asc())
            .all()
        )

        result = []
        for item in expiring_items:
            days_left = (item.expiry_date - today).days
            urgency = "critical" if days_left <= 30 else "warning" if days_left <= 60 else "normal"
            result.append({
                "drug_name": item.drug_name,
                "batch_no": item.batch_no,
                "expiry_date": str(item.expiry_date),
                "days_left": days_left,
                "urgency": urgency,
                "appearance_count": item.appearance_count,
                "total_quantity": float(item.total_quantity or 0),
            })

        expired_items = (
            session.query(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
                func.count(PrescriptionItem.id).label("appearance_count"),
            )
            .filter(
                and_(
                    PrescriptionItem.expiry_date.isnot(None),
                    PrescriptionItem.expiry_date < today,
                )
            )
            .group_by(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
            )
            .order_by(PrescriptionItem.expiry_date.desc())
            .limit(50)
            .all()
        )

        expired = []
        for item in expired_items:
            days_expired = (today - item.expiry_date).days
            expired.append({
                "drug_name": item.drug_name,
                "batch_no": item.batch_no,
                "expiry_date": str(item.expiry_date),
                "days_expired": days_expired,
                "appearance_count": item.appearance_count,
            })

        return {
            "expiring_count": len(result),
            "expiring_items": result,
            "expired_count": len(expired),
            "expired_items": expired,
            "threshold_days": days_threshold,
        }
    finally:
        session.close()


@celery_app.task(name="auto_assign_follow_ups")
def task_auto_assign_follow_ups():
    session = get_session()
    try:
        need_followup = session.query(Prescription).filter(
            or_(
                Prescription.status == PrescriptionStatus.NEEDS_CLARIFICATION,
                Prescription.status == PrescriptionStatus.FOLLOW_UP,
                Prescription.has_unclear_photo == True,
            )
        ).all()

        assigned = 0
        for rx in need_followup:
            existing_fu = session.query(FollowUp).filter(
                and_(
                    FollowUp.prescription_id == rx.id,
                    FollowUp.status.in_([FollowUpStatus.PENDING, FollowUpStatus.IN_PROGRESS]),
                )
            ).first()

            if not existing_fu:
                fu = FollowUp(
                    prescription_id=rx.id,
                    status=FollowUpStatus.PENDING,
                    priority=2 if rx.status == PrescriptionStatus.NEEDS_CLARIFICATION else 1,
                    follow_up_type="clarification" if rx.has_unclear_photo else "review",
                    content="处方审核需进一步确认或回访",
                    due_date=date.today() + timedelta(days=3),
                )
                session.add(fu)
                assigned += 1

        session.commit()
        return {"assigned": assigned}
    finally:
        session.close()
