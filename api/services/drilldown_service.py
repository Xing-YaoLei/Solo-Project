from datetime import date, timedelta
import json
from typing import List, Optional, Dict
from sqlalchemy import select, func, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.models import (
    AssessmentScale,
    TrainingPrescription,
    TreatmentSession,
    EquipmentRecord,
    Patient,
    Therapist,
    Department,
)
from api.schemas import (
    AssessmentScaleOut,
    TrainingPrescriptionOut,
    TreatmentSessionOut,
    EquipmentRecordBriefOut,
    EquipmentRecordOut,
    TrainingCompletionStats,
    CalendarDay,
)


async def get_assessments(
    db: AsyncSession,
    patient_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[AssessmentScaleOut]:
    stmt = (
        select(AssessmentScale, Patient.name)
        .join(Patient, AssessmentScale.patient_id == Patient.id)
    )
    if patient_id:
        stmt = stmt.where(AssessmentScale.patient_id == patient_id)
    if start_date:
        stmt = stmt.where(AssessmentScale.assessed_at >= start_date)
    if end_date:
        stmt = stmt.where(AssessmentScale.assessed_at <= end_date)
    stmt = stmt.order_by(AssessmentScale.assessed_at.desc())
    result = await db.execute(stmt)
    rows = result.all()

    patient_assessments: Dict[int, List] = {}
    for a, pname in rows:
        patient_assessments.setdefault(a.patient_id, []).append(a)

    out_list: List[AssessmentScaleOut] = []
    for a, pname in rows:
        prev_score = None
        p_list = patient_assessments.get(a.patient_id, [])
        sorted_list = sorted(p_list, key=lambda x: x.assessed_at)
        idx = next((i for i, x in enumerate(sorted_list) if x.id == a.id), None)
        if idx and idx > 0:
            prev_score = sorted_list[idx - 1].score

        linked_id = a.linked_prescription_id
        out_list.append(AssessmentScaleOut(
            id=a.id,
            patient_id=a.patient_id,
            patient_name=pname,
            scale_name=a.scale_name,
            score=a.score,
            previous_score=prev_score,
            assessed_at=a.assessed_at,
            has_linked_prescription=linked_id is not None,
            linked_prescription_id=linked_id,
        ))
    return out_list


async def get_prescriptions(
    db: AsyncSession,
    patient_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[TrainingPrescriptionOut]:
    stmt = (
        select(TrainingPrescription, Patient.name)
        .join(Patient, TrainingPrescription.patient_id == Patient.id)
    )
    if patient_id:
        stmt = stmt.where(TrainingPrescription.patient_id == patient_id)
    if start_date:
        stmt = stmt.where(TrainingPrescription.prescribed_at >= start_date)
    if end_date:
        stmt = stmt.where(TrainingPrescription.prescribed_at <= end_date)
    stmt = stmt.order_by(TrainingPrescription.prescribed_at.desc())
    result = await db.execute(stmt)
    rows = result.all()

    out_list: List[TrainingPrescriptionOut] = []
    for p, pname in rows:
        assessment_id = p.assessment_id

        s_stmt = select(
            func.count(TreatmentSession.id),
            func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)),
        ).where(
            TreatmentSession.prescription_id == p.id,
        )
        s_row = (await db.execute(s_stmt)).one()
        total = s_row[0] or 0
        completed = int(s_row[1] or 0)
        rate = round(completed / total * 100, 2) if total > 0 else 0.0

        end_dt = p.prescribed_at + timedelta(days=60)
        if total >= 20 and rate >= 90:
            status = "completed"
        elif end_dt < date.today():
            status = "expired"
        else:
            status = "active"

        project_stmt = select(TreatmentSession.project_name).where(
            TreatmentSession.prescription_id == p.id,
            TreatmentSession.project_name.isnot(None),
        ).limit(1)
        project_row = (await db.execute(project_stmt)).first()
        prescription_name = project_row[0] if project_row else p.content[:20]

        out_list.append(TrainingPrescriptionOut(
            id=p.id,
            patient_id=p.patient_id,
            patient_name=pname,
            assessment_id=assessment_id,
            prescription_name=prescription_name,
            content=p.content,
            frequency=p.frequency,
            total_sessions=total,
            completed_sessions=completed,
            completion_rate=rate,
            prescribed_at=p.prescribed_at,
            start_date=p.prescribed_at,
            end_date=end_dt,
            status=status,
        ))
    return out_list


async def get_training_completion(
    db: AsyncSession,
    department_id: Optional[int] = None,
    therapist_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[TrainingCompletionStats]:
    stmt = (
        select(
            Department.name.label("department"),
            Therapist.name.label("therapist"),
            func.count(TreatmentSession.id).label("total_sessions"),
            func.sum(
                func.cast(TreatmentSession.status == "completed", type_=Integer)
            ).label("completed_sessions"),
        )
        .join(Therapist, TreatmentSession.therapist_id == Therapist.id)
        .join(Department, Therapist.department_id == Department.id)
        .group_by(Department.name, Therapist.name)
    )

    if department_id:
        stmt = stmt.where(Therapist.department_id == department_id)
    if therapist_id:
        stmt = stmt.where(TreatmentSession.therapist_id == therapist_id)
    if start_date:
        stmt = stmt.where(TreatmentSession.treatment_date >= start_date)
    if end_date:
        stmt = stmt.where(TreatmentSession.treatment_date <= end_date)

    result = await db.execute(stmt)
    rows = result.all()

    stats = []
    for r in rows:
        total = r.total_sessions or 0
        completed = int(r.completed_sessions or 0)
        rate = round(completed / total * 100, 2) if total else 0.0
        stats.append(
            TrainingCompletionStats(
                department=r.department,
                therapist=r.therapist,
                total_sessions=total,
                completed_sessions=completed,
                completion_rate=rate,
            )
        )
    return stats


async def get_calendar(
    db: AsyncSession,
    month: int,
    year: int,
    patient_id: Optional[int] = None,
    prescription_id: Optional[int] = None,
) -> List[CalendarDay]:
    where_clauses = [
        func.extract("month", TreatmentSession.treatment_date) == month,
        func.extract("year", TreatmentSession.treatment_date) == year,
    ]
    if patient_id:
        where_clauses.append(TreatmentSession.patient_id == patient_id)
    if prescription_id:
        where_clauses.append(TreatmentSession.prescription_id == prescription_id)

    stmt = (
        select(
            TreatmentSession.treatment_date.label("date"),
            func.count(TreatmentSession.id).label("session_count"),
            func.count(func.distinct(TreatmentSession.patient_id)).label("patient_count"),
            func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)).label("completed_count"),
            func.sum(func.cast(TreatmentSession.status == "missed", type_=Integer)).label("missed_count"),
            func.sum(func.cast(TreatmentSession.status == "cancelled", type_=Integer)).label("rejected_count"),
        )
        .where(*where_clauses)
        .group_by(TreatmentSession.treatment_date)
        .order_by(TreatmentSession.treatment_date)
    )
    result = await db.execute(stmt)
    day_rows = result.all()

    day_sessions: Dict[date, List[TreatmentSessionOut]] = {}
    s_stmt = (
        select(TreatmentSession, Patient.name, Therapist.name)
        .options(
            selectinload(TreatmentSession.equipment_records),
            selectinload(TreatmentSession.check_ins),
        )
        .join(Patient, TreatmentSession.patient_id == Patient.id)
        .join(Therapist, TreatmentSession.therapist_id == Therapist.id)
        .where(*where_clauses)
        .order_by(TreatmentSession.treatment_date, TreatmentSession.id)
    )
    s_result = await db.execute(s_stmt)
    for s, pname, tname in s_result.unique().all():
        equip_briefs: List[EquipmentRecordBriefOut] = []
        for er in s.equipment_records:
            params = None
            if er.parameters:
                try:
                    params = json.loads(er.parameters)
                except (json.JSONDecodeError, TypeError):
                    params = None
            equip_briefs.append(EquipmentRecordBriefOut(
                id=er.id,
                equipment_name=er.equipment_name,
                parameters=params,
                duration=er.duration,
                record_date=er.record_date,
            ))

        time_str = None
        if s.check_ins:
            time_str = s.check_ins[0].check_in_time
        if not time_str:
            hour = 8 + (s.id % 9)
            minute = (s.id * 15) % 60
            time_str = f"{hour:02d}:{minute:02d}"

        session_out = TreatmentSessionOut(
            id=s.id,
            patient_id=s.patient_id,
            patient_name=pname,
            therapist_id=s.therapist_id,
            therapist_name=tname,
            prescription_id=s.prescription_id,
            treatment_date=s.treatment_date,
            time=time_str,
            project_name=s.project_name,
            duration_minutes=s.duration_minutes,
            status=s.status,
            equipment_records=equip_briefs,
        )
        day_sessions.setdefault(s.treatment_date, []).append(session_out)

    out: List[CalendarDay] = []
    for r in day_rows:
        completed = int(r.completed_count or 0)
        missed = int(r.missed_count or 0)
        rejected = int(r.rejected_count or 0)
        out.append(CalendarDay(
            date=r.date,
            session_count=r.session_count,
            patient_count=r.patient_count,
            scheduled_count=r.session_count,
            completed_count=completed,
            missed_count=missed,
            rejected_count=rejected,
            details=day_sessions.get(r.date, []),
        ))
    return out


async def get_equipment_usage(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session_id: Optional[int] = None,
) -> List[EquipmentRecordOut]:
    stmt = (
        select(EquipmentRecord, TreatmentSession, Patient.name, Therapist.name, Department.name)
        .outerjoin(TreatmentSession, EquipmentRecord.session_id == TreatmentSession.id)
        .outerjoin(Patient, TreatmentSession.patient_id == Patient.id)
        .outerjoin(Therapist, TreatmentSession.therapist_id == Therapist.id)
        .outerjoin(Department, EquipmentRecord.department_id == Department.id)
    )
    if start_date:
        stmt = stmt.where(EquipmentRecord.record_date >= start_date)
    if end_date:
        stmt = stmt.where(EquipmentRecord.record_date <= end_date)
    if session_id:
        stmt = stmt.where(EquipmentRecord.session_id == session_id)
    stmt = stmt.order_by(EquipmentRecord.record_date.desc())
    result = await db.execute(stmt)
    rows = result.all()

    out: List[EquipmentRecordOut] = []
    for e, session, pname, tname, dname in rows:
        params = None
        if e.parameters:
            try:
                params = json.loads(e.parameters)
            except (json.JSONDecodeError, TypeError):
                params = None
        out.append(EquipmentRecordOut(
            id=e.id,
            session_id=e.session_id,
            equipment_name=e.equipment_name,
            parameters=params,
            duration=e.duration,
            record_date=e.record_date,
            department_id=e.department_id,
            department_name=dname,
            patient_name=pname,
            therapist_name=tname,
            treatment_date=session.treatment_date if session else None,
            project_name=session.project_name if session else None,
        ))
    return out
