from sqlalchemy.orm import Session
from typing import Optional

from app.models import (
    SamplingRecord,
    EvidenceStatus,
    ExceptionOrder,
    ExceptionType,
    SamplingStatus,
)


class ExceptionService:
    @staticmethod
    def check_and_create_exception_for_missing_evidence(
        db: Session,
        sampling_record: SamplingRecord,
        changed_by: Optional[int] = None
    ) -> Optional[ExceptionOrder]:
        if sampling_record.evidence_status != EvidenceStatus.MISSING:
            return None

        existing = db.query(ExceptionOrder).filter(
            ExceptionOrder.sampling_id == sampling_record.id,
            ExceptionOrder.exception_type == ExceptionType.EVIDENCE_MISSING
        ).first()

        if existing:
            return None

        exception = ExceptionOrder(
            sampling_id=sampling_record.id,
            exception_type=ExceptionType.EVIDENCE_MISSING,
            impact_scope=f"抽样记录【{sampling_record.sample_name}】证据缺失，需要补充相关证明材料",
            responsible_person=sampling_record.sampled_by,
            root_cause="抽样记录证据状态为缺失，系统自动生成异常单",
            status="open",
        )
        db.add(exception)
        db.flush()

        return exception

    @staticmethod
    def on_evidence_status_change(
        db: Session,
        sampling_record: SamplingRecord,
        old_evidence_status: Optional[EvidenceStatus],
        changed_by: Optional[int] = None
    ) -> Optional[ExceptionOrder]:
        if sampling_record.evidence_status == EvidenceStatus.MISSING:
            return ExceptionService.check_and_create_exception_for_missing_evidence(
                db, sampling_record, changed_by
            )
        return None

    @staticmethod
    def on_sampling_status_reviewed(
        db: Session,
        sampling_record: SamplingRecord,
        changed_by: Optional[int] = None
    ) -> list[ExceptionOrder]:
        exceptions = []

        if sampling_record.evidence_status in [EvidenceStatus.MISSING, EvidenceStatus.PARTIAL]:
            exc = ExceptionService.check_and_create_exception_for_missing_evidence(
                db, sampling_record, changed_by
            )
            if exc:
                exceptions.append(exc)

        return exceptions

    @staticmethod
    def auto_create_non_compliance_exception(
        db: Session,
        sampling_id: int,
        non_compliance_details: str,
        responsible_person: Optional[str] = None,
        impact_scope: Optional[str] = None
    ) -> ExceptionOrder:
        exception = ExceptionOrder(
            sampling_id=sampling_id,
            exception_type=ExceptionType.NON_COMPLIANCE,
            impact_scope=impact_scope or "发现不合规项",
            responsible_person=responsible_person,
            root_cause=non_compliance_details,
            status="open",
        )
        db.add(exception)
        db.flush()
        return exception
