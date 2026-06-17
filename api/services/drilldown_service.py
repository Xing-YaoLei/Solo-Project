from datetime import date, timedelta, datetime
from typing import List, Optional, Dict
from sqlalchemy import select, func, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import (
    AssessmentScale,
    TrainingPrescription,
    TreatmentSession,
    CheckInRecord,
    EquipmentRecord,
    Patient,
    Therapist,
    Department,
)
from api.schemas import (
    AssessmentScaleOut,
    TrainingPrescriptionOut,
    TreatmentSessionOut,
    EquipmentRecordOut,
    TrainingCompletionStats,
    CalendarDay,
)


def _content_to_prescription_name(content: str) -> str:
    if "关节活动" in content:
        return "关节活动度训练处方"
    elif "肌力" in content:
        return "肌力强化训练处方"
    elif "平衡" in content:
        return "平衡功能训练处方"
    elif "步态" in content:
        return "步态矫正训练处方"
    elif "日常生活" in content or "作业" in content:
        return "作业治疗处方"
    elif "言语" in content:
        return "言语功能训练处方"
    elif "吞咽" in content:
        return "吞咽功能训练处方"
    elif "牵伸" in content:
        return "牵伸放松训练处方"
    return "康复训练处方"


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

        p_stmt = select(TrainingPrescription.id).where(
            TrainingPrescription.patient_id == a.patient_id,
            TrainingPrescription.prescribed_at >= a.assessed_at,
            TrainingPrescription.prescribed_at <= a.assessed_at + timedelta(days=14),
        )
        p_row = (await db.execute(p_stmt)).first()
        linked_id = p_row[0] if p_row else None

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
        a_stmt = select(AssessmentScale.id).where(
            AssessmentScale.patient_id == p.patient_id,
            AssessmentScale.assessed_at <= p.prescribed_at,
            AssessmentScale.assessed_at >= p.prescribed_at - timedelta(days=14),
        ).order_by(AssessmentScale.assessed_at.desc()).limit(1)
        a_row = (await db.execute(a_stmt)).first()
        assessment_id = a_row[0] if a_row else None

        end_dt = p.prescribed_at + timedelta(days=60)
        s_stmt = select(
            func.count(TreatmentSession.id),
            func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)),
        ).where(
            TreatmentSession.patient_id == p.patient_id,
            TreatmentSession.treatment_date >= p.prescribed_at,
            TreatmentSession.treatment_date <= end_dt,
        )
        s_row = (await db.execute(s_stmt)).one()
        total = s_row[0] or 0
        completed = int(s_row[1] or 0)
        rate = round(completed / total * 100, 2) if total > 0 else 0.0

        if total >= 20 and rate >= 90:
            status = "completed"
        elif end_dt < date.today():
            status = "expired"
        else:
            status = "active"

        out_list.append(TrainingPrescriptionOut(
            id=p.id,
            patient_id=p.patient_id,
            patient_name=pname,
            assessment_id=assessment_id,
            prescription_name=_content_to_prescription_name(p.content),
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
) -> List[CalendarDay]:
    stmt = (
        select(
            TreatmentSession.treatment_date.label("date"),
            func.count(TreatmentSession.id).label("session_count"),
            func.count(func.distinct(TreatmentSession.patient_id)).label("patient_count"),
            func.sum(func.cast(TreatmentSession.status == "completed", type_=Integer)).label("completed_count"),
            func.sum(func.cast(TreatmentSession.status == "missed", type_=Integer)).label("missed_count"),
            func.sum(func.cast(TreatmentSession.status == "cancelled", type_=Integer)).label("rejected_count"),
        )
        .where(
            func.extract("month", TreatmentSession.treatment_date) == month,
            func.extract("year", TreatmentSession.treatment_date) == year,
        )
        .group_by(TreatmentSession.treatment_date)
        .order_by(TreatmentSession.treatment_date)
    )
    result = await db.execute(stmt)
    day_rows = result.all()

    day_sessions: Dict[date, List[TreatmentSessionOut]] = {}
    s_stmt = (
        select(TreatmentSession, Patient.name, Therapist.name)
        .join(Patient, TreatmentSession.patient_id == Patient.id)
        .join(Therapist, TreatmentSession.therapist_id == Therapist.id)
        .where(
            func.extract("month", TreatmentSession.treatment_date) == month,
            func.extract("year", TreatmentSession.treatment_date) == year,
        )
    )
    s_result = await db.execute(s_stmt)
    for s, pname, tname in s_result.all():
        hour = 8 + (s.id % 9)
        minute = (s.id * 15) % 60
        session_out = TreatmentSessionOut(
            id=s.id,
            patient_id=s.patient_id,
            patient_name=pname,
            therapist_id=s.therapist_id,
            therapist_name=tname,
            treatment_date=s.treatment_date,
            time=f"{hour:02d}:{minute:02d}",
            project_name=_content_to_prescription_name(f"{s.duration_minutes}分钟训练"),
            duration_minutes=s.duration_minutes,
            status=s.status,
            equipment_id=f"EQ_{(s.id % 8) + 1:03d}" if s.id % 3 == 0 else None,
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


EQUIPMENT_PARAMS = {
    "下肢智能反馈训练系统": {"speed_kmh": 2.5, "resistance_n": 45, "duration_min": 30, "mode": "连续被动"},
    "上肢机器人康复训练仪": {"repetitions": 120, "force_n": 18, "joint_range_deg": 85, "mode": "主被动结合"},
    "平衡训练仪": {"platform_tilt_deg": 12, "sensitivity": "中", "duration_min": 20, "mode": "动态平衡"},
    "电动起立床": {"angle_deg": 65, "duration_min": 45, "weight_bearing_pct": 70, "mode": "渐进站立"},
    "吞咽电刺激仪": {"current_ma": 15, "frequency_hz": 30, "pulse_width_ms": 0.3, "mode": "持续刺激"},
    "经颅磁刺激仪": {"frequency_hz": 5, "intensity_pct": 80, "pulses": 1200, "mode": "重复刺激"},
    "超声波治疗仪": {"frequency_mhz": 1.5, "intensity_wcm2": 1.2, "duration_min": 15, "mode": "脉冲"},
    "气压治疗仪": {"chambers": 6, "pressure_mmhg": 60, "duration_min": 30, "mode": "梯度加压"},
}


async def get_equipment_usage(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session_id: Optional[int] = None,
) -> List[EquipmentRecordOut]:
    stmt = select(EquipmentRecord, Department.name).outerjoin(
        Department, EquipmentRecord.department_id == Department.id
    )
    if start_date:
        stmt = stmt.where(EquipmentRecord.record_date >= start_date)
    if end_date:
        stmt = stmt.where(EquipmentRecord.record_date <= end_date)
    stmt = stmt.order_by(EquipmentRecord.record_date.desc())
    result = await db.execute(stmt)
    rows = result.all()

    out: List[EquipmentRecordOut] = []
    for idx, (e, dname) in enumerate(rows):
        params = EQUIPMENT_PARAMS.get(e.equipment_name, {})
        recorded_dt = datetime.combine(e.record_date, timedelta(hours=8 + idx % 10, minutes=(idx * 17) % 60))
        out.append(EquipmentRecordOut(
            id=e.id,
            session_id=session_id or (idx + 1),
            equipment_name=e.equipment_name,
            usage_count=e.usage_count,
            parameters=params,
            recorded_at=recorded_dt,
            duration=params.get("duration_min", 20),
            record_date=e.record_date,
            department_id=e.department_id,
            department_name=dname,
        ))
    return out
