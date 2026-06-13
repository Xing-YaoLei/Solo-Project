from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.database import get_db
from ..models.renewal_note import RenewalNote
from ..schemas.threshold_note import (
    RenewalNoteCreate,
    RenewalNoteUpdate,
    RenewalNoteResponse,
)
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/renewal-notes", tags=["续费备注任务"])


def generate_note_no():
    return f"NOTE{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


@router.get("", response_model=List[RenewalNoteResponse])
def list_notes(
    member_id: Optional[int] = Query(None, description="会员ID"),
    status: Optional[str] = Query(None, description="状态"),
    source: Optional[str] = Query(None, description="来源"),
    related_funnel_stage: Optional[str] = Query(None, description="关联漏斗阶段"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(RenewalNote)

    if member_id:
        query = query.filter(RenewalNote.member_id == member_id)
    if status:
        query = query.filter(RenewalNote.status == status)
    if source:
        query = query.filter(RenewalNote.source == source)
    if related_funnel_stage:
        query = query.filter(RenewalNote.related_funnel_stage == related_funnel_stage)

    notes = query.order_by(
        RenewalNote.priority.desc(),
        RenewalNote.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()

    return notes


@router.get("/{note_id}", response_model=RenewalNoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(RenewalNote).filter(RenewalNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="备注任务不存在")
    return note


@router.post("", response_model=RenewalNoteResponse)
def create_note(note: RenewalNoteCreate, db: Session = Depends(get_db)):
    db_note = RenewalNote(
        **note.model_dump(),
        note_no=generate_note_no(),
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.put("/{note_id}", response_model=RenewalNoteResponse)
def update_note(
    note_id: int,
    note_update: RenewalNoteUpdate,
    db: Session = Depends(get_db)
):
    db_note = db.query(RenewalNote).filter(RenewalNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="备注任务不存在")

    update_data = note_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == "resolved" and db_note.status != "resolved":
        update_data["resolved_at"] = datetime.now()
        if not update_data.get("resolved_by_name"):
            update_data["resolved_by_name"] = "system"

    for key, value in update_data.items():
        setattr(db_note, key, value)

    db.commit()
    db.refresh(db_note)
    return db_note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(RenewalNote).filter(RenewalNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="备注任务不存在")

    db.delete(db_note)
    db.commit()
    return {"message": "删除成功"}
