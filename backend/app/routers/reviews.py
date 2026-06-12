from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_role

router = APIRouter()


@router.post("", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(models.LossReport).filter(
        models.LossReport.id == review_in.loss_report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")
    
    if report.status != models.LossStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Report is not pending review"
        )
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != report.store_id:
            raise HTTPException(status_code=403, detail="Can only review reports for your store")
    
    review = models.Review(
        **review_in.model_dump(),
        reviewer_id=current_user.id
    )
    db.add(review)
    
    report.status = models.LossStatus.REVIEWED
    
    if review_in.result == models.ReviewResult.NEEDS_FOLLOW_UP:
        todo = models.TodoItem(
            title=f"跟进报损单: {report.report_no}",
            description=f"报损单复核意见: {review_in.review_opinion}",
            loss_report_id=report.id,
            assignee_id=report.responsible_staff_id or report.created_by,
            created_by=current_user.id
        )
        db.add(todo)
    
    db.commit()
    db.refresh(review)
    
    response = schemas.ReviewResponse.model_validate(review)
    response.reviewer_name = current_user.full_name
    
    return response


@router.get("", response_model=List[schemas.ReviewResponse])
def list_reviews(
    skip: int = 0,
    limit: int = 50,
    loss_report_id: int = None,
    result: models.ReviewResult = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Review)
    
    if current_user.role == models.UserRole.STAFF:
        query = query.join(models.LossReport).filter(
            models.LossReport.store_id == current_user.store_id
        )
    
    if loss_report_id:
        query = query.filter(models.Review.loss_report_id == loss_report_id)
    if result:
        query = query.filter(models.Review.result == result)
    
    reviews = query.order_by(models.Review.review_time.desc()).offset(skip).limit(limit).all()
    
    result_list = []
    for review in reviews:
        r = schemas.ReviewResponse.model_validate(review)
        if review.reviewer:
            r.reviewer_name = review.reviewer.full_name
        result_list.append(r)
    
    return result_list


@router.get("/{review_id}", response_model=schemas.ReviewResponse)
def get_review(
    review_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if current_user.role == models.UserRole.STAFF:
        if current_user.store_id != review.loss_report.store_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    response = schemas.ReviewResponse.model_validate(review)
    if review.reviewer:
        response.reviewer_name = review.reviewer.full_name
    
    return response


@router.put("/{review_id}", response_model=schemas.ReviewResponse)
def update_review(
    review_id: int,
    review_in: schemas.ReviewBase,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    for key, value in review_in.model_dump().items():
        setattr(review, key, value)
    
    db.commit()
    db.refresh(review)
    
    response = schemas.ReviewResponse.model_validate(review)
    if review.reviewer:
        response.reviewer_name = review.reviewer.full_name
    
    return response
