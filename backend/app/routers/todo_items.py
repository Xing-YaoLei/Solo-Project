from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.security import get_current_user

router = APIRouter()


@router.get("", response_model=List[schemas.TodoItemResponse])
def list_todo_items(
    skip: int = 0,
    limit: int = 50,
    is_completed: Optional[bool] = None,
    loss_report_id: Optional[int] = None,
    my_only: Optional[bool] = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.TodoItem).options(
        joinedload(models.TodoItem.assignee),
        joinedload(models.TodoItem.loss_report)
    )

    if my_only or current_user.role == models.UserRole.STAFF:
        query = query.filter(models.TodoItem.assignee_id == current_user.id)

    if is_completed is not None:
        query = query.filter(models.TodoItem.is_completed == is_completed)
    if loss_report_id:
        query = query.filter(models.TodoItem.loss_report_id == loss_report_id)

    items = query.order_by(
        models.TodoItem.is_completed.asc(),
        models.TodoItem.created_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for item in items:
        r = schemas.TodoItemResponse.model_validate(item)
        r.assignee_name = item.assignee.full_name if item.assignee else ''
        r.loss_report_no = item.loss_report.report_no if item.loss_report else ''
        result.append(r)

    return result


@router.get("/{todo_id}", response_model=schemas.TodoItemResponse)
def get_todo_item(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.TodoItem).options(
        joinedload(models.TodoItem.assignee),
        joinedload(models.TodoItem.loss_report)
    ).filter(models.TodoItem.id == todo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Todo item not found")

    if current_user.role == models.UserRole.STAFF and item.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    r = schemas.TodoItemResponse.model_validate(item)
    r.assignee_name = item.assignee.full_name if item.assignee else ''
    r.loss_report_no = item.loss_report.report_no if item.loss_report else ''
    return r


@router.post("", response_model=schemas.TodoItemResponse, status_code=status.HTTP_201_CREATED)
def create_todo_item(
    todo_in: schemas.TodoItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == models.UserRole.STAFF:
        if todo_in.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only assign to yourself")

    report = db.query(models.LossReport).filter(
        models.LossReport.id == todo_in.loss_report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Loss report not found")

    todo = models.TodoItem(
        **todo_in.model_dump(),
        created_by=current_user.id
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)

    item = db.query(models.TodoItem).options(
        joinedload(models.TodoItem.assignee),
        joinedload(models.TodoItem.loss_report)
    ).filter(models.TodoItem.id == todo.id).first()

    r = schemas.TodoItemResponse.model_validate(item)
    r.assignee_name = item.assignee.full_name if item.assignee else ''
    r.loss_report_no = item.loss_report.report_no if item.loss_report else ''
    return r


@router.put("/{todo_id}/toggle", response_model=schemas.TodoItemResponse)
def toggle_todo_item(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.TodoItem).options(
        joinedload(models.TodoItem.assignee),
        joinedload(models.TodoItem.loss_report)
    ).filter(models.TodoItem.id == todo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Todo item not found")

    if current_user.role == models.UserRole.STAFF and item.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only toggle your own todo items")

    item.is_completed = not item.is_completed
    if item.is_completed:
        item.completed_at = datetime.now()
    else:
        item.completed_at = None

    db.commit()
    db.refresh(item)

    r = schemas.TodoItemResponse.model_validate(item)
    r.assignee_name = item.assignee.full_name if item.assignee else ''
    r.loss_report_no = item.loss_report.report_no if item.loss_report else ''
    return r


@router.delete("/{todo_id}")
def delete_todo_item(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Todo item not found")

    if current_user.role == models.UserRole.STAFF and item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own todo items")

    db.delete(item)
    db.commit()

    return {"message": "Todo item deleted successfully"}
