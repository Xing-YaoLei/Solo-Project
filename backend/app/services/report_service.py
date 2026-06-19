from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import datetime, timedelta
import duckdb
import os
import pandas as pd

from app.models.models import Complaint
from app.schemas.report import (
    DurationReport, DurationReportRaw, RegionReport,
    DateReport, DateReportRaw, ComparisonReport, PeriodData,
    PieDataItem, DuckDBAnalysis, DuckDBRegionSummary, DuckDBResponsibilitySummary,
    ReportSeries
)
from app.core.config import settings


def _duration_bucket(minutes: int) -> str:
    if minutes < 60:
        return "less_than_1h"
    elif minutes < 180:
        return "between_1_3h"
    elif minutes < 720:
        return "between_3_12h"
    elif minutes < 1440:
        return "between_12_24h"
    else:
        return "more_than_24h"


def get_close_duration_report(
    db: Session,
    region: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> DurationReport:
    query = db.query(Complaint).filter(Complaint.status.in_(["resolved", "closed"]))
    if region:
        query = query.filter(Complaint.region == region)
    if start_date:
        query = query.filter(Complaint.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Complaint.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))

    items = query.all()

    region_data = {}
    for c in items:
        r = c.region
        if r not in region_data:
            region_data[r] = {
                "total": 0, "less_than_1h": 0, "between_1_3h": 0,
                "between_3_12h": 0, "between_12_24h": 0, "more_than_24h": 0,
                "times": []
            }
        region_data[r]["total"] += 1
        if c.processing_time > 0:
            bucket = _duration_bucket(c.processing_time)
            region_data[r][bucket] += 1
            region_data[r]["times"].append(c.processing_time)

    raw_data = []
    regions = []
    less_1h = []
    bet_1_3h = []
    bet_3_12h = []
    bet_12_24h = []
    more_24h = []
    avg_times = []

    for r, d in sorted(region_data.items()):
        regions.append(r)
        less_1h.append(d["less_than_1h"])
        bet_1_3h.append(d["between_1_3h"])
        bet_3_12h.append(d["between_3_12h"])
        bet_12_24h.append(d["between_12_24h"])
        more_24h.append(d["more_than_24h"])
        avg = round(sum(d["times"]) / len(d["times"]), 1) if d["times"] else 0
        avg_times.append(avg)
        raw_data.append(DurationReportRaw(
            region=r,
            total=d["total"],
            less_than_1h=d["less_than_1h"],
            between_1_3h=d["between_1_3h"],
            between_3_12h=d["between_3_12h"],
            between_12_24h=d["between_12_24h"],
            more_than_24h=d["more_than_24h"],
            avg_time=avg
        ))

    return DurationReport(
        regions=regions,
        lessThan1h=less_1h,
        between1_3h=bet_1_3h,
        between3_12h=bet_3_12h,
        between12_24h=bet_12_24h,
        moreThan24h=more_24h,
        avgTimes=avg_times,
        rawData=raw_data
    )


def get_region_report(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[RegionReport]:
    query = db.query(Complaint)
    if start_date:
        query = query.filter(Complaint.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Complaint.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))

    items = query.all()
    region_map = {}

    for c in items:
        r = c.region
        if r not in region_map:
            region_map[r] = {
                "total": 0, "closed": 0, "overdue": 0,
                "escalated": 0, "satisfied": 0, "callback_total": 0,
                "times": []
            }
        region_map[r]["total"] += 1
        if c.status in ["resolved", "closed"]:
            region_map[r]["closed"] += 1
        if c.is_overdue:
            region_map[r]["overdue"] += 1
        if c.escalated:
            region_map[r]["escalated"] += 1
        if c.callback_result in ["satisfied", "unsatisfied"]:
            region_map[r]["callback_total"] += 1
            if c.callback_result == "satisfied":
                region_map[r]["satisfied"] += 1
        if c.processing_time > 0:
            region_map[r]["times"].append(c.processing_time)

    result = []
    for r, d in region_map.items():
        avg_time = round(sum(d["times"]) / len(d["times"]), 1) if d["times"] else 0
        result.append(RegionReport(
            region=r,
            total=d["total"],
            closed=d["closed"],
            closedRate=round(d["closed"] / d["total"] * 100, 1) if d["total"] > 0 else 0,
            overdue=d["overdue"],
            overdueRate=round(d["overdue"] / d["total"] * 100, 1) if d["total"] > 0 else 0,
            satisfactionRate=round(d["satisfied"] / d["callback_total"] * 100, 1) if d["callback_total"] > 0 else 0,
            avgProcessingTime=avg_time
        ))
    return result


def get_date_report(
    db: Session,
    days: int = 90,
    region: Optional[str] = None
) -> DateReport:
    now = datetime.now()
    start = now - timedelta(days=days - 1)
    start = datetime(start.year, start.month, 1)

    months = []
    current = start
    while current <= now:
        months.append(current.strftime("%Y-%m"))
        if current.month == 12:
            current = datetime(current.year + 1, 1, 1)
        else:
            current = datetime(current.year, current.month + 1, 1)

    query = db.query(Complaint)
    if region:
        query = query.filter(Complaint.region == region)
    query = query.filter(Complaint.created_at >= start)
    items = query.all()

    month_region_data = {}
    region_set = set()
    for c in items:
        m = c.created_at.strftime("%Y-%m")
        r = c.region
        region_set.add(r)
        key = (m, r)
        if key not in month_region_data:
            month_region_data[key] = {
                "total": 0, "overdue": 0, "escalated": 0, "times": []
            }
        month_region_data[key]["total"] += 1
        if c.is_overdue:
            month_region_data[key]["overdue"] += 1
        if c.escalated:
            month_region_data[key]["escalated"] += 1
        if c.processing_time > 0:
            month_region_data[key]["times"].append(c.processing_time)

    regions = sorted(list(region_set))
    series = []
    for r in regions:
        data = []
        for m in months:
            d = month_region_data.get((m, r), {"total": 0})
            data.append(d["total"])
        series.append(ReportSeries(name=r, data=data))

    raw_data = []
    for (m, r), d in month_region_data.items():
        avg = round(sum(d["times"]) / len(d["times"]), 1) if d["times"] else 0
        raw_data.append(DateReportRaw(
            month=m, region=r,
            total=d["total"], overdue=d["overdue"],
            escalated=d["escalated"], avg_time=avg
        ))

    return DateReport(months=months, series=series, rawData=raw_data)


def _calc_period_stats(items: list) -> dict:
    total = len(items)
    closed = len([c for c in items if c.status in ["resolved", "closed"]])
    overdue = len([c for c in items if c.is_overdue])
    escalated = len([c for c in items if c.escalated])
    times = [c.processing_time for c in items if c.processing_time > 0]
    avg_time = round(sum(times) / len(times), 1) if times else 0
    satisfied = len([c for c in items if c.callback_result == "satisfied"])
    cb_total = len([c for c in items if c.callback_result in ["satisfied", "unsatisfied"]])
    sat_rate = round(satisfied / cb_total * 100, 1) if cb_total > 0 else 0
    return {
        "total": total,
        "closed": closed,
        "closedRate": round(closed / total * 100, 1) if total > 0 else 0,
        "overdue": overdue,
        "overdueRate": round(overdue / total * 100, 1) if total > 0 else 0,
        "escalated": escalated,
        "avgProcessingTime": avg_time,
        "satisfactionRate": sat_rate
    }


def get_comparison_report(
    db: Session,
    region: Optional[str] = None,
    period1_start: Optional[str] = None,
    period1_end: Optional[str] = None,
    period2_start: Optional[str] = None,
    period2_end: Optional[str] = None
) -> ComparisonReport:
    now = datetime.now()
    if not period1_end:
        p1_end = now
    else:
        p1_end = datetime.fromisoformat(period1_end)
    if not period1_start:
        p1_start = p1_end - timedelta(days=30)
    else:
        p1_start = datetime.fromisoformat(period1_start)

    if not period2_end:
        p2_end = p1_start
    else:
        p2_end = datetime.fromisoformat(period2_end)
    if not period2_start:
        delta = p1_end - p1_start
        p2_start = p2_end - delta
    else:
        p2_start = datetime.fromisoformat(period2_start)

    def get_period(s, e):
        q = db.query(Complaint).filter(and_(Complaint.created_at >= s, Complaint.created_at < e))
        if region:
            q = q.filter(Complaint.region == region)
        return q.all()

    p1_items = get_period(p1_start, p1_end)
    p2_items = get_period(p2_start, p2_end)

    s1 = _calc_period_stats(p1_items)
    s2 = _calc_period_stats(p2_items)

    return ComparisonReport(
        period1=PeriodData(
            start=p1_start.strftime("%Y-%m-%d"),
            end=p1_end.strftime("%Y-%m-%d"),
            **s1
        ),
        period2=PeriodData(
            start=p2_start.strftime("%Y-%m-%d"),
            end=p2_end.strftime("%Y-%m-%d"),
            **s2
        )
    )


def get_duckdb_analysis(db: Session) -> DuckDBAnalysis:
    os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)

    items = db.query(Complaint).all()
    data = []
    for c in items:
        data.append({
            "id": c.id,
            "region": c.region,
            "category": c.category,
            "severity": c.severity,
            "status": c.status,
            "processing_time": c.processing_time or 0,
            "is_overdue": 1 if c.is_overdue else 0,
            "escalated": 1 if c.escalated else 0,
            "responsibility_dept": c.responsibility_dept or "未分类",
            "callback_result": c.callback_result,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    df = pd.DataFrame(data)

    conn = duckdb.connect(settings.DUCKDB_PATH)
    conn.execute("DROP TABLE IF EXISTS complaints")
    conn.execute("CREATE TABLE complaints AS SELECT * FROM df")

    region_summary = conn.execute("""
        SELECT
            region,
            COUNT(*) as total,
            AVG(CASE WHEN processing_time > 0 THEN processing_time END) as avg_time,
            SUM(is_overdue) as overdue_count,
            SUM(escalated) as escalated_count
        FROM complaints
        GROUP BY region
        ORDER BY total DESC
    """).fetchall()

    resp_summary = conn.execute("""
        SELECT
            responsibility_dept,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM complaints WHERE responsibility_dept IS NOT NULL AND responsibility_dept != '未分类'), 1) as percentage
        FROM complaints
        WHERE responsibility_dept IS NOT NULL AND responsibility_dept != '未分类'
        GROUP BY responsibility_dept
        ORDER BY count DESC
    """).fetchall()

    conn.close()

    region_list = [DuckDBRegionSummary(
        region=r[0], total=int(r[1]),
        avg_time=round(float(r[2] or 0), 1),
        overdue_count=int(r[3] or 0),
        escalated_count=int(r[4] or 0)
    ) for r in region_summary]

    resp_list = [DuckDBResponsibilitySummary(
        responsibility_dept=r[0],
        count=int(r[1]),
        percentage=round(float(r[2] or 0), 1)
    ) for r in resp_summary]

    return DuckDBAnalysis(regionSummary=region_list, responsibilitySummary=resp_list)
