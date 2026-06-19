from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
import os
import uuid
from ..database import get_db
from ..models import (
    Reservation, TimeSlot, RescheduleRecord, TimelineRecord,
    TimelineEventType, ReservationStatus, Attachment, User, ConflictRecord
)
from ..schemas import (
    RescheduleCreate, RescheduleResponse, TimelineRecordResponse,
    AttachmentResponse, AttendanceStats
)

router = APIRouter(prefix="/api", tags=["改约与时间线"])


@router.post("/reservations/{reservation_id}/reschedule", response_model=RescheduleResponse)
def reschedule_reservation(
    reservation_id: int,
    reschedule: RescheduleCreate,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    original_res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not original_res:
        raise HTTPException(status_code=404, detail="预约单不存在")
    if original_res.status == ReservationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="已取消的预约单不能改约")

    new_slot = db.query(TimeSlot).filter(TimeSlot.id == reschedule.new_time_slot_id).first()
    if not new_slot:
        raise HTTPException(status_code=404, detail="新时段不存在")
    if not new_slot.is_active:
        raise HTTPException(status_code=400, detail="新时段不可预约")
    if new_slot.remaining_capacity < original_res.visitor_count:
        raise HTTPException(status_code=400, detail="新时段容量不足")

    old_slot = db.query(TimeSlot).filter(TimeSlot.id == original_res.time_slot_id).first()
    if old_slot:
        old_slot.remaining_capacity += original_res.visitor_count

    new_slot.remaining_capacity -= original_res.visitor_count

    new_reservation = Reservation(
        reservation_no=f"TK{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}",
        time_slot_id=reschedule.new_time_slot_id,
        visitor_name=original_res.visitor_name,
        visitor_phone=original_res.visitor_phone,
        visitor_count=original_res.visitor_count,
        ticket_type=original_res.ticket_type,
        status=ReservationStatus.CONFIRMED,
        source=original_res.source,
        remark=f"由 {original_res.reservation_no} 改约",
        created_by=operator_id
    )
    db.add(new_reservation)
    db.flush()

    reschedule_record = RescheduleRecord(
        original_reservation_id=reservation_id,
        new_reservation_id=new_reservation.id,
        original_time_slot_id=original_res.time_slot_id,
        new_time_slot_id=reschedule.new_time_slot_id,
        reason=reschedule.reason,
        operator_id=operator_id
    )
    db.add(reschedule_record)

    original_res.status = ReservationStatus.RESCHEDULED

    timeline_old = TimelineRecord(
        reservation_id=reservation_id,
        event_type=TimelineEventType.RESCHEDULED,
        description=f"改约至新时段，新预约单号：{new_reservation.reservation_no}",
        operator_id=operator_id,
        event_metadata={
            "new_reservation_id": new_reservation.id,
            "new_time_slot_id": reschedule.new_time_slot_id,
            "reason": reschedule.reason
        }
    )
    db.add(timeline_old)

    timeline_new = TimelineRecord(
        reservation_id=new_reservation.id,
        event_type=TimelineEventType.CREATED,
        description=f"由 {original_res.reservation_no} 改约而来",
        operator_id=operator_id,
        event_metadata={"original_reservation_id": reservation_id}
    )
    db.add(timeline_new)

    db.commit()
    db.refresh(reschedule_record)
    return reschedule_record


@router.get("/reservations/{reservation_id}/reschedule-history", response_model=List[RescheduleResponse])
def get_reschedule_history(reservation_id: int, db: Session = Depends(get_db)):
    records = db.query(RescheduleRecord).filter(
        (RescheduleRecord.original_reservation_id == reservation_id) |
        (RescheduleRecord.new_reservation_id == reservation_id)
    ).order_by(RescheduleRecord.reschedule_time.desc()).all()
    return records


@router.post("/reservations/{reservation_id}/timeline", response_model=TimelineRecordResponse)
def add_timeline_record(
    reservation_id: int,
    event_type: TimelineEventType,
    description: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="预约单不存在")

    timeline = TimelineRecord(
        reservation_id=reservation_id,
        event_type=event_type,
        description=description,
        operator_id=operator_id
    )
    db.add(timeline)
    db.commit()
    timeline = db.query(TimelineRecord).options(
        joinedload(TimelineRecord.operator),
        joinedload(TimelineRecord.attachments)
    ).filter(TimelineRecord.id == timeline.id).first()
    return timeline


@router.post("/timeline/{timeline_id}/attachments", response_model=List[AttachmentResponse])
async def upload_attachments(
    timeline_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    timeline = db.query(TimelineRecord).filter(TimelineRecord.id == timeline_id).first()
    if not timeline:
        raise HTTPException(status_code=404, detail="时间线记录不存在")

    upload_dir = "uploads/attachments"
    os.makedirs(upload_dir, exist_ok=True)

    attachments = []
    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_dir, new_filename)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        attachment = Attachment(
            timeline_record_id=timeline_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            file_type=file.content_type
        )
        db.add(attachment)
        attachments.append(attachment)

    db.commit()
    for att in attachments:
        db.refresh(att)
    return attachments


@router.get("/stats/attendance", response_model=List[AttendanceStats])
def get_attendance_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=7)
    if not end_date:
        end_date = date.today()

    stats = []
    current_date = start_date
    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)

        day_reservations = db.query(Reservation).join(TimeSlot).filter(
            TimeSlot.date >= current_date,
            TimeSlot.date < next_date
        ).all()

        total_reservations = len(day_reservations)
        total_visitors = sum(r.visitor_count for r in day_reservations)
        checked_in = sum(1 for r in day_reservations if r.status == ReservationStatus.CHECKED_IN)
        cancelled = sum(1 for r in day_reservations if r.status == ReservationStatus.CANCELLED)
        pending = sum(1 for r in day_reservations if r.status in [ReservationStatus.PENDING, ReservationStatus.CONFIRMED])

        check_in_rate = checked_in / total_reservations if total_reservations > 0 else 0.0

        stats.append(AttendanceStats(
            date=current_date.isoformat(),
            total_reservations=total_reservations,
            total_visitors=total_visitors,
            checked_in=checked_in,
            check_in_rate=round(check_in_rate, 4),
            cancelled=cancelled,
            pending=pending
        ))

        current_date = next_date

    return stats


@router.get("/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    today = date.today()
    tomorrow = today + timedelta(days=1)

    today_reservations = db.query(Reservation).join(TimeSlot).filter(
        TimeSlot.date >= today,
        TimeSlot.date < tomorrow
    ).all()

    total_visitors_today = sum(r.visitor_count for r in today_reservations)
    checked_in_today = sum(
        r.visitor_count for r in today_reservations
        if r.status == ReservationStatus.CHECKED_IN
    )

    pending_conflicts = db.query(ConflictRecord).filter(
        ConflictRecord.status.in_([
            "detected", "assigned", "in_progress"
        ])
    ).count()

    total_time_slots = db.query(TimeSlot).filter(
        TimeSlot.date >= today,
        TimeSlot.is_active == True
    ).count()

    return {
        "today": {
            "reservations": len(today_reservations),
            "visitors": total_visitors_today,
            "checked_in": checked_in_today,
            "check_in_rate": checked_in_today / total_visitors_today if total_visitors_today > 0 else 0
        },
        "pending_conflicts": pending_conflicts,
        "active_time_slots": total_time_slots
    }


@router.get("/export/reservations")
def export_reservations(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Reservation).join(TimeSlot)
    if start_date:
        query = query.filter(TimeSlot.date >= start_date)
    if end_date:
        query = query.filter(TimeSlot.date <= end_date)
    if status:
        status_list = [
            ReservationStatus(s.strip())
            for s in status.split(",")
            if s.strip()
        ]
        if status_list:
            query = query.filter(Reservation.status.in_(status_list))

    reservations = query.order_by(Reservation.created_at.desc()).all()

    data = []
    for r in reservations:
        data.append({
            "预约单号": r.reservation_no,
            "游客姓名": r.visitor_name,
            "联系电话": r.visitor_phone,
            "人数": r.visitor_count,
            "票种": r.ticket_type or "",
            "状态": r.status,
            "时段日期": r.time_slot.date.strftime("%Y-%m-%d") if r.time_slot else "",
            "时段时间": f"{r.time_slot.start_time}-{r.time_slot.end_time}" if r.time_slot else "",
            "来源": r.source or "",
            "创建时间": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            "签到时间": r.check_in_time.strftime("%Y-%m-%d %H:%M:%S") if r.check_in_time else "",
            "备注": r.remark or ""
        })

    return {
        "filename": f"reservations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
        "count": len(data),
        "data": data
    }


@router.get("/export/statistics")
def export_statistics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=7)
    if not end_date:
        end_date = date.today()

    stats = []
    current_date = start_date
    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)

        day_reservations = db.query(Reservation).join(TimeSlot).filter(
            TimeSlot.date >= current_date,
            TimeSlot.date < next_date
        ).all()

        total_reservations = len(day_reservations)
        total_visitors = sum(r.visitor_count for r in day_reservations)
        checked_in = sum(1 for r in day_reservations if r.status == ReservationStatus.CHECKED_IN)
        checked_in_visitors = sum(
            r.visitor_count for r in day_reservations
            if r.status == ReservationStatus.CHECKED_IN
        )
        cancelled = sum(1 for r in day_reservations if r.status == ReservationStatus.CANCELLED)
        pending = sum(1 for r in day_reservations if r.status in [ReservationStatus.PENDING, ReservationStatus.CONFIRMED])

        check_in_rate = checked_in_visitors / total_visitors if total_visitors > 0 else 0.0

        stats.append({
            "日期": current_date.isoformat(),
            "预约数": total_reservations,
            "游客数": total_visitors,
            "已签到数": checked_in,
            "签到游客数": checked_in_visitors,
            "到场率": f"{round(check_in_rate * 100, 2)}%",
            "已取消": cancelled,
            "待处理": pending
        })

        current_date = next_date

    return {
        "filename": f"attendance_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
        "count": len(stats),
        "data": stats
    }
