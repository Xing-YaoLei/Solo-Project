from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
import duckdb
import os

from app.models.models import (
    Complaint, Property, ComplaintLog, CallbackRecord, OTAOrder
)
from app.schemas.complaint import (
    ComplaintCreate, ComplaintUpdate, KPIData, TrendData,
    HeatmapData, OverdueWarning, CallbackStats,
    EscalationTimelineData, PieDataItem, ComplaintDetail
)
from app.core.config import settings


def _get_property_map(db: Session, property_ids: List[str]) -> dict:
    props = db.query(Property).filter(Property.id.in_(list(set(property_ids)))).all()
    return {p.id: p.name for p in props}


def _get_order_map(db: Session, order_ids: List[str]) -> dict:
    order_ids = [o for o in list(set(order_ids)) if o]
    if not order_ids:
        return {}
    orders = db.query(OTAOrder).filter(OTAOrder.id.in_(order_ids)).all()
    return {o.id: o.platform_order_no for o in orders}


def _enrich_complaint(db: Session, c: Complaint) -> Complaint:
    prop = db.query(Property).filter(Property.id == c.property_id).first()
    if prop:
        c.property_name = prop.name
    if c.order_id:
        order = db.query(OTAOrder).filter(OTAOrder.id == c.order_id).first()
        if order:
            c.platform_order_no = order.platform_order_no
    return c


def get_complaint(db: Session, complaint_id: str) -> Optional[ComplaintDetail]:
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        return None
    c = _enrich_complaint(db, c)
    logs = db.query(ComplaintLog).filter(ComplaintLog.complaint_id == complaint_id).order_by(ComplaintLog.created_at.desc()).all()
    callbacks = db.query(CallbackRecord).filter(CallbackRecord.complaint_id == complaint_id).order_by(CallbackRecord.created_at.desc()).all()
    detail = ComplaintDetail(
        **{k: getattr(c, k) for k in c.__dict__.keys() if not k.startswith('_')},
        logs=logs,
        callbacks=callbacks
    )
    return detail


def get_complaints(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    keyword: Optional[str] = None
) -> Tuple[List[Complaint], int]:
    query = db.query(Complaint)

    if status:
        query = query.filter(Complaint.status == status)
    if severity:
        query = query.filter(Complaint.severity == severity)
    if category:
        query = query.filter(Complaint.category == category)
    if region:
        query = query.filter(Complaint.region == region)
    if start_date:
        query = query.filter(Complaint.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Complaint.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
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
    prop_map = _get_property_map(db, prop_ids)
    order_ids = [c.order_id for c in complaints if c.order_id]
    order_map = _get_order_map(db, order_ids)

    for c in complaints:
        c.property_name = prop_map.get(c.property_id, "")
        if c.order_id:
            c.platform_order_no = order_map.get(c.order_id)

    return complaints, total


def get_overdue_warnings(db: Session, region: Optional[str] = None, limit: int = 10) -> List[OverdueWarning]:
    query = db.query(Complaint).filter(
        Complaint.is_overdue == True,
        Complaint.status.in_(["pending", "processing", "escalated"])
    )
    if region:
        query = query.filter(Complaint.region == region)
    complaints = query.order_by(Complaint.created_at.asc()).limit(limit).all()

    prop_ids = [c.property_id for c in complaints]
    prop_map = _get_property_map(db, prop_ids)

    result = []
    for c in complaints:
        result.append(OverdueWarning(
            id=c.id,
            property_name=prop_map.get(c.property_id, ""),
            category=c.category,
            severity=c.severity,
            status=c.status,
            created_at=c.created_at,
            processing_time=c.processing_time,
            target_time=c.target_time
        ))
    return result


def _yoy_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return round((current - previous) / previous * 100, 1)


def get_kpi_data(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None, region: Optional[str] = None) -> KPIData:
    now = datetime.now()
    if not end_date:
        end = now
    else:
        end = datetime.fromisoformat(end_date)
    if not start_date:
        start = end - timedelta(days=30)
    else:
        start = datetime.fromisoformat(start_date)

    period_days = (end - start).days
    start_compare = start - timedelta(days=period_days)
    end_compare = start

    def filter_period(q, s, e):
        q = q.filter(and_(Complaint.created_at >= s, Complaint.created_at < e))
        if region:
            q = q.filter(Complaint.region == region)
        return q

    current_query = filter_period(db.query(Complaint), start, end)
    compare_query = filter_period(db.query(Complaint), start_compare, end_compare)

    current = current_query.all()
    compare = compare_query.all()

    today_start = datetime(now.year, now.month, now.day)
    today_query = db.query(Complaint).filter(Complaint.created_at >= today_start)
    if region:
        today_query = today_query.filter(Complaint.region == region)
    new_today = today_query.count()

    def calc_stats(items):
        total = len(items)
        overdue = len([c for c in items if c.is_overdue and c.status in ["pending", "processing"]])
        escalated = len([c for c in items if c.escalated])
        resolved = len([c for c in items if c.status in ["resolved", "closed"]])
        processing_times = [c.processing_time for c in items if c.processing_time > 0]
        avg_time = round(sum(processing_times) / len(processing_times), 1) if processing_times else 0
        satisfied = len([c for c in items if c.callback_result == "satisfied"])
        total_callback = len([c for c in items if c.callback_result in ["satisfied", "unsatisfied"]])
        satisfaction = round(satisfied / total_callback * 100, 1) if total_callback > 0 else 0
        return total, overdue, escalated, resolved, avg_time, satisfaction

    cur_total, cur_overdue, cur_esc, cur_resolved, cur_avg, cur_sat = calc_stats(current)
    prev_total, prev_overdue, prev_esc, _, prev_avg, prev_sat = calc_stats(compare)

    return KPIData(
        totalComplaints=cur_total,
        totalComplaintsYoY=_yoy_change(cur_total, prev_total),
        newToday=new_today,
        overdueCount=cur_overdue,
        overdueCountYoY=_yoy_change(cur_overdue, prev_overdue),
        escalatedCount=cur_esc,
        escalatedCountYoY=_yoy_change(cur_esc, prev_esc),
        resolvedCount=cur_resolved,
        avgProcessingTime=cur_avg,
        avgProcessingTimeYoY=_yoy_change(cur_avg, prev_avg),
        satisfactionRate=cur_sat,
        satisfactionRateYoY=_yoy_change(cur_sat, prev_sat)
    )


def get_trend_data(db: Session, period: str = "30d", region: Optional[str] = None) -> TrendData:
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(period, 30)
    now = datetime.now()
    start = now - timedelta(days=days - 1)
    start = datetime(start.year, start.month, start.day)

    dates = []
    counts = []
    prev_counts = []
    overdue_counts = []
    escalated_counts = []

    for i in range(days):
        day_start = start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        date_str = day_start.strftime("%Y-%m-%d")
        dates.append(date_str)

        query = db.query(Complaint).filter(
            and_(Complaint.created_at >= day_start, Complaint.created_at < day_end)
        )
        if region:
            query = query.filter(Complaint.region == region)
        items = query.all()
        counts.append(len(items))
        overdue_counts.append(len([c for c in items if c.is_overdue]))
        escalated_counts.append(len([c for c in items if c.escalated]))

        prev_day_start = day_start - timedelta(days=days)
        prev_day_end = prev_day_start + timedelta(days=1)
        prev_query = db.query(Complaint).filter(
            and_(Complaint.created_at >= prev_day_start, Complaint.created_at < prev_day_end)
        )
        if region:
            prev_query = prev_query.filter(Complaint.region == region)
        prev_counts.append(prev_query.count())

    return TrendData(
        dates=dates,
        counts=counts,
        prevCounts=prev_counts,
        overdueCounts=overdue_counts,
        escalatedCounts=escalated_counts
    )


def get_heatmap_data(db: Session, region: Optional[str] = None) -> HeatmapData:
    now = datetime.now()
    start = now - timedelta(days=6)
    start = datetime(start.year, start.month, start.day)

    hours = [f"{h:02d}:00" for h in range(24)]
    days = [(start + timedelta(days=i)).strftime("%m-%d") for i in range(7)]
    heatmap_data = []

    for day_idx in range(7):
        day_start = start + timedelta(days=day_idx)
        day_end = day_start + timedelta(days=1)
        query = db.query(Complaint).filter(
            and_(Complaint.created_at >= day_start, Complaint.created_at < day_end)
        )
        if region:
            query = query.filter(Complaint.region == region)
        items = query.all()

        hour_counts = [0] * 24
        for c in items:
            h = c.created_at.hour
            hour_counts[h] += 1

        for h in range(24):
            heatmap_data.append([h, day_idx, hour_counts[h]])

    return HeatmapData(
        hours=hours,
        days=days,
        heatmapData=heatmap_data
    )


def get_callback_stats(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None, region: Optional[str] = None) -> List[CallbackStats]:
    query = db.query(Complaint).filter(Complaint.callback_result.isnot(None))
    if region:
        query = query.filter(Complaint.region == region)
    if start_date:
        query = query.filter(Complaint.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Complaint.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))

    items = query.all()
    total = len(items)
    result_map = {}
    for c in items:
        result_map[c.callback_result] = result_map.get(c.callback_result, 0) + 1

    results = []
    label_map = {"satisfied": "满意", "unsatisfied": "不满意", "pending": "待回访"}
    for key, count in result_map.items():
        results.append(CallbackStats(
            result=label_map.get(key, key),
            count=count,
            percentage=round(count / total * 100, 1) if total > 0 else 0
        ))
    return results


def get_escalation_timeline(db: Session, days: int = 30, region: Optional[str] = None) -> EscalationTimelineData:
    now = datetime.now()
    start = now - timedelta(days=days - 1)
    start = datetime(start.year, start.month, start.day)

    dates = []
    level1 = []
    level2 = []
    level3 = []
    totals = []

    for i in range(days):
        day_start = start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        dates.append(day_start.strftime("%Y-%m-%d"))

        query = db.query(Complaint).filter(
            and_(
                Complaint.escalated == True,
                Complaint.escalated_at >= day_start,
                Complaint.escalated_at < day_end
            )
        )
        if region:
            query = query.filter(Complaint.region == region)
        items = query.all()

        l1 = l2 = l3 = 0
        for c in items:
            if c.escalation_level == 1:
                l1 += 1
            elif c.escalation_level == 2:
                l2 += 1
            elif c.escalation_level >= 3:
                l3 += 1
        level1.append(l1)
        level2.append(l2)
        level3.append(l3)
        totals.append(l1 + l2 + l3)

    return EscalationTimelineData(
        dates=dates,
        level1=level1,
        level2=level2,
        level3=level3,
        totals=totals
    )


def get_responsibility_stats(db: Session, region: Optional[str] = None) -> List[PieDataItem]:
    query = db.query(Complaint).filter(Complaint.responsibility_dept.isnot(None))
    if region:
        query = query.filter(Complaint.region == region)
    items = query.all()

    dept_map = {}
    for c in items:
        key = c.responsibility_dept or "未分类"
        dept_map[key] = dept_map.get(key, 0) + 1

    return [PieDataItem(name=k, value=v) for k, v in dept_map.items()]


def get_category_stats(db: Session, region: Optional[str] = None) -> List[PieDataItem]:
    query = db.query(Complaint)
    if region:
        query = query.filter(Complaint.region == region)
    items = query.all()

    cat_map = {}
    for c in items:
        cat_map[c.category] = cat_map.get(c.category, 0) + 1

    return [PieDataItem(name=k, value=v) for k, v in cat_map.items()]


def create_complaint(db: Session, complaint: ComplaintCreate) -> Complaint:
    db_complaint = Complaint(**complaint.model_dump(exclude_unset=True))
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    log = ComplaintLog(
        complaint_id=db_complaint.id,
        action="创建客诉",
        operator="系统",
        note=f"创建客诉工单，类型：{db_complaint.category}"
    )
    db.add(log)
    db.commit()

    return _enrich_complaint(db, db_complaint)


def update_complaint(db: Session, complaint_id: str, complaint: ComplaintUpdate):
    db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_complaint:
        return None

    update_data = complaint.model_dump(exclude_unset=True)
    action = update_data.pop("action", None)
    note = update_data.pop("note", None)

    for key, value in update_data.items():
        setattr(db_complaint, key, value)

    if "status" in update_data and update_data["status"] in ["resolved", "closed"]:
        if not db_complaint.resolved_at:
            db_complaint.resolved_at = datetime.now()
        if update_data["status"] == "closed":
            db_complaint.closed_at = datetime.now()

    if complaint.callback_result:
        cb = CallbackRecord(
            complaint_id=complaint_id,
            result=complaint.callback_result,
            note=complaint.callback_note,
            operator=complaint.handler or "系统"
        )
        db.add(cb)

    log = ComplaintLog(
        complaint_id=complaint_id,
        action=action or "更新客诉",
        operator=complaint.handler or "系统",
        note=note or f"更新客诉信息"
    )
    db.add(log)

    db.commit()
    db.refresh(db_complaint)
    return _enrich_complaint(db, db_complaint)
