from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_role

router = APIRouter()


@router.post("", response_model=schemas.ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval(
    approval_in: schemas.ApprovalCreate,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(
        models.LossReport.id == approval_in.loss_report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if report.status not in [models.LossStatus.PENDING_APPROVAL, models.LossStatus.REVIEWED]:
        raise HTTPException(
            status_code=400,
            detail="Report is not ready for approval"
        )
    
    approval = models.Approval(
        **approval_in.model_dump(),
        approver_id=current_user.id
    )
    db.add(approval)
    
    if approval_in.result == models.ApprovalResult.APPROVED:
        report.status = models.LossStatus.APPROVED
    else:
        report.status = models.LossStatus.REJECTED
    
    db.commit()
    db.refresh(approval)
    
    response = schemas.ApprovalResponse.model_validate(approval)
    response.approver_name = current_user.full_name
    
    return response


@router.get("", response_model=List[schemas.ApprovalResponse])
def list_approvals(
    skip: int = 0,
    limit: int = 50,
    loss_report_id: int = None,
    result: models.ApprovalResult = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Approval)
    
    if current_user.role == models.UserRole.STAFF:
        query = query.join(models.LossReport).filter(
            models.LossReport.store_id == current_user.store_id
        )
    
    if loss_report_id:
        query = query.filter(models.Approval.loss_report_id == loss_report_id)
    if result:
        query = query.filter(models.Approval.result == result)
    
    approvals = query.order_by(models.Approval.approval_time.desc()).offset(skip).limit(limit).all()
    
    result_list = []
    for approval in approvals:
        a = schemas.ApprovalResponse.model_validate(approval)
        if approval.approver:
            a.approver_name = approval.approver.full_name
        result_list.append(a)
    
    return result_list


@router.get("/{approval_id}", response_model=schemas.ApprovalResponse)
def get_approval(
    approval_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != approval.loss_report.store_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    response = schemas.ApprovalResponse.model_validate(approval)
    if approval.approver:
        response.approver_name = approval.approver.full_name
    
    return response


@router.post("/{report_id}/submit-for-approval")
def submit_for_approval(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(models.LossReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != report.store_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if report.status == models.LossStatus.REVIEWED:
        report.status = models.LossStatus.PENDING_APPROVAL
        db.commit()
        return {"message": "Report submitted for approval successfully", "new_status": report.status}
    elif report.status == models.LossStatus.FOLLOWING:
        report.status = models.LossStatus.PENDING_APPROVAL
        db.commit()
        return {"message": "Report submitted for approval successfully", "new_status": report.status}
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit report with status {report.status} for approval"
        )
