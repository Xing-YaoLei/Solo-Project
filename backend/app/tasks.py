from celery import Celery
from .config import get_settings
import pandas as pd
from datetime import datetime
import os

settings = get_settings()

celery = Celery(
    "ticket_reservation",
    broker=settings.redis_url,
    backend=settings.redis_url
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)


@celery.task(name="tasks.detect_conflicts")
def detect_conflicts_task():
    from .database import SessionLocal
    from .models import TimeSlot, Reservation, ConflictRecord, ConflictAffectedObject, TimelineRecord, TimelineEventType, ReservationStatus
    from sqlalchemy import func
    import uuid

    db = SessionLocal()
    try:
        time_slots = db.query(TimeSlot).filter(TimeSlot.is_active == True).all()
        conflicts_count = 0

        for slot in time_slots:
            total_reserved = db.query(func.sum(Reservation.visitor_count)).filter(
                Reservation.time_slot_id == slot.id,
                Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CONFLICT])
            ).scalar() or 0

            if total_reserved > slot.capacity:
                existing_conflict = db.query(ConflictRecord).filter(
                    ConflictRecord.time_slot_id == slot.id,
                    ConflictRecord.status.in_(["detected", "assigned", "in_progress"])
                ).first()

                if not existing_conflict:
                    conflict_no = f"CF{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
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
                            event_metadata={"conflict_id": db_conflict.id}
                        )
                        db.add(timeline)

                    conflicts_count += 1

        db.commit()
        return {"conflicts_found": conflicts_count}
    finally:
        db.close()


@celery.task(name="tasks.export_reservations")
def export_reservations_task(start_date=None, end_date=None, status_list=None, export_format="excel"):
    from .database import SessionLocal
    from .models import Reservation, TimeSlot

    db = SessionLocal()
    try:
        query = db.query(Reservation).join(TimeSlot)
        if start_date:
            query = query.filter(TimeSlot.date >= start_date)
        if end_date:
            query = query.filter(TimeSlot.date <= end_date)
        if status_list:
            query = query.filter(Reservation.status.in_(status_list))

        reservations = query.all()

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

        df = pd.DataFrame(data)
        export_dir = "exports"
        os.makedirs(export_dir, exist_ok=True)
        filename = f"reservations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = os.path.join(export_dir, filename)

        df.to_excel(filepath, index=False, engine="openpyxl")

        return {"filepath": filepath, "filename": filename, "count": len(data)}
    finally:
        db.close()


@celery.task(name="tasks.calculate_attendance")
def calculate_attendance_task(date_str=None):
    from .database import SessionLocal
    from .models import Reservation, TimeSlot, ReservationStatus
    from datetime import date, timedelta
    from sqlalchemy import func

    db = SessionLocal()
    try:
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            target_date = date.today() - timedelta(days=1)

        next_date = target_date + timedelta(days=1)

        day_reservations = db.query(Reservation).join(TimeSlot).filter(
            TimeSlot.date >= target_date,
            TimeSlot.date < next_date
        ).all()

        total_reservations = len(day_reservations)
        total_visitors = sum(r.visitor_count for r in day_reservations)
        checked_in_visitors = sum(
            r.visitor_count for r in day_reservations
            if r.status == ReservationStatus.CHECKED_IN
        )
        cancelled = sum(1 for r in day_reservations if r.status == ReservationStatus.CANCELLED)

        attendance_rate = checked_in_visitors / total_visitors if total_visitors > 0 else 0

        return {
            "date": target_date.isoformat(),
            "total_reservations": total_reservations,
            "total_visitors": total_visitors,
            "checked_in_visitors": checked_in_visitors,
            "attendance_rate": round(attendance_rate, 4),
            "cancelled": cancelled
        }
    finally:
        db.close()
