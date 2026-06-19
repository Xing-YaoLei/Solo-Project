from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date
import uuid
from ..database import get_db
from ..models import (
    ConflictRecord, ConflictAffectedObject, ConflictStatus,
    Reservation, TimeSlot, RescheduleRecord, TimelineRecord,
    TimelineEventType, ReservationStatus
)
from ..schemas import (
    ConflictRecordCreate, ConflictRecordUpdate, ConflictRecordResponse,
    ConflictListResponse, RescheduleCreate, RescheduleResponse
)

router = APIRouter(prefix="/api/conflicts", tags=["冲突管理"])


def generate_conflict_no():
    return f"CF{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


@router.get("", response_model=ConflictListResponse)
def get_conflicts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ConflictStatus] = None,
    severity: Optional[str] = None,
    time_slot_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    sort: Optional[str] = Query("detected_at", description="排序字段"),
    order: Optional[str] = Query("desc", description="排序方向: asc 或 desc"),
    db: Session = Depends(get_db)
):
    query = db.query(ConflictRecord)
    if status:
        query = query.filter(ConflictRecord.status == status)
    if severity:
        query = query.filter(ConflictRecord.severity == severity)
    if time_slot_id:
        query = query.filter(ConflictRecord.time_slot_id == time_slot_id)
    if assigned_to is not None:
        query = query.filter(ConflictRecord.assigned_to == assigned_to)

    sort_column = getattr(ConflictRecord, sort, ConflictRecord.detected_at)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    items = query.offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return ConflictListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{conflict_id}", response_model=ConflictRecordResponse)
def get_conflict(conflict_id: int, db: Session = Depends(get_db)):
    conflict = db.query(ConflictRecord).filter(ConflictRecord.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="冲突记录不存在")
    return conflict


@router.post("", response_model=ConflictRecordResponse)
def create_conflict(conflict: ConflictRecordCreate, db: Session = Depends(get_db)):
    conflict_no = generate_conflict_no()
    db_conflict = ConflictRecord(
        conflict_no=conflict_no,
        time_slot_id=conflict.time_slot_id,
        conflict_type=conflict.conflict_type,
        description=conflict.description,
        severity=conflict.severity
    )
    db.add(db_conflict)
    db.flush()

    for res_id in conflict.affected_reservations:
        affected = ConflictAffectedObject(
            conflict_id=db_conflict.id,
            reservation_id=res_id,
            impact_type="over_capacity",
            impact_description="时段容量冲突"
        )
        db.add(affected)
        res = db.query(Reservation).filter(Reservation.id == res_id).first()
        if res:
            res.status = ReservationStatus.CONFLICT
            timeline = TimelineRecord(
                reservation_id=res_id,
                event_type=TimelineEventType.CONFLICT_DETECTED,
                description=f"检测到时段冲突，冲突编号：{conflict_no}",
                event_metadata={"conflict_id": db_conflict.id, "conflict_no": conflict_no}
            )
            db.add(timeline)

    db.commit()
    db.refresh(db_conflict)
    return db_conflict


@router.put("/{conflict_id}", response_model=ConflictRecordResponse)
def update_conflict(
    conflict_id: int,
    conflict: ConflictRecordUpdate,
    db: Session = Depends(get_db)
):
    db_conflict = db.query(ConflictRecord).filter(ConflictRecord.id == conflict_id).first()
    if not db_conflict:
        raise HTTPException(status_code=404, detail="冲突记录不存在")

    old_status = db_conflict.status
    update_data = conflict.model_dump(exclude_unset=True)

    if "assigned_to" in update_data and update_data["assigned_to"]:
        if db_conflict.status == ConflictStatus.DETECTED:
            db_conflict.status = ConflictStatus.ASSIGNED
            affected_objs = db.query(ConflictAffectedObject).filter(
                ConflictAffectedObject.conflict_id == conflict_id
            ).all()
            for obj in affected_objs:
                timeline = TimelineRecord(
                    reservation_id=obj.reservation_id,
                    event_type=TimelineEventType.HANDOVER,
                    description=f"冲突已分配处理人，冲突编号：{db_conflict.conflict_no}",
                    event_metadata={"assigned_to": update_data["assigned_to"]}
                )
                db.add(timeline)

    if "status" in update_data:
        if update_data["status"] == ConflictStatus.RESOLVED and old_status != ConflictStatus.RESOLVED:
            db_conflict.resolved_at = datetime.now()
            affected_objs = db.query(ConflictAffectedObject).filter(
                ConflictAffectedObject.conflict_id == conflict_id
            ).all()
            for obj in affected_objs:
                res = db.query(Reservation).filter(Reservation.id == obj.reservation_id).first()
                if res and res.status == ReservationStatus.CONFLICT:
                    res.status = ReservationStatus.CONFIRMED
                timeline = TimelineRecord(
                    reservation_id=obj.reservation_id,
                    event_type=TimelineEventType.CONFLICT_RESOLVED,
                    description=f"冲突已解决，冲突编号：{db_conflict.conflict_no}",
                    event_metadata={"conflict_id": conflict_id}
                )
                db.add(timeline)

    for key, value in update_data.items():
        setattr(db_conflict, key, value)

    db.commit()
    db.refresh(db_conflict)
    return db_conflict


@router.post("/{conflict_id}/add-note")
def add_conflict_note(
    conflict_id: int,
    note: str,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    db_conflict = db.query(ConflictRecord).filter(ConflictRecord.id == conflict_id).first()
    if not db_conflict:
        raise HTTPException(status_code=404, detail="冲突记录不存在")

    affected_objs = db.query(ConflictAffectedObject).filter(
        ConflictAffectedObject.conflict_id == conflict_id
    ).all()
    for obj in affected_objs:
        timeline = TimelineRecord(
            reservation_id=obj.reservation_id,
            event_type=TimelineEventType.REMARK,
            description=f"[冲突处理] {note}",
            operator_id=operator_id,
            event_metadata={"conflict_id": conflict_id, "conflict_no": db_conflict.conflict_no}
        )
        db.add(timeline)

    db.commit()
    return {"message": "备注已添加"}


@router.post("/detect")
def detect_conflicts(time_slot_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(TimeSlot).filter(TimeSlot.is_active == True)
    if time_slot_id:
        query = query.filter(TimeSlot.id == time_slot_id)
    time_slots = query.all()

    conflicts_found = []
    for slot in time_slots:
        total_reserved = db.query(func.sum(Reservation.visitor_count)).filter(
            Reservation.time_slot_id == slot.id,
            Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CONFLICT])
        ).scalar() or 0

        if total_reserved > slot.capacity:
            existing_conflict = db.query(ConflictRecord).filter(
                ConflictRecord.time_slot_id == slot.id,
                ConflictRecord.status.in_([
                    ConflictStatus.DETECTED,
                    ConflictStatus.ASSIGNED,
                    ConflictStatus.IN_PROGRESS
                ])
            ).first()

            if not existing_conflict:
                conflict_no = generate_conflict_no()
                db_conflict = ConflictRecord(
                    conflict_no=conflict_no,
                    time_slot_id=slot.id,
                    conflict_type="over_capacity",
                    description=f"时段容量超出 {total_reserved - slot.capacity} 人",
                    severity="high" if total_reserved - slot.capacity > slot.capacity * 0.2 else "medium"
                )
                db.add(db_conflict)
                db.flush()

                reservations = db.query(Reservation).filter(
                    Reservation.time_slot_id == slot.id,
                    Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
                ).all()

                for res in reservations:
                    affected = ConflictAffectedObject(
                        conflict_id=db_conflict.id,
                        reservation_id=res.id,
                        impact_type="over_capacity",
                        impact_description=f"超出容量 {total_reserved - slot.capacity} 人"
                    )
                    db.add(affected)
                    res.status = ReservationStatus.CONFLICT
                    timeline = TimelineRecord(
                        reservation_id=res.id,
                        event_type=TimelineEventType.CONFLICT_DETECTED,
                        description=f"检测到时段容量冲突，超出 {total_reserved - slot.capacity} 人",
                        event_metadata={"conflict_id": db_conflict.id, "over_capacity": total_reserved - slot.capacity}
                    )
                    db.add(timeline)

                conflicts_found.append({
                    "conflict_no": conflict_no,
                    "time_slot_id": slot.id,
                    "over_capacity": total_reserved - slot.capacity
                })

    db.commit()
    return {"conflicts_found": len(conflicts_found), "details": conflicts_found}
