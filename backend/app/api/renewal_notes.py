from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
from ..services import repository as repo

router = APIRouter(prefix="/api/renewal-notes", tags=["续费备注任务"])


class NoteCreate(BaseModel):
    member_id: int
    membership_id: Optional[int] = None
    source: Optional[str] = "manual"
    title: str
    content: str
    status: Optional[str] = "pending"
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = "system"
    related_funnel_stage: Optional[str] = None
    related_metric: Optional[str] = None
    remark: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    conclusion: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_by_name: Optional[str] = None
    related_funnel_stage: Optional[str] = None
    related_metric: Optional[str] = None
    remark: Optional[str] = None


@router.get("")
def list_notes(
    member_id: Optional[int] = Query(None, description="会员ID"),
    status: Optional[str] = Query(None, description="状态: pending/in_progress/resolved/closed"),
    source: Optional[str] = Query(None, description="来源: manual/expiry_warning/analysis/refund"),
    related_funnel_stage: Optional[str] = Query(None, description="关联漏斗阶段"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    return repo.list_notes(member_id, status, source, related_funnel_stage, page, page_size)


@router.get("/by-funnel-stage/{stage}")
def list_notes_by_funnel_stage(
    stage: str,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    return repo.list_notes(None, status, None, stage, page, page_size)


@router.get("/{note_id}")
def get_note(note_id: int):
    item = repo.get_note(note_id)
    if not item:
        raise HTTPException(status_code=404, detail="备注任务不存在")
    return item


@router.post("")
def create_note_endpoint(note: NoteCreate):
    return repo.create_note(note.model_dump())


@router.put("/{note_id}")
def update_note_endpoint(note_id: int, note_update: NoteUpdate):
    result = repo.update_note(note_id, note_update.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="备注任务不存在")
    return result


@router.delete("/{note_id}")
def delete_note_endpoint(note_id: int):
    ok = repo.delete_note(note_id)
    if not ok:
        raise HTTPException(status_code=404, detail="备注任务不存在")
    return {"message": "删除成功"}


@router.post("/generate-expiry-tasks")
def generate_expiry_tasks(operator_name: Optional[str] = "system"):
    count = repo.generate_expiry_renewal_notes(operator_name)
    return {"message": f"已生成 {count} 条续费备注任务", "count": count}
