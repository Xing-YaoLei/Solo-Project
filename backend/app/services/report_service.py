from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import datetime, timedelta
import duckdb
import pandas as pd
import os

from app.models.models import Complaint, Property
from app.core.config import settings


def get_close_duration_report(db: Session, property_ids: Optional[List[str]] = None):
    query = db.query(
        Property.name,
        func.avg(Complaint.processing_time)
    ).join(Complaint, Property.id == Complaint.property_id).filter(
        Complaint.status == "closed",
        Complaint.processing_time > 0
    )
    
    if property_ids:
        query = query.filter(Property.id.in_(property_ids))
    
    result = query.group_by(Property.name).order_by(func.avg(Complaint.processing_time).desc()).limit(10).all()
    
    categories = [r[0] for r in result]
    avg_times = [round(float(r[1] or 0), 1) for r in result]
    
    return {
        "dimension": "closeDuration",
        "categories": categories,
        "series": [
            {"name": "平均处理时长(分钟)", "data": avg_times}
        ]
    }


def get_date_compare_report(db: Session, start_date1: str, end_date1: str, 
                            start_date2: str, end_date2: str):
    start1 = datetime.fromisoformat(start_date1)
    end1 = datetime.fromisoformat(end_date1)
    start2 = datetime.fromisoformat(start_date2)
    end2 = datetime.fromisoformat(end_date2)
    
    categories = ["客诉总量", "待处理数", "已解决数", "已关闭数", "超单数", "升级率%", "满意度%"]
    
    def get_metrics(start, end):
        complaints = db.query(Complaint).filter(
            and_(Complaint.created_at >= start, Complaint.created_at < end)
        ).all()
        
        total = len(complaints)
        pending = len([c for c in complaints if c.status == "pending"])
        resolved = len([c for c in complaints if c.status == "resolved"])
        closed = len([c for c in complaints if c.status == "closed"])
        overdue = len([c for c in complaints if c.is_overdue])
        escalated = len([c for c in complaints if c.escalated])
        escalation_rate = round((escalated / total * 100) if total > 0 else 0, 1)
        satisfied = len([c for c in complaints if c.callback_result == "satisfied"])
        total_callback = len([c for c in complaints if c.callback_result in ["satisfied", "unsatisfied"]])
        satisfaction = round((satisfied / total_callback * 100) if total_callback > 0 else 0, 1)
        
        return [total, pending, resolved, closed, overdue, escalation_rate, satisfaction]
    
    metrics1 = get_metrics(start1, end1)
    metrics2 = get_metrics(start2, end2)
    
    return {
        "dimension": "date",
        "categories": categories,
        "series": [
            {"name": f"{start_date1} ~ {end_date1}", "data": metrics1},
            {"name": f"{start_date2} ~ {end_date2}", "data": metrics2}
        ]
    }


def get_region_compare_report(db: Session, regions: Optional[List[str]] = None, 
                              metrics: Optional[List[str]] = None):
    default_metrics = ["客诉总量", "平均处理时长", "超单数", "升级率%", "满意度%"]
    selected_metrics = metrics if metrics else default_metrics
    
    query = db.query(Complaint)
    if regions:
        query = query.filter(Complaint.region.in_(regions))
    
    all_complaints = query.all()
    
    region_list = list(set([c.region for c in all_complaints]))
    
    series_data = []
    for metric in selected_metrics:
        data = []
        for region in region_list:
            region_complaints = [c for c in all_complaints if c.region == region]
            total = len(region_complaints)
            
            if metric == "客诉总量":
                data.append(total)
            elif metric == "平均处理时长":
                processing_times = [c.processing_time for c in region_complaints if c.processing_time > 0]
                data.append(round(sum(processing_times) / len(processing_times) if processing_times else 0, 1))
            elif metric == "超单数":
                data.append(len([c for c in region_complaints if c.is_overdue]))
            elif metric == "升级率%":
                escalated = len([c for c in region_complaints if c.escalated])
                data.append(round((escalated / total * 100) if total > 0 else 0, 1))
            elif metric == "满意度%":
                satisfied = len([c for c in region_complaints if c.callback_result == "satisfied"])
                total_callback = len([c for c in region_complaints if c.callback_result in ["satisfied", "unsatisfied"]])
                data.append(round((satisfied / total_callback * 100) if total_callback > 0 else 0, 1))
        series_data.append({"name": metric, "data": data})
    
    return {
        "dimension": "region",
        "categories": region_list,
        "series": series_data
    }


def get_duckdb_analysis(db: Session):
    os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
    
    complaints = db.query(Complaint).all()
    data = [{
        "id": c.id,
        "region": c.region,
        "category": c.category,
        "severity": c.severity,
        "status": c.status,
        "created_at": c.created_at,
        "processing_time": c.processing_time,
        "is_overdue": c.is_overdue,
        "escalated": c.escalated,
        "escalation_level": c.escalation_level,
        "callback_result": c.callback_result,
        "responsibility_dept": c.responsibility_dept
    } for c in complaints]
    
    df = pd.DataFrame(data)
    
    conn = duckdb.connect(settings.DUCKDB_PATH)
    conn.register("complaints", df)
    
    result = conn.execute("""
        SELECT 
            region,
            COUNT(*) as total,
            AVG(processing_time) as avg_time,
            SUM(CASE WHEN is_overdue THEN 1 ELSE 0 END) as overdue_count,
            SUM(CASE WHEN escalated THEN 1 ELSE 0 END) as escalated_count
        FROM complaints
        GROUP BY region
        ORDER BY total DESC
    """).fetchdf()
    
    dept_result = conn.execute("""
        SELECT 
            responsibility_dept,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM complaints WHERE responsibility_dept IS NOT NULL), 1) as percentage
        FROM complaints
        WHERE responsibility_dept IS NOT NULL
        GROUP BY responsibility_dept
        ORDER BY count DESC
    """).fetchdf()
    
    conn.close()
    
    return {
        "region_summary": result.to_dict('records'),
        "responsibility_summary": dept_result.to_dict('records')
    }
