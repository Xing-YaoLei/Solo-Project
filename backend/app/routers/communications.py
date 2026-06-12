from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas
from app.security import get_current_user

router = APIRouter()


@router.post("", response_model=schemas.CommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_communication(
    comm_in: schemas.CommunicationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(
        models.LossReport.id == comm_in.loss_report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != report.store_id and \
           current_user.id != report.created_by and \
           current_user.id != report.responsible_staff_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    comm = models.Communication(
        **comm_in.model_dump(),
        sender_id=current_user.id
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    
    comm = db.query(models.Communication).options(
        joinedload(models.Communication.sender)
    ).filter(models.Communication.id == comm.id).first()
    
    response = schemas.CommunicationResponse.model_validate(comm)
    response.sender_name = comm.sender.full_name if comm.sender else ''
    response.sender_role = comm.sender.role if comm.sender else ''
    
    return response


@router.get("", response_model=List[schemas.CommunicationResponse])
def list_communications(
    loss_report_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(
        models.LossReport.id == loss_report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != report.store_id and \
           current_user.id != report.created_by and \
           current_user.id != report.responsible_staff_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    comms = db.query(models.Communication).options(
        joinedload(models.Communication.sender)
    ).filter(
        models.Communication.loss_report_id == loss_report_id
    ).order_by(models.Communication.created_at.asc()).offset(skip).limit(limit).all()
    
    result = []
    for comm in comms:
        c = schemas.CommunicationResponse.model_validate(comm)
        c.sender_name = comm.sender.full_name if comm.sender else ''
        c.sender_role = comm.sender.role if comm.sender else ''
        result.append(c)
    
    return result


@router.delete("/{comm_id}")
def delete_communication(
    comm_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comm = db.query(models.Communication).filter(models.Communication.id == comm_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")
    
    if comm.sender_id != current_user.id and current_user.role != models.UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")
    
    db.delete(comm)
    db.commit()
    
    return {"message": "Message deleted successfully"}
