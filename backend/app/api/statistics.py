from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models import CleaningRecord, Person
from app import schemas

router = APIRouter()


@router.get("/summary", response_model=schemas.StatisticsSummary)
def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleaningRecord)
    if start_date:
        query = query.filter(CleaningRecord.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(CleaningRecord.created_at <= datetime.fromisoformat(end_date))

    total = query.count()
    completed = query.filter(CleaningRecord.status == schemas.CleaningStatus.COMPLETED).count()
    reviewing = query.filter(CleaningRecord.status == schemas.CleaningStatus.REVIEWING).count()
    supplement = query.filter(CleaningRecord.status == schemas.CleaningStatus.SUPPLEMENT_INFO).count()
    closed = query.filter(CleaningRecord.status == schemas.CleaningStatus.CLOSED).count()

    avg_rate_result = query.filter(
        CleaningRecord.qualified_rate.isnot(None)
    ).with_entities(func.avg(CleaningRecord.qualified_rate)).scalar()
    avg_rate = round(float(avg_rate_result or 0), 2)

    return schemas.StatisticsSummary(
        total_records=total,
        completed_count=completed,
        reviewing_count=reviewing,
        supplement_count=supplement,
        closed_count=closed,
        avg_qualified_rate=avg_rate,
    )


@router.get("/by-channel", response_model=List[schemas.StatisticsByChannel])
def get_by_channel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleaningRecord)
    if start_date:
        query = query.filter(CleaningRecord.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(CleaningRecord.created_at <= datetime.fromisoformat(end_date))

    results = query.with_entities(
        CleaningRecord.source_channel,
        func.count(CleaningRecord.id),
        func.avg(case((CleaningRecord.qualified_rate.isnot(None), CleaningRecord.qualified_rate), else_=0))
    ).group_by(CleaningRecord.source_channel).all()

    return [
        schemas.StatisticsByChannel(
            channel=r[0].value if r[0] else "unknown",
            count=r[1],
            qualified_rate=round(float(r[2] or 0), 2)
        )
        for r in results
    ]


@router.get("/by-person", response_model=List[schemas.StatisticsByPerson])
def get_by_person(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleaningRecord)
    if start_date:
        query = query.filter(CleaningRecord.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(CleaningRecord.created_at <= datetime.fromisoformat(end_date))

    results = query.filter(
        CleaningRecord.cleaning_person_id.isnot(None)
    ).with_entities(
        CleaningRecord.cleaning_person_id,
        func.count(CleaningRecord.id),
        func.sum(case((CleaningRecord.status == schemas.CleaningStatus.COMPLETED, 1), else_=0)),
        func.sum(case((CleaningRecord.status == schemas.CleaningStatus.CLOSED, 1), else_=0)),
        func.avg(case((CleaningRecord.qualified_rate.isnot(None), CleaningRecord.qualified_rate), else_=0))
    ).group_by(CleaningRecord.cleaning_person_id).all()

    person_ids = [r[0] for r in results]
    persons = {p.id: p.name for p in db.query(Person).filter(Person.id.in_(person_ids)).all()}

    return [
        schemas.StatisticsByPerson(
            person_id=r[0],
            person_name=persons.get(r[0], "未知"),
            total=r[1],
            completed=r[2] + r[3],
            qualified_rate=round(float(r[4] or 0), 2)
        )
        for r in results
    ]


@router.get("/by-close-reason", response_model=List[schemas.StatisticsByCloseReason])
def get_by_close_reason(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleaningRecord).filter(CleaningRecord.status == schemas.CleaningStatus.CLOSED)
    if start_date:
        query = query.filter(CleaningRecord.closed_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(CleaningRecord.closed_at <= datetime.fromisoformat(end_date))

    results = query.with_entities(
        CleaningRecord.close_reason,
        func.count(CleaningRecord.id)
    ).group_by(CleaningRecord.close_reason).all()

    return [
        schemas.StatisticsByCloseReason(
            reason=r[0].value if r[0] else "unknown",
            count=r[1]
        )
        for r in results
    ]
