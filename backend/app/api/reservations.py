from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date
import uuid
from ..database import get_db
from ..models import Reservation, TimeSlot, TimelineRecord, TimelineEventType, User
from ..schemas import (
    ReservationCreate, ReservationUpdate, ReservationResponse, ReservationListResponse,
    TimelineRecordCreate, TimelineRecordResponse
)

router = APIRouter(prefix="/api/reservations", tags=["预约管理"])


def generate_reservation_no():
    return f"TK{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


@router.get("", response_model=ReservationListResponse)
def get_reservations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    time_slot_id: Optional[int] = None,
    status: Optional[str] = None,
    visitor_name: Optional[str] = None,
    visitor_phone: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Reservation)
    if time_slot_id:
        query = query.filter(Reservation.time_slot_id == time_slot_id)
    if status:
        query = query.filter(Reservation.status == status)
    if visitor_name:
        query = query.filter(Reservation.visitor_name.contains(visitor_name))
    if visitor_phone:
        query = query.filter(Reservation.visitor_phone.contains(visitor_phone))
    if start_date or end_date:
        query = query.join(TimeSlot)
        if start_date:
            query = query.filter(TimeSlot.date >= start_date)
        if end_date:
            query = query.filter(TimeSlot.date <= end_date)

    total = query.count()
    items = query.order_by(Reservation.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return ReservationListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="预约单不存在")
    return reservation


@router.post("", response_model=ReservationResponse)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == reservation.time_slot_id).first()
    if not time_slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    if not time_slot.is_active:
        raise HTTPException(status_code=400, detail="该时段不可预约")
    if time_slot.remaining_capacity < reservation.visitor_count:
        raise HTTPException(status_code=400, detail="该时段容量不足")

    reservation_no = generate_reservation_no()
    db_reservation = Reservation(
        **reservation.model_dump(),
        reservation_no=reservation_no
    )
    db.add(db_reservation)

    time_slot.remaining_capacity -= reservation.visitor_count

    db.commit()
    db.refresh(db_reservation)

    timeline = TimelineRecord(
        reservation_id=db_reservation.id,
        event_type=TimelineEventType.CREATED,
        description=f"创建预约单 {reservation_no}",
        event_metadata={"visitor_count": reservation.visitor_count}
    )
    db.add(timeline)
    db.commit()

    return db_reservation


@router.put("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    db: Session = Depends(get_db)
):
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="预约单不存在")

    old_status = db_reservation.status
    update_data = reservation.model_dump(exclude_unset=True)

    if "visitor_count" in update_data and update_data["visitor_count"] != db_reservation.visitor_count:
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == db_reservation.time_slot_id).first()
        diff = update_data["visitor_count"] - db_reservation.visitor_count
        if diff > 0 and time_slot.remaining_capacity < diff:
            raise HTTPException(status_code=400, detail="该时段容量不足")
        time_slot.remaining_capacity -= diff

    for key, value in update_data.items():
        setattr(db_reservation, key, value)

    if "status" in update_data and old_status != update_data["status"]:
        timeline = TimelineRecord(
            reservation_id=reservation_id,
            event_type=TimelineEventType.STATUS_CHANGED,
            description=f"状态变更：{old_status} -> {update_data['status']}",
            event_metadata={"old_status": old_status, "new_status": update_data["status"]}
        )
        db.add(timeline)

    db.commit()
    db.refresh(db_reservation)
    return db_reservation


@router.delete("/{reservation_id}")
def delete_reservation(reservation_id: int, db: Session = Depends(get_db)):
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="预约单不存在")

    time_slot = db.query(TimeSlot).filter(TimeSlot.id == db_reservation.time_slot_id).first()
    if time_slot and db_reservation.status in ["pending", "confirmed"]:
        time_slot.remaining_capacity += db_reservation.visitor_count

    db.delete(db_reservation)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{reservation_id}/check-in", response_model=ReservationResponse)
def check_in(reservation_id: int, db: Session = Depends(get_db)):
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="预约单不存在")
    if db_reservation.status == "checked_in":
        raise HTTPException(status_code=400, detail="已完成签到")

    db_reservation.status = "checked_in"
    db_reservation.check_in_time = datetime.now()

    timeline = TimelineRecord(
        reservation_id=reservation_id,
        event_type=TimelineEventType.STATUS_CHANGED,
        description="游客已到场签到"
    )
    db.add(timeline)
    db.commit()
    db.refresh(db_reservation)
    return db_reservation


@router.post("/batch")
def batch_operation(
    operation: str = Query(...),
    reservation_ids: List[int] = Query(...),
    db: Session = Depends(get_db)
):
    if operation == "cancel":
        for rid in reservation_ids:
            res = db.query(Reservation).filter(Reservation.id == rid).first()
            if res and res.status in ["pending", "confirmed"]:
                res.status = "cancelled"
                time_slot = db.query(TimeSlot).filter(TimeSlot.id == res.time_slot_id).first()
                if time_slot:
                    time_slot.remaining_capacity += res.visitor_count
        db.commit()
        return {"message": f"已取消 {len(reservation_ids)} 条预约"}
    elif operation == "confirm":
        for rid in reservation_ids:
            res = db.query(Reservation).filter(Reservation.id == rid).first()
            if res and res.status == "pending":
                res.status = "confirmed"
        db.commit()
        return {"message": f"已确认 {len(reservation_ids)} 条预约"}
    else:
        raise HTTPException(status_code=400, detail="不支持的操作类型")


@router.get("/{reservation_id}/timeline", response_model=List[TimelineRecordResponse])
def get_reservation_timeline(reservation_id: int, db: Session = Depends(get_db)):
    return db.query(TimelineRecord).filter(
        TimelineRecord.reservation_id == reservation_id
    ).order_by(TimelineRecord.created_at.desc()).all()
