from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"])


@router.get("/")
def list_conflicts(
    status: Optional[str] = Query(None),
    source_system: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.CaliberConflict)
    if status:
        query = query.filter(models.CaliberConflict.resolution_status == status)
    if source_system:
        query = query.filter(
            (models.CaliberConflict.source_system_a == source_system)
            | (models.CaliberConflict.source_system_b == source_system)
        )
    conflicts = query.order_by(models.CaliberConflict.conflict_date.desc()).all()
    return [
        {
            "id": c.id,
            "conflict_id": c.conflict_id,
            "patient_id": c.patient_id,
            "source_system_a": c.source_system_a,
            "source_system_b": c.source_system_b,
            "conflict_field": c.conflict_field,
            "value_a": c.value_a,
            "value_b": c.value_b,
            "conflict_date": c.conflict_date.isoformat() if c.conflict_date else None,
            "resolution_status": c.resolution_status,
            "resolved_by": c.resolved_by,
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None,
            "resolution_notes": c.resolution_notes,
        }
        for c in conflicts
    ]


@router.get("/stats")
def conflict_stats(db: Session = Depends(get_db)):
    total = db.query(models.CaliberConflict).count()
    pending = db.query(models.CaliberConflict).filter(
        models.CaliberConflict.resolution_status == "pending"
    ).count()
    resolved = db.query(models.CaliberConflict).filter(
        models.CaliberConflict.resolution_status == "resolved"
    ).count()

    field_dist = {}
    rows = db.query(
        models.CaliberConflict.conflict_field,
    ).filter(
        models.CaliberConflict.resolution_status == "pending"
    ).all()
    for r in rows:
        field = r.conflict_field or "unknown"
        field_dist[field] = field_dist.get(field, 0) + 1

    return {
        "total": total,
        "pending": pending,
        "resolved": resolved,
        "field_distribution": field_dist,
    }


@router.get("/{conflict_id}")
def get_conflict(conflict_id: int, db: Session = Depends(get_db)):
    conflict = db.query(models.CaliberConflict).filter(
        models.CaliberConflict.id == conflict_id
    ).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return {
        "id": conflict.id,
        "conflict_id": conflict.conflict_id,
        "patient_id": conflict.patient_id,
        "source_system_a": conflict.source_system_a,
        "source_system_b": conflict.source_system_b,
        "conflict_field": conflict.conflict_field,
        "value_a": conflict.value_a,
        "value_b": conflict.value_b,
        "conflict_date": conflict.conflict_date.isoformat() if conflict.conflict_date else None,
        "resolution_status": conflict.resolution_status,
        "resolved_by": conflict.resolved_by,
        "resolved_at": conflict.resolved_at.isoformat() if conflict.resolved_at else None,
        "resolution_notes": conflict.resolution_notes,
    }


@router.put("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: int,
    resolution_status: str = Query(..., description="resolved or dismissed"),
    resolved_by: Optional[str] = Query(None),
    resolution_notes: Optional[str] = Query(None),
    keep_both: bool = Query(True, description="保留差异，不覆盖任一方"),
    db: Session = Depends(get_db),
):
    conflict = db.query(models.CaliberConflict).filter(
        models.CaliberConflict.id == conflict_id
    ).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conflict.resolution_status = resolution_status
    conflict.resolved_by = resolved_by
    conflict.resolution_notes = resolution_notes
    if keep_both:
        if resolution_notes:
            conflict.resolution_notes = f"[保留差异] {resolution_notes}"
        else:
            conflict.resolution_notes = "[保留差异] 双方数据均保留，未覆盖任一来源"

    from datetime import datetime
    conflict.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(conflict)
    return {
        "id": conflict.id,
        "conflict_id": conflict.conflict_id,
        "resolution_status": conflict.resolution_status,
        "resolved_by": conflict.resolved_by,
        "resolved_at": conflict.resolved_at.isoformat() if conflict.resolved_at else None,
        "resolution_notes": conflict.resolution_notes,
    }
