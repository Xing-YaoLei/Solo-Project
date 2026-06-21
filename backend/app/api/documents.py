from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, Document, DocumentStatus, DocumentVersion
from app.schemas import (
    DocumentCreate, DocumentUpdate, Document as DocumentSchema,
    DocumentDetail, DocumentVersionCreate, DocumentVersion as VersionSchema,
)
from app.api.deps import get_current_user, require_roles
from app.tasks.document_tasks import analyze_risk_keywords, verify_document_versions

router = APIRouter(prefix="/documents", tags=["文书管理"])


def generate_document_no(db: Session, doc_type: str) -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    prefix = doc_type.upper()[:3]
    count = db.query(Document).filter(
        Document.document_no.like(f"{prefix}-{date_str}%")
    ).count() + 1
    return f"{prefix}-{date_str}-{count:04d}"


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """工作台数据：按日常处理节奏的待办统计"""
    query = db.query(Document)
    if current_user.role not in ["admin", "manager", "auditor"]:
        query = query.filter(Document.assignee_id == current_user.id)

    total = query.count()
    by_status = {}
    for status in DocumentStatus:
        count = query.filter(Document.status == status).count()
        by_status[status.value] = count

    rejected = query.filter(Document.status == DocumentStatus.REJECTED).count()
    pending_review = query.filter(Document.status == DocumentStatus.PENDING_REVIEW).count()
    my_todo = query.filter(
        Document.assignee_id == current_user.id,
        Document.status.in_([
            DocumentStatus.DRAFT,
            DocumentStatus.INTERACTING,
            DocumentStatus.RISK_CHECKED,
            DocumentStatus.VERSION_VERIFIED,
            DocumentStatus.REJECTED,
        ])
    ).count() if current_user.role in ["lawyer", "assistant"] else pending_review

    recent = query.options(joinedload(Document.assignee)).order_by(Document.updated_at.desc()).limit(10).all()
    recent_list = [
        {
            "id": d.id,
            "title": d.title,
            "status": d.status.value,
            "rejection_count": d.rejection_count,
            "updated_at": d.updated_at,
            "assignee": d.assignee.full_name if d.assignee else None,
        }
        for d in recent
    ]

    return {
        "total": total,
        "by_status": by_status,
        "rejected": rejected,
        "pending_review": pending_review,
        "my_todo": my_todo,
        "recent_documents": recent_list,
    }


@router.get("", response_model=list[DocumentSchema])
def list_documents(
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    client_name: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """文书列表：按角色过滤待办范围"""
    query = db.query(Document)

    if current_user.role == "lawyer" or current_user.role == "assistant":
        query = query.filter(Document.assignee_id == current_user.id)
    elif current_user.role == "auditor":
        query = query.filter(Document.status.in_([
            DocumentStatus.PENDING_REVIEW,
            DocumentStatus.REJECTED,
            DocumentStatus.APPROVED,
        ]))

    if status:
        query = query.filter(Document.status == status)
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if assignee_id:
        query = query.filter(Document.assignee_id == assignee_id)
    if client_name:
        query = query.filter(Document.client_name.contains(client_name))
    if risk_level:
        query = query.filter(Document.risk_level == risk_level)

    return query.order_by(
        Document.rejection_count.desc(),
        Document.updated_at.desc(),
    ).offset(skip).limit(limit).all()


@router.post("", response_model=DocumentSchema)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant")),
):
    """创建新文书"""
    doc_no = generate_document_no(db, doc_in.document_type)
    document = Document(
        title=doc_in.title,
        document_no=doc_no,
        document_type=doc_in.document_type,
        content=doc_in.content,
        summary=doc_in.summary,
        client_name=doc_in.client_name,
        case_no=doc_in.case_no,
        creator_id=current_user.id,
        assignee_id=doc_in.assignee_id or current_user.id,
    )
    db.add(document)
    db.flush()

    initial_version = DocumentVersion(
        document_id=document.id,
        version_number=1,
        title=document.title,
        content=document.content,
        created_by=current_user.id,
        change_summary="初始版本",
    )
    db.add(initial_version)
    db.commit()
    db.refresh(document)

    analyze_risk_keywords.delay(document.id)

    return document


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取文书详情"""
    document = db.query(Document).options(
        joinedload(Document.versions),
        joinedload(Document.interactions),
        joinedload(Document.audit_records),
    ).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    if current_user.role in ["lawyer", "assistant"] and document.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看此文书")

    return document


@router.put("/{document_id}", response_model=DocumentSchema)
def update_document(
    document_id: int,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant")),
):
    """更新文书信息"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    update_data = doc_in.model_dump(exclude_unset=True)

    if "content" in update_data or "title" in update_data:
        new_version_num = document.current_version + 1
        new_version = DocumentVersion(
            document_id=document.id,
            version_number=new_version_num,
            title=update_data.get("title", document.title),
            content=update_data.get("content", document.content),
            created_by=current_user.id,
            change_summary=update_data.get("summary", f"版本 v{new_version_num} 更新"),
        )
        db.add(new_version)
        update_data["current_version"] = new_version_num
        update_data["is_version_verified"] = False

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    if "content" in update_data:
        analyze_risk_keywords.delay(document.id)
        verify_document_versions.delay(document.id)

    return document


@router.post("/{document_id}/advance-status", response_model=DocumentSchema)
def advance_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "lawyer", "assistant")),
):
    """按流程推进文书状态：日常处理节奏 DRAFT -> INTERACTING -> RISK_CHECKED -> VERSION_VERIFIED -> PENDING_REVIEW"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文书不存在")

    status_flow = [
        DocumentStatus.DRAFT,
        DocumentStatus.INTERACTING,
        DocumentStatus.RISK_CHECKED,
        DocumentStatus.VERSION_VERIFIED,
        DocumentStatus.PENDING_REVIEW,
    ]

    if document.status not in status_flow:
        raise HTTPException(status_code=400, detail="当前状态无法按流程推进")

    current_idx = status_flow.index(document.status)
    if current_idx < len(status_flow) - 1:
        document.status = status_flow[current_idx + 1]
        db.commit()
        db.refresh(document)

    return document
