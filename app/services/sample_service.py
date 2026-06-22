from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Comment, SamplingRecord, SamplingStatus, RiskHistory, RiskLevel, User


def add_comment(
    db: Session,
    sampling_record_id: int,
    user_id: int,
    content: str,
    comment_type: str = "general",
    is_evidence_missing: bool = False,
) -> Comment:
    comment = Comment(
        sampling_record_id=sampling_record_id,
        user_id=user_id,
        content=content,
        comment_type=comment_type,
        is_evidence_missing=is_evidence_missing,
    )
    db.add(comment)

    if is_evidence_missing:
        sample = db.query(SamplingRecord).filter(SamplingRecord.id == sampling_record_id).first()
        if sample:
            sample.status = SamplingStatus.EVIDENCE_MISSING

    db.commit()
    db.refresh(comment)
    return comment


def update_sample_status(
    db: Session,
    sampling_record_id: int,
    new_status: SamplingStatus,
    user_id: Optional[int] = None,
) -> Optional[SamplingRecord]:
    sample = db.query(SamplingRecord).filter(SamplingRecord.id == sampling_record_id).first()
    if not sample:
        return None
    sample.status = new_status
    if new_status == SamplingStatus.COMPLETED:
        sample.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(sample)
    return sample


def update_sample_risk(
    db: Session,
    sampling_record_id: int,
    new_risk: RiskLevel,
    user_id: int,
    reason: Optional[str] = None,
) -> Optional[SamplingRecord]:
    sample = db.query(SamplingRecord).filter(SamplingRecord.id == sampling_record_id).first()
    if not sample:
        return None
    previous = sample.risk_level
    sample.risk_level = new_risk

    history = RiskHistory(
        sampling_record_id=sampling_record_id,
        previous_level=previous,
        new_level=new_risk,
        changed_by=user_id,
        reason=reason,
    )
    db.add(history)
    db.commit()
    db.refresh(sample)
    return sample


def assign_sample(
    db: Session,
    sampling_record_id: int,
    user_id: int,
) -> Optional[SamplingRecord]:
    sample = db.query(SamplingRecord).filter(SamplingRecord.id == sampling_record_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not sample or not user:
        return None
    sample.assigned_user_id = user_id
    sample.department = user.department or sample.department
    db.commit()
    db.refresh(sample)
    return sample


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_all_users(db: Session) -> list:
    return db.query(User).order_by(User.username).all()
