from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_worker, get_current_active_admin
from app.models.user import User
from app.models.comment import RentOverdueComment, Complaint
from app.schemas.comment import (
    RentOverdueComment as RentOverdueCommentSchema,
    RentOverdueCommentCreate,
    Complaint as ComplaintSchema,
    ComplaintCreate,
)

router = APIRouter()


@router.post("/overdue", response_model=RentOverdueCommentSchema)
def create_overdue_comment(
    comment_in: RentOverdueCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    comment_data = comment_in.model_dump()
    comment_data["commented_by"] = current_user.id
    
    db_comment = RentOverdueComment(**comment_data)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return db_comment


@router.get("/overdue", response_model=List[RentOverdueCommentSchema])
def list_overdue_comments(
    payment_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    query = db.query(RentOverdueComment)
    if payment_id:
        query = query.filter(RentOverdueComment.payment_id == payment_id)
    if customer_id:
        query = query.filter(RentOverdueComment.customer_id == customer_id)
    
    return query.order_by(RentOverdueComment.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/overdue/{comment_id}", response_model=RentOverdueCommentSchema)
def get_overdue_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    comment = db.query(RentOverdueComment).filter(RentOverdueComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return comment


@router.post("/complaints", response_model=ComplaintSchema)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    db_complaint = Complaint(**complaint_in.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    return db_complaint


@router.get("/complaints", response_model=List[ComplaintSchema])
def list_complaints(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    property_id: Optional[int] = None,
    complaint_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if customer_id:
        query = query.filter(Complaint.customer_id == customer_id)
    if property_id:
        query = query.filter(Complaint.property_id == property_id)
    if complaint_type:
        query = query.filter(Complaint.complaint_type == complaint_type)
    
    return query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/complaints/{complaint_id}", response_model=ComplaintSchema)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return complaint


@router.put("/complaints/{complaint_id}/status", response_model=ComplaintSchema)
def update_complaint_status(
    complaint_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    
    if new_status not in ["pending", "processing", "resolved", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status",
        )
    
    complaint.status = new_status
    db.commit()
    db.refresh(complaint)
    
    return complaint
