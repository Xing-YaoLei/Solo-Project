import pandas as pd
from datetime import date, timedelta, datetime
from typing import List, Dict, Any
from sqlalchemy import func, and_, or_, case

from app.models import (
    get_session, Prescription, PrescriptionItem, PrescriptionPhoto,
    PharmacistReview, Member, Pharmacy, FollowUp, ImportBatch,
    InsuranceSettlement, PrescriptionNote, User,
    PrescriptionStatus, PharmacistOpinion, FollowUpStatus, UserRole,
)


def _to_dataframe(query_result, columns: List[str]) -> pd.DataFrame:
    return pd.DataFrame(query_result, columns=columns)


def get_prescription_summary(start_date: date = None, end_date: date = None, pharmacy_id: int = None) -> Dict[str, Any]:
    session = get_session()
    try:
        filters = []
        if start_date:
            filters.append(Prescription.prescription_date >= start_date)
        if end_date:
            filters.append(Prescription.prescription_date <= end_date)
        if pharmacy_id:
            filters.append(Prescription.pharmacy_id == pharmacy_id)

        base_query = session.query(Prescription).filter(and_(*filters)) if filters else session.query(Prescription)

        total = base_query.count()
        total_amount = base_query.with_entities(func.sum(Prescription.total_amount)).scalar() or 0
        insurance_amount = base_query.with_entities(func.sum(Prescription.insurance_amount)).scalar() or 0

        status_counts = dict(
            base_query.with_entities(
                Prescription.status, func.count(Prescription.id)
            ).group_by(Prescription.status).all()
        )

        reviewed = base_query.filter(Prescription.review_date.isnot(None)).count()
        approved = status_counts.get(PrescriptionStatus.APPROVED, 0)
        rejected = status_counts.get(PrescriptionStatus.REJECTED, 0)
        needs_clarification = status_counts.get(PrescriptionStatus.NEEDS_CLARIFICATION, 0)

        return {
            "total_prescriptions": total,
            "reviewed": reviewed,
            "approved": approved,
            "rejected": rejected,
            "needs_clarification": needs_clarification,
            "approval_rate": round(approved / max(reviewed, 1) * 100, 2),
            "total_amount": float(total_amount),
            "insurance_amount": float(insurance_amount),
            "self_pay_amount": float(total_amount - insurance_amount),
            "pending_review": total - reviewed,
        }
    finally:
        session.close()


def get_prescription_trend(days: int = 30, pharmacy_id: int = None) -> pd.DataFrame:
    session = get_session()
    try:
        start = date.today() - timedelta(days=days)
        filters = [Prescription.prescription_date >= start]
        if pharmacy_id:
            filters.append(Prescription.pharmacy_id == pharmacy_id)

        rows = (
            session.query(
                Prescription.prescription_date,
                func.count(Prescription.id).label("total"),
                func.sum(case((Prescription.status == PrescriptionStatus.APPROVED, 1), else_=0)).label("approved"),
                func.sum(case((Prescription.status == PrescriptionStatus.REJECTED, 1), else_=0)).label("rejected"),
                func.sum(Prescription.total_amount).label("amount"),
            )
            .filter(and_(*filters))
            .group_by(Prescription.prescription_date)
            .order_by(Prescription.prescription_date.asc())
            .all()
        )
        return _to_dataframe(rows, ["date", "total", "approved", "rejected", "amount"])
    finally:
        session.close()


def get_photo_distribution() -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                Prescription.photo_count,
                func.count(Prescription.id).label("prescription_count"),
                func.sum(case((Prescription.has_unclear_photo == True, 1), else_=0)).label("unclear_count"),
            )
            .group_by(Prescription.photo_count)
            .order_by(Prescription.photo_count.asc())
            .all()
        )
        df = _to_dataframe(rows, ["photo_count", "prescription_count", "unclear_count"])
        if not df.empty:
            df["photo_count_label"] = df["photo_count"].apply(
                lambda x: f"{int(x)}张" if x <= 5 else "6张及以上"
            )
        return df
    finally:
        session.close()


def get_photo_quality_detail() -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                PrescriptionPhoto.is_clear,
                func.count(PrescriptionPhoto.id).label("count"),
            )
            .group_by(PrescriptionPhoto.is_clear)
            .all()
        )
        df = _to_dataframe(rows, ["is_clear", "count"])
        df["quality"] = df["is_clear"].map({True: "清晰", False: "不清晰"})
        return df
    finally:
        session.close()


def get_pharmacist_funnel() -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                PharmacistReview.opinion,
                func.count(PharmacistReview.id).label("count"),
            )
            .group_by(PharmacistReview.opinion)
            .order_by(func.count(PharmacistReview.id).desc())
            .all()
        )
        df = _to_dataframe(rows, ["opinion", "count"])
        opinion_map = {
            PharmacistOpinion.PASSED: "审核通过",
            PharmacistOpinion.DOSE_ISSUE: "剂量问题",
            PharmacistOpinion.INTERACTION_WARNING: "药物相互作用",
            PharmacistOpinion.DUPLICATE_THERAPY: "重复用药",
            PharmacistOpinion.CONTRAINDICATION: "禁忌症",
            PharmacistOpinion.INCOMPLETE_INFO: "信息不完整",
            PharmacistOpinion.PHOTO_UNCLEAR: "照片不清晰",
        }
        df["opinion_label"] = df["opinion"].map(lambda x: opinion_map.get(x, str(x)))
        return df
    finally:
        session.close()


def get_expiry_ranking(limit: int = 20, days_threshold: int = 180) -> pd.DataFrame:
    session = get_session()
    try:
        today = date.today()
        cutoff = today + timedelta(days=days_threshold)
        rows = (
            session.query(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
                func.count(PrescriptionItem.id).label("count"),
                func.sum(PrescriptionItem.total_price).label("total_value"),
            )
            .filter(
                and_(
                    PrescriptionItem.expiry_date.isnot(None),
                    PrescriptionItem.expiry_date <= cutoff,
                )
            )
            .group_by(
                PrescriptionItem.drug_name,
                PrescriptionItem.batch_no,
                PrescriptionItem.expiry_date,
            )
            .order_by(PrescriptionItem.expiry_date.asc())
            .limit(limit)
            .all()
        )
        df = _to_dataframe(rows, ["drug_name", "batch_no", "expiry_date", "count", "total_value"])
        if not df.empty:
            df["days_left"] = df["expiry_date"].apply(lambda d: (d - today).days if d else None)
            df["urgency"] = df["days_left"].apply(
                lambda x: "严重" if x and x <= 30 else ("警告" if x and x <= 90 else "正常")
            )
        return df
    finally:
        session.close()


def get_member_changes(days: int = 90) -> pd.DataFrame:
    session = get_session()
    try:
        start = date.today() - timedelta(days=days)
        rows = (
            session.query(
                func.date(Member.updated_at).label("update_date"),
                func.count(Member.id).label("total_members"),
                func.sum(case((Member.created_at >= start, 1), else_=0)).label("new_members"),
            )
            .filter(Member.updated_at >= start)
            .group_by(func.date(Member.updated_at))
            .order_by(func.date(Member.updated_at).asc())
            .all()
        )
        return _to_dataframe(rows, ["date", "total_members", "new_members"])
    finally:
        session.close()


def get_follow_up_tasks(user_id: int = None, role: UserRole = None) -> pd.DataFrame:
    session = get_session()
    try:
        query = (
            session.query(
                FollowUp.id,
                FollowUp.status,
                FollowUp.priority,
                FollowUp.follow_up_type,
                FollowUp.content,
                FollowUp.due_date,
                FollowUp.created_at,
                FollowUp.completed_at,
                FollowUp.assigned_to,
                Prescription.prescription_no,
                Prescription.patient_name,
                Pharmacy.name.label("pharmacy_name"),
                User.full_name.label("assignee_name"),
            )
            .join(Prescription, FollowUp.prescription_id == Prescription.id)
            .join(Pharmacy, Prescription.pharmacy_id == Pharmacy.id)
            .outerjoin(User, FollowUp.assigned_to == User.id)
        )

        if role == UserRole.EXECUTOR:
            if user_id:
                query = query.filter(
                    or_(FollowUp.assigned_to == user_id, FollowUp.assigned_to.is_(None))
                )
            else:
                query = query.filter(FollowUp.assigned_to.is_(None))

        rows = query.order_by(FollowUp.priority.desc(), FollowUp.due_date.asc()).all()

        columns = ["id", "status", "priority", "follow_up_type", "content",
                   "due_date", "created_at", "completed_at", "assigned_to",
                   "prescription_no", "patient_name", "pharmacy_name", "assignee_name"]
        df = _to_dataframe(rows, columns)
        if not df.empty:
            status_map = {
                FollowUpStatus.PENDING: "待处理",
                FollowUpStatus.IN_PROGRESS: "进行中",
                FollowUpStatus.COMPLETED: "已完成",
                FollowUpStatus.CANCELLED: "已取消",
            }
            df["status_label"] = df["status"].map(lambda x: status_map.get(x, str(x)))
            df["priority_label"] = df["priority"].map({0: "低", 1: "中", 2: "高"})
            df["can_claim"] = df["assigned_to"].isna()
        return df
    finally:
        session.close()


def get_pharmacy_stats() -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                Pharmacy.id,
                Pharmacy.name,
                Pharmacy.code,
                func.count(Prescription.id).label("prescription_count"),
                func.sum(Prescription.total_amount).label("total_amount"),
                func.sum(case((Prescription.status == PrescriptionStatus.APPROVED, 1), else_=0)).label("approved"),
            )
            .outerjoin(Prescription, Pharmacy.id == Prescription.pharmacy_id)
            .group_by(Pharmacy.id, Pharmacy.name, Pharmacy.code)
            .order_by(func.count(Prescription.id).desc())
            .all()
        )
        df = _to_dataframe(rows, ["id", "name", "code", "prescription_count", "total_amount", "approved"])
        if not df.empty:
            df["approval_rate"] = df.apply(
                lambda r: round(r["approved"] / max(r["prescription_count"], 1) * 100, 2), axis=1
            )
        return df
    finally:
        session.close()


def get_prescription_notes(prescription_id: int) -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                PrescriptionNote.id,
                PrescriptionNote.note_type,
                PrescriptionNote.content,
                PrescriptionNote.is_resolved,
                PrescriptionNote.created_at,
                PrescriptionNote.resolved_at,
                User.full_name.label("author_name"),
            )
            .join(User, PrescriptionNote.author_id == User.id)
            .filter(PrescriptionNote.prescription_id == prescription_id)
            .order_by(PrescriptionNote.created_at.desc())
            .all()
        )
        return _to_dataframe(rows, ["id", "note_type", "content", "is_resolved",
                                     "created_at", "resolved_at", "author_name"])
    finally:
        session.close()


def get_batch_history(limit: int = 50) -> pd.DataFrame:
    session = get_session()
    try:
        rows = (
            session.query(
                ImportBatch.batch_no,
                ImportBatch.source,
                ImportBatch.status,
                ImportBatch.total_records,
                ImportBatch.success_records,
                ImportBatch.failed_records,
                ImportBatch.file_name,
                ImportBatch.started_at,
                ImportBatch.completed_at,
            )
            .order_by(ImportBatch.created_at.desc())
            .limit(limit)
            .all()
        )
        df = _to_dataframe(rows, ["batch_no", "source", "status", "total_records",
                                   "success_records", "failed_records", "file_name",
                                   "started_at", "completed_at"])
        if not df.empty:
            df["source_label"] = df["source"].map(lambda x: x.value if x else "")
            df["status_label"] = df["status"].map(lambda x: x.value if x else "")
        return df
    finally:
        session.close()


# ========================================================================
# 写操作：处方审核、注释解决、任务分派（对应业务流程状态流转）
# ========================================================================

def submit_pharmacist_review(
    prescription_id: int,
    pharmacist_id: int,
    opinion: PharmacistOpinion,
    comment: str = "",
) -> Dict[str, Any]:
    """
    药师提交审核意见，同步更新处方状态和审核时间。

    状态流转规则：
      PASSED                    → APPROVED
      PHOTO_UNCLEAR / INCOMPLETE_INFO → NEEDS_CLARIFICATION 并触发回访
      其他异常意见               → REJECTED
    """
    session = get_session()
    try:
        prescription = session.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()
        if not prescription:
            return {"ok": False, "error": "处方不存在"}

        pharmacist = session.query(User).filter(User.id == pharmacist_id).first()
        if not pharmacist or pharmacist.role not in (UserRole.PHARMACIST, UserRole.MANAGEMENT):
            return {"ok": False, "error": "无权审核"}

        review = PharmacistReview(
            prescription_id=prescription_id,
            pharmacist_id=pharmacist_id,
            opinion=opinion,
            comment=comment or "",
        )
        session.add(review)

        prescription.review_date = datetime.utcnow()

        if opinion == PharmacistOpinion.PASSED:
            prescription.status = PrescriptionStatus.APPROVED
        elif opinion in (PharmacistOpinion.PHOTO_UNCLEAR, PharmacistOpinion.INCOMPLETE_INFO):
            prescription.status = PrescriptionStatus.NEEDS_CLARIFICATION
            prescription.has_unclear_photo = prescription.has_unclear_photo or (
                opinion == PharmacistOpinion.PHOTO_UNCLEAR
            )
            # 自动建立回访任务（如无）
            existing_fu = session.query(FollowUp).filter(
                and_(
                    FollowUp.prescription_id == prescription.id,
                    FollowUp.status.in_([FollowUpStatus.PENDING, FollowUpStatus.IN_PROGRESS]),
                )
            ).first()
            if not existing_fu:
                fu = FollowUp(
                    prescription_id=prescription.id,
                    status=FollowUpStatus.PENDING,
                    priority=2,
                    follow_up_type="photo_unclear" if opinion == PharmacistOpinion.PHOTO_UNCLEAR else "clarification",
                    content="药师审核标注需澄清，等待回访处理",
                    due_date=date.today() + timedelta(days=3),
                )
                session.add(fu)
        else:
            prescription.status = PrescriptionStatus.REJECTED

        session.commit()
        return {
            "ok": True,
            "prescription_id": prescription.id,
            "new_status": prescription.status.value,
            "review_id": review.id,
        }
    except Exception as e:
        session.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        session.close()


def resolve_note(note_id: int, resolver_id: int) -> Dict[str, Any]:
    """把处方注释标记为已解决。"""
    session = get_session()
    try:
        note = session.query(PrescriptionNote).filter(PrescriptionNote.id == note_id).first()
        if not note:
            return {"ok": False, "error": "注释不存在"}
        note.is_resolved = True
        note.resolved_at = datetime.utcnow()

        # 如果该处方所有注释都已解决，自动把 NEEDS_CLARIFICATION 切回 UNDER_REVIEW
        unresolved = session.query(PrescriptionNote).filter(
            and_(
                PrescriptionNote.prescription_id == note.prescription_id,
                PrescriptionNote.is_resolved == False,
            )
        ).count()
        if unresolved == 0:
            rx = session.query(Prescription).filter(Prescription.id == note.prescription_id).first()
            if rx and rx.status == PrescriptionStatus.NEEDS_CLARIFICATION:
                rx.status = PrescriptionStatus.UNDER_REVIEW

        session.commit()
        return {"ok": True, "note_id": note_id}
    except Exception as e:
        session.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        session.close()


def get_pending_review_list(limit: int = 50) -> pd.DataFrame:
    """查询待审核处方列表（给药师/管理层用）。"""
    session = get_session()
    try:
        rows = (
            session.query(
                Prescription.id,
                Prescription.prescription_no,
                Prescription.patient_name,
                Prescription.prescription_date,
                Prescription.status,
                Prescription.has_unclear_photo,
                Pharmacy.name.label("pharmacy_name"),
                Member.name.label("member_name"),
            )
            .join(Pharmacy, Prescription.pharmacy_id == Pharmacy.id)
            .outerjoin(Member, Prescription.member_id == Member.id)
            .filter(Prescription.status.in_([
                PrescriptionStatus.RECEIVED,
                PrescriptionStatus.UNDER_REVIEW,
                PrescriptionStatus.NEEDS_CLARIFICATION,
            ]))
            .order_by(Prescription.prescription_date.desc())
            .limit(limit)
            .all()
        )
        df = _to_dataframe(rows, [
            "id", "prescription_no", "patient_name", "prescription_date",
            "status", "has_unclear_photo", "pharmacy_name", "member_name",
        ])
        if not df.empty:
            status_map = {
                PrescriptionStatus.RECEIVED: "已接收",
                PrescriptionStatus.UNDER_REVIEW: "审核中",
                PrescriptionStatus.NEEDS_CLARIFICATION: "需澄清",
            }
            df["status_label"] = df["status"].map(lambda x: status_map.get(x, str(x)))
        return df
    finally:
        session.close()

