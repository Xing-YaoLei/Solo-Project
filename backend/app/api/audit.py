from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document, Interaction, RiskHit, DocumentStatus, AuditRecord
from app.schemas import (
    InteractionCreate, Interaction as InteractionSchema,
    RiskHit as RiskHitSchema, AuditRecordCreate, AuditRecord as AuditSchema,
    AuditAction,
)
from app.api.deps import get_current_user, require_roles
from app.tasks.document_tasks import verify_document_versions
from datetime import datetime

router = APIRouter(tags=["互动、风险与审核"])


@router.post("/interactions", response_model=InteractionSchema)
def create_interaction(
    interaction_in: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant", "auditor")),
):
    """创建互动记录（沟通、会议、电话、邮件等）"""
    document = db.query(Document).filter(Document.id == interaction_in.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    interaction = Interaction(
        document_id=interaction_in.document_id,
        user_id=current_user.id,
        interaction_type=interaction_in.interaction_type,
        content=interaction_in.content,
        participants=interaction_in.participants,
        attachments=interaction_in.attachments,
    )
    db.add(interaction)

    if document.status == DocumentStatus.DRAFT:
        document.status = DocumentStatus.INTERACTING

    db.commit()
    db.refresh(interaction)
    return interaction


@router.get("/documents/{document_id}/interactions", response_model=list[InteractionSchema])
def list_document_interactions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取文书的所有互动记录"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")
    return db.query(Interaction).filter(
        Interaction.document_id == document_id
    ).order_by(Interaction.created_at.desc()).all()


@router.get("/documents/{document_id}/risk-hits", response_model=list[RiskHitSchema])
def list_risk_hits(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取文书的风险词命中记录"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")
    return db.query(RiskHit).filter(
        RiskHit.document_id == document_id
    ).order_by(RiskHit.severity.desc()).all()


@router.post("/documents/{document_id}/reanalyze-risk")
def reanalyze_risk(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant")),
):
    """重新触发风险词分析"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    from app.tasks.document_tasks import analyze_risk_keywords
    task = analyze_risk_keywords.delay(document_id)
    return {"task_id": task.id, "status": "started"}


@router.post("/documents/{document_id}/verify-version")
def verify_version(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant")),
):
    """触发版本核对"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    task = verify_document_versions.delay(document_id)
    return {"task_id": task.id, "status": "started"}


@router.post("/documents/{document_id}/audit", response_model=AuditSchema)
def audit_document(
    document_id: int,
    action_in: AuditAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "auditor")),
):
    """审核文书：approve 通过 / reject 退回"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    if document.status not in [DocumentStatus.PENDING_REVIEW, DocumentStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="文书不在可审核状态")

    previous_status = document.status.value

    if action_in.action == "approve":
        document.status = DocumentStatus.APPROVED
        document.approved_at = datetime.utcnow()
        if action_in.material_tags_suggestion:
            existing_tags = document.material_tags or []
            document.material_tags = list(set(existing_tags + action_in.material_tags_suggestion))
        if action_in.comments:
            document.review_comments = action_in.comments

    elif action_in.action == "reject":
        document.status = DocumentStatus.REJECTED
        document.rejection_count = (document.rejection_count or 0) + 1
        if action_in.comments:
            document.review_comments = action_in.comments
        if action_in.material_tags_suggestion:
            existing_tags = document.material_tags or []
            document.material_tags = list(set(existing_tags + action_in.material_tags_suggestion))

    else:
        raise HTTPException(status_code=400, detail="无效操作，只能 approve 或 reject")

    audit_record = AuditRecordCreate(
        document_id=document_id,
        action=action_in.action,
        comments=action_in.comments,
        previous_status=previous_status,
        new_status=document.status.value,
        material_tags_suggestion=action_in.material_tags_suggestion,
    )

    audit = AuditRecord(
        document_id=audit_record.document_id,
        auditor_id=current_user.id,
        action=audit_record.action,
        comments=audit_record.comments,
        previous_status=audit_record.previous_status,
        new_status=audit_record.new_status,
        material_tags_suggestion=audit_record.material_tags_suggestion,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


@router.get("/documents/{document_id}/audit-history", response_model=list[AuditSchema])
def list_audit_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取文书审核历史记录"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")
    return db.query(AuditRecord).filter(
        AuditRecord.document_id == document_id
    ).order_by(AuditRecord.created_at.desc()).all()
