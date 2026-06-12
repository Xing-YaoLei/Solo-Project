from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_role
from app.config import settings
import uuid

router = APIRouter()


def generate_report_no():
    now = datetime.now()
    prefix = f"LR{now.strftime('%Y%m%d')}"
    return f"{prefix}{uuid.uuid4().hex[:6].upper()}"


def check_abnormal(db: Session, report: models.LossReport):
    if report.store and report.store.monthly_sales_target > 0:
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1)
        
        month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            models.LossReport.store_id == report.store_id,
            models.LossReport.loss_date >= month_start,
            models.LossReport.id != report.id,
            models.LossReport.status != models.LossStatus.REJECTED
        ).scalar() or 0
        
        total_loss = month_loss + report.cost_amount
        loss_rate = total_loss / report.store.monthly_sales_target * 100
        
        report.loss_rate = round(loss_rate, 2)
        
        if loss_rate > settings.LOSS_RATE_THRESHOLD:
            report.is_abnormal = True
            report.abnormal_type = models.AbnormalType.HIGH_LOSS_RATE
        elif report.cost_amount > 5000:
            report.is_abnormal = True
            report.abnormal_type = models.AbnormalType.LARGE_AMOUNT
        else:
            recent_reports = db.query(models.LossReport).filter(
                models.LossReport.store_id == report.store_id,
                models.LossReport.loss_date >= now - timedelta(days=7),
                models.LossReport.id != report.id
            ).count()
            if recent_reports >= 3:
                report.is_abnormal = True
                report.abnormal_type = models.AbnormalType.FREQUENT_LOSS
    
    return report


@router.post("", response_model=schemas.LossReportResponse, status_code=status.HTTP_201_CREATED)
def create_loss_report(
    report_in: schemas.LossReportCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == models.UserRole.STAFF and current_user.store_id != report_in.store_id:
        raise HTTPException(status_code=403, detail="Can only create report for your own store")
    
    report = models.LossReport(
        **report_in.model_dump(),
        report_no=generate_report_no(),
        created_by=current_user.id,
        status=models.LossStatus.DRAFT
    )
    
    report = check_abnormal(db, report)
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    response = schemas.LossReportResponse.model_validate(report)
    response.creator_name = current_user.full_name
    if report.store:
        response.store_name = report.store.name
    if report.responsible_staff:
        response.responsible_staff_name = report.responsible_staff.full_name
    
    return response


@router.get("", response_model=List[schemas.LossReportResponse])
def list_loss_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[models.LossStatus] = None,
    store_id: Optional[int] = None,
    category: Optional[models.LossCategory] = None,
    is_abnormal: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    my_todo: Optional[bool] = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.LossReport)
    
    if current_user.role == models.UserRole.STAFF:
        if my_todo:
            query = query.filter(
                or_(
                    models.LossReport.responsible_staff_id == current_user.id,
                    and_(
                        models.LossReport.store_id == current_user.store_id,
                        models.LossReport.status.in_([
                            models.LossStatus.PENDING_REVIEW,
                            models.LossStatus.FOLLOWING
                        ])
                    )
                )
            )
        else:
            query = query.filter(
                or_(
                    models.LossReport.created_by == current_user.id,
                    models.LossReport.responsible_staff_id == current_user.id,
                    models.LossReport.store_id == current_user.store_id
                )
            )
    
    if status:
        query = query.filter(models.LossReport.status == status)
    if store_id:
        query = query.filter(models.LossReport.store_id == store_id)
    if category:
        query = query.filter(models.LossReport.category == category)
    if is_abnormal is not None:
        query = query.filter(models.LossReport.is_abnormal == is_abnormal)
    if date_from:
        query = query.filter(models.LossReport.loss_date >= date_from)
    if date_to:
        query = query.filter(models.LossReport.loss_date <= date_to)
    
    reports = query.order_by(desc(models.LossReport.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for report in reports:
        response = schemas.LossReportResponse.model_validate(report)
        if report.creator:
            response.creator_name = report.creator.full_name
        if report.store:
            response.store_name = report.store.name
        if report.responsible_staff:
            response.responsible_staff_name = report.responsible_staff.full_name
        result.append(response)
    
    return result


@router.get("/{report_id}", response_model=schemas.LossReportDetail)
def get_loss_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != report.store_id and \
           current_user.id != report.created_by and \
           current_user.id != report.responsible_staff_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    response = schemas.LossReportDetail.model_validate(report)
    if report.creator:
        response.creator_name = report.creator.full_name
    if report.store:
        response.store_name = report.store.name
    if report.responsible_staff:
        response.responsible_staff_name = report.responsible_staff.full_name
    
    response.reviews = []
    for review in report.reviews:
        r = schemas.ReviewResponse.model_validate(review)
        if review.reviewer:
            r.reviewer_name = review.reviewer.full_name
        response.reviews.append(r)
    
    response.approvals = []
    for approval in report.approvals:
        a = schemas.ApprovalResponse.model_validate(approval)
        if approval.approver:
            a.approver_name = approval.approver.full_name
        response.approvals.append(a)
    
    response.communications = []
    for comm in report.communications:
        c = schemas.CommunicationResponse.model_validate(comm)
        if comm.sender:
            c.sender_name = comm.sender.full_name
            c.sender_role = comm.sender.role
        response.communications.append(c)
    
    return response


@router.put("/{report_id}", response_model=schemas.LossReportResponse)
def update_loss_report(
    report_id: int,
    report_in: schemas.LossReportUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.id != report.created_by:
            raise HTTPException(status_code=403, detail="Can only update your own reports")
        if report.status != models.LossStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Can only update draft reports")
    
    update_data = report_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report, key, value)
    
    report = check_abnormal(db, report)
    
    db.commit()
    db.refresh(report)
    
    response = schemas.LossReportResponse.model_validate(report)
    if report.creator:
        response.creator_name = report.creator.full_name
    if report.store:
        response.store_name = report.store.name
    if report.responsible_staff:
        response.responsible_staff_name = report.responsible_staff.full_name
    
    return response


@router.post("/{report_id}/submit")
def submit_for_review(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF and current_user.id != report.created_by:
        raise HTTPException(status_code=403, detail="Can only submit your own reports")
    
    if report.status != models.LossStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Report is not in draft status")
    
    report.status = models.LossStatus.PENDING_REVIEW
    db.commit()
    
    return {"message": "Report submitted for review successfully", "new_status": report.status}


@router.post("/{report_id}/transition")
def transition_status(
    report_id: int,
    transition: schemas.StatusTransition,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    valid_transitions = {
        models.LossStatus.DRAFT: [models.LossStatus.PENDING_REVIEW],
        models.LossStatus.PENDING_REVIEW: [models.LossStatus.REVIEWED, models.LossStatus.REJECTED],
        models.LossStatus.REVIEWED: [models.LossStatus.PENDING_APPROVAL, models.LossStatus.FOLLOWING],
        models.LossStatus.FOLLOWING: [models.LossStatus.PENDING_APPROVAL, models.LossStatus.CLOSED],
        models.LossStatus.PENDING_APPROVAL: [models.LossStatus.APPROVED, models.LossStatus.REJECTED],
        models.LossStatus.APPROVED: [models.LossStatus.CLOSED],
    }
    
    if transition.to_status not in valid_transitions.get(transition.from_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {transition.from_status} to {transition.to_status}"
        )
    
    if report.status != transition.from_status:
        raise HTTPException(
            status_code=400,
            detail=f"Current status is {report.status}, not {transition.from_status}"
        )
    
    report.status = transition.to_status
    db.commit()
    
    return {"message": "Status updated successfully", "new_status": report.status}


@router.delete("/{report_id}")
def delete_loss_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.id != report.created_by or report.status != models.LossStatus.DRAFT:
            raise HTTPException(status_code=403, detail="Can only delete your own draft reports")
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}


from sqlalchemy import or_
