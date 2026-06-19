from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
import duckdb
import pandas as pd

from app.models.models import Complaint, Property
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate


def get_complaint(db: Session, complaint_id: str):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint:
        prop = db.query(Property).filter(Property.id == complaint.property_id).first()
        if prop:
            complaint.property_name = prop.name
    return complaint


def get_complaints(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    region: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    keyword: Optional[str] = None
) -> Tuple[List[Complaint], int]:
    query = db.query(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    if region:
        query = query.filter(Complaint.region == region)
    if start_date:
        query = query.filter(Complaint.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Complaint.created_at <= datetime.fromisoformat(end_date))
    if keyword:
        query = query.filter(
            or_(
                Complaint.description.contains(keyword),
                Complaint.category.contains(keyword),
                Complaint.handler.contains(keyword)
            )
        )
    
    total = query.count()
    complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    
    prop_ids = [c.property_id for c in complaints]
    props = db.query(Property).filter(Property.id.in_(prop_ids)).all()
    prop_map = {p.id: p.name for p in props}
    
    for c in complaints:
        c.property_name = prop_map.get(c.property_id, "")
    
    return complaints, total


def get_overdue_complaints(db: Session, limit: int = 10) -> List[Complaint]:
    complaints = db.query(Complaint).filter(
        Complaint.is_overdue == True,
        Complaint.status.in_(["pending", "processing", "escalated"])
    ).order_by(Complaint.created_at.asc()).limit(limit).all()
    
    prop_ids = [c.property_id for c in complaints]
    props = db.query(Property).filter(Property.id.in_(prop_ids)).all()
    prop_map = {p.id: p.name for p in props}
    
    for c in complaints:
        c.property_name = prop_map.get(c.property_id, "")
    
    return complaints


def get_kpi_data(db: Session, period: str = "week"):
    now = datetime.now()
    if period == "day":
        start = now - timedelta(days=1)
        compare_start = now - timedelta(days=2)
        compare_end = now - timedelta(days=1)
    elif period == "week":
        start = now - timedelta(weeks=1)
        compare_start = now - timedelta(weeks=2)
        compare_end = now - timedelta(weeks=1)
    else:
        start = now - timedelta(days=30)
        compare_start = now - timedelta(days=60)
        compare_end = now - timedelta(days=30)
    
    current = db.query(Complaint).filter(Complaint.created_at >= start).all()
    compare = db.query(Complaint).filter(
        and_(Complaint.created_at >= compare_start, Complaint.created_at < compare_end)
    ).all()
    
    total_current = len(current)
    pending_current = len([c for c in current if c.status in ["pending", "processing"]])
    overdue_current = len([c for c in current if c.is_overdue and c.status in ["pending", "processing"]])
    processing_times = [c.processing_time for c in current if c.processing_time > 0]
    avg_processing_current = sum(processing_times) / len(processing_times) if processing_times else 0
    escalated_current = len([c for c in current if c.escalated])
    escalation_rate_current = (escalated_current / total_current * 100) if total_current > 0 else 0
    satisfied_current = len([c for c in current if c.callback_result == "satisfied"])
    total_callback = len([c for c in current if c.callback_result in ["satisfied", "unsatisfied"]])
    satisfaction_rate_current = (satisfied_current / total_callback * 100) if total_callback > 0 else 0
    
    total_compare = len(compare)
    overdue_compare = len([c for c in compare if c.is_overdue and c.status in ["pending", "processing"]])
    processing_times_compare = [c.processing_time for c in compare if c.processing_time > 0]
    avg_processing_compare = sum(processing_times_compare) / len(processing_times_compare) if processing_times_compare else 0
    escalated_compare = len([c for c in compare if c.escalated])
    escalation_rate_compare = (escalated_compare / total_compare * 100) if total_compare > 0 else 0
    satisfied_compare = len([c for c in compare if c.callback_result == "satisfied"])
    total_callback_compare = len([c for c in compare if c.callback_result in ["satisfied", "unsatisfied"]])
    satisfaction_rate_compare = (satisfied_compare / total_callback_compare * 100) if total_callback_compare > 0 else 0
    
    return {
        "totalComplaints": total_current,
        "pendingCount": pending_current,
        "overdueCount": overdue_current,
        "avgProcessingTime": round(avg_processing_current, 1),
        "escalationRate": round(escalation_rate_current, 1),
        "satisfactionRate": round(satisfaction_rate_current, 1),
        "period": period,
        "compareValue": {
            "totalComplaints": total_compare,
            "overdueCount": overdue_compare,
            "avgProcessingTime": round(avg_processing_compare, 1),
            "escalationRate": round(escalation_rate_compare, 1),
            "satisfactionRate": round(satisfaction_rate_compare, 1)
        }
    }


def get_trend_data(db: Session, start_date: str, end_date: str, compare: str = "none"):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    days = (end - start).days
    dates = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days + 1)]
    
    current_counts = []
    for d in dates:
        day_start = datetime.fromisoformat(d)
        day_end = day_start + timedelta(days=1)
        count = db.query(Complaint).filter(
            and_(Complaint.created_at >= day_start, Complaint.created_at < day_end)
        ).count()
        current_counts.append(count)
    
    compare_counts = [0] * len(dates)
    if compare == "yoy":
        compare_dates = [(start + timedelta(days=i) - timedelta(days=365)).strftime("%Y-%m-%d") for i in range(days + 1)]
        for i, d in enumerate(compare_dates):
            day_start = datetime.fromisoformat(d)
            day_end = day_start + timedelta(days=1)
            count = db.query(Complaint).filter(
                and_(Complaint.created_at >= day_start, Complaint.created_at < day_end)
            ).count()
            compare_counts[i] = count
    elif compare == "mom":
        compare_dates = [(start + timedelta(days=i) - timedelta(days=30)).strftime("%Y-%m-%d") for i in range(days + 1)]
        for i, d in enumerate(compare_dates):
            day_start = datetime.fromisoformat(d)
            day_end = day_start + timedelta(days=1)
            count = db.query(Complaint).filter(
                and_(Complaint.created_at >= day_start, Complaint.created_at < day_end)
            ).count()
            compare_counts[i] = count
    
    return {
        "dates": dates,
        "current": current_counts,
        "compare": compare_counts
    }


def get_heatmap_data(db: Session, date: Optional[str] = None):
    if date:
        start = datetime.fromisoformat(date)
        end = start + timedelta(days=1)
    else:
        end = datetime.now()
        start = end - timedelta(days=7)
    
    result = db.query(
        Complaint.region,
        func.avg(Complaint.processing_time),
        func.sum(func.case((Complaint.is_overdue == True, 1), else_=0))
    ).filter(
        and_(Complaint.created_at >= start, Complaint.created_at < end),
        Complaint.processing_time > 0
    ).group_by(Complaint.region).all()
    
    regions = [r[0] for r in result]
    avg_times = [round(float(r[1] or 0), 1) for r in result]
    overdue_counts = [int(r[2] or 0) for r in result]
    
    return {
        "regions": regions,
        "avgTime": avg_times,
        "overdueCount": overdue_counts
    }


def get_escalation_series(db: Session, start_date: str, end_date: str, compare: str = "none"):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    days = (end - start).days
    dates = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days + 1)]
    
    current_counts = []
    levels_data = []
    
    for d in dates:
        day_start = datetime.fromisoformat(d)
        day_end = day_start + timedelta(days=1)
        escalated = db.query(Complaint).filter(
            and_(
                Complaint.escalated == True,
                Complaint.escalated_at >= day_start,
                Complaint.escalated_at < day_end
            )
        ).all()
        current_counts.append(len(escalated))
        
        level_counts = [0, 0, 0]
        for c in escalated:
            if 1 <= c.escalation_level <= 3:
                level_counts[c.escalation_level - 1] += 1
        levels_data.append(level_counts)
    
    compare_counts = [0] * len(dates)
    if compare == "yoy":
        for i, d in enumerate(dates):
            comp_date = (datetime.fromisoformat(d) - timedelta(days=365)).strftime("%Y-%m-%d")
            day_start = datetime.fromisoformat(comp_date)
            day_end = day_start + timedelta(days=1)
            count = db.query(Complaint).filter(
                and_(
                    Complaint.escalated == True,
                    Complaint.escalated_at >= day_start,
                    Complaint.escalated_at < day_end
                )
            ).count()
            compare_counts[i] = count
    elif compare == "mom":
        for i, d in enumerate(dates):
            comp_date = (datetime.fromisoformat(d) - timedelta(days=30)).strftime("%Y-%m-%d")
            day_start = datetime.fromisoformat(comp_date)
            day_end = day_start + timedelta(days=1)
            count = db.query(Complaint).filter(
                and_(
                    Complaint.escalated == True,
                    Complaint.escalated_at >= day_start,
                    Complaint.escalated_at < day_end
                )
            ).count()
            compare_counts[i] = count
    
    return {
        "dates": dates,
        "current": current_counts,
        "compare": compare_counts,
        "levels": levels_data
    }


def create_complaint(db: Session, complaint: ComplaintCreate):
    db_complaint = Complaint(**complaint.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


def update_complaint(db: Session, complaint_id: str, complaint: ComplaintUpdate):
    db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if db_complaint:
        update_data = complaint.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_complaint, key, value)
        db.commit()
        db.refresh(db_complaint)
    return db_complaint
