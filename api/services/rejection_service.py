from typing import List, Optional
from datetime import date, datetime
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import RejectionRecord, RemarkTask, Patient
from api.schemas import RejectionRecordOut, RemarkTaskOut, RemarkCreate, ConclusionUpdate, RemarkTaskUpsert


def _map_rejection_status(status: Optional[str]) -> str:
    if status == "concluded":
        return "resolved"
    elif status == "remarked":
        return "processing"
    return "pending"


def _apply_status_filter(stmt, status: Optional[str]):
    if not status:
        return stmt
    if status == "pending":
        return stmt.where(RejectionRecord.status.in_(["pending", None]))
    elif status == "processing":
        return stmt.where(RejectionRecord.status == "remarked")
    elif status == "resolved":
        return stmt.where(RejectionRecord.status == "concluded")
    return stmt


def _apply_dept_filter(stmt, department: Optional[str] = None):
    if not department:
        return stmt
    return stmt.where(
        RejectionRecord.patient_id.in_(
            select(Patient.id).where(
                Patient.department_id.in_(
                    select(Department.id).where(Department.name == department)
                )
            )
        )
    )


async def get_rejection_list(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
) -> List[RejectionRecordOut]:
    from api.models import Department

    stmt = (
        select(RejectionRecord, Patient.name)
        .join(Patient, RejectionRecord.patient_id == Patient.id)
    )
    if start_date:
        stmt = stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        stmt = stmt.where(RejectionRecord.rejection_date <= end_date)
    if department:
        stmt = stmt.join(Department, Patient.department_id == Department.id).where(Department.name == department)
    stmt = _apply_status_filter(stmt, status)
    stmt = stmt.order_by(RejectionRecord.rejection_date.desc())
    result = await db.execute(stmt)
    rows = result.all()

    rej_ids = [r.id for r, _ in rows]
    task_stmt = select(RemarkTask).where(RemarkTask.rejection_id.in_(rej_ids)) if rej_ids else select(RemarkTask).where(False)
    task_rows = (await db.execute(task_stmt)).scalars().all()
    tasks_by_rej = {t.rejection_id: t for t in task_rows}

    out: List[RejectionRecordOut] = []
    for r, pname in rows:
        task = tasks_by_rej.get(r.id)
        task_out = None
        if task:
            task_out = RemarkTaskOut(
                id=task.id,
                rejection_id=task.rejection_id,
                assignee=task.assigned_to,
                content=task.content,
                status="resolved" if task.completed else ("processing" if r.status == "remarked" else "pending"),
                created_at=task.created_at,
                resolved_at=task.created_at if task.completed else None,
                completed=task.completed,
            )

        out.append(RejectionRecordOut(
            id=r.id,
            settlement_id=None,
            patient_id=r.patient_id,
            patient_name=pname,
            rejected_amount=r.amount,
            rejection_reason=r.reason,
            rejection_date=r.rejection_date,
            status=_map_rejection_status(r.status),
            remark=r.remark,
            conclusion=r.conclusion,
            remark_task=task_out,
        ))
    return out


async def get_rejection_reasons_distribution(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
) -> List[dict]:
    from api.models import Department

    rej_status_map = case(
        (RemarkTask.status == "resolved", "resolved"),
        (RemarkTask.status == "processing", "processing"),
        else_="pending",
    ).label("task_status")

    stmt = select(
        RejectionRecord.reason,
        rej_status_map,
        func.sum(RejectionRecord.amount).label("amount"),
        func.count(RejectionRecord.id).label("count"),
    ).select_from(RejectionRecord).join(Patient, RejectionRecord.patient_id == Patient.id
    ).outerjoin(RemarkTask, RemarkTask.rejection_id == RejectionRecord.id)

    if start_date:
        stmt = stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        stmt = stmt.where(RejectionRecord.rejection_date <= end_date)
    if department:
        stmt = stmt.join(Department, Patient.department_id == Department.id).where(Department.name == department)
    stmt = _apply_status_filter(stmt, status)
    stmt = stmt.group_by(RejectionRecord.reason, rej_status_map).order_by(func.sum(RejectionRecord.amount).desc())
    result = await db.execute(stmt)
    rows = result.all()

    by_reason: Dict[str, dict] = {}
    for reason, task_status, amount, count in rows:
        if reason not in by_reason:
            by_reason[reason] = {
                "name": reason,
                "value": 0.0,
                "count": 0,
                "pending_amount": 0.0,
                "processing_amount": 0.0,
                "resolved_amount": 0.0,
                "pending_count": 0,
                "processing_count": 0,
                "resolved_count": 0,
            }
        by_reason[reason]["value"] += round(float(amount), 2)
        by_reason[reason]["count"] += count
        amt_key = f"{task_status}_amount"
        cnt_key = f"{task_status}_count"
        if amt_key in by_reason[reason]:
            by_reason[reason][amt_key] += round(float(amount), 2)
            by_reason[reason][cnt_key] += count

    return list(by_reason.values())


async def add_remark(
    db: AsyncSession,
    rejection_id: int,
    data: RemarkCreate,
) -> Optional[RejectionRecordOut]:
    stmt = select(RejectionRecord).where(RejectionRecord.id == rejection_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        return None
    record.remark = data.remark
    record.status = "remarked"

    p_stmt = select(Patient.name).where(Patient.id == record.patient_id)
    p_name = (await db.execute(p_stmt)).scalar_one_or_none() or ""

    existing_task_stmt = select(RemarkTask).where(RemarkTask.rejection_id == rejection_id)
    existing_task = (await db.execute(existing_task_stmt)).scalar_one_or_none()
    if not existing_task:
        task = RemarkTask(
            rejection_id=rejection_id,
            assigned_to=data.assignee,
            content=data.remark,
            status="processing",
        )
        db.add(task)
    else:
        existing_task.assigned_to = data.assignee or existing_task.assigned_to
        existing_task.content = data.remark or existing_task.content
        existing_task.status = "processing"

    await db.commit()
    await db.refresh(record)

    task_out = None
    task_stmt = select(RemarkTask).where(RemarkTask.rejection_id == rejection_id)
    task = (await db.execute(task_stmt)).scalar_one_or_none()
    if task:
        task_out = RemarkTaskOut(
            id=task.id,
            rejection_id=task.rejection_id,
            assignee=task.assigned_to,
            content=task.content,
            status="processing",
            created_at=task.created_at,
            completed=task.completed,
        )

    return RejectionRecordOut(
        id=record.id,
        settlement_id=None,
        patient_id=record.patient_id,
        patient_name=p_name,
        rejected_amount=record.amount,
        rejection_reason=record.reason,
        rejection_date=record.rejection_date,
        status="processing",
        remark=record.remark,
        conclusion=record.conclusion,
        remark_task=task_out,
    )


async def update_conclusion(
    db: AsyncSession,
    rejection_id: int,
    data: ConclusionUpdate,
) -> Optional[RejectionRecordOut]:
    stmt = select(RejectionRecord).where(RejectionRecord.id == rejection_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        return None
    record.conclusion = data.conclusion
    record.status = "concluded"

    p_stmt = select(Patient.name).where(Patient.id == record.patient_id)
    p_name = (await db.execute(p_stmt)).scalar_one_or_none() or ""

    existing_task_stmt = select(RemarkTask).where(RemarkTask.rejection_id == rejection_id)
    existing_task = (await db.execute(existing_task_stmt)).scalar_one_or_none()
    now = datetime.now()
    if existing_task:
        existing_task.completed = True
        existing_task.status = "resolved"
        existing_task.resolved_at = now
    else:
        db.add(RemarkTask(
            rejection_id=rejection_id,
            content=data.conclusion,
            completed=True,
            status="resolved",
            created_at=now,
            resolved_at=now,
        ))

    await db.commit()
    await db.refresh(record)

    task_out = None
    task_stmt = select(RemarkTask).where(RemarkTask.rejection_id == rejection_id)
    task = (await db.execute(task_stmt)).scalar_one_or_none()
    if task:
        task_out = RemarkTaskOut(
            id=task.id,
            rejection_id=task.rejection_id,
            assignee=task.assigned_to,
            content=task.content,
            status="resolved",
            created_at=task.created_at,
            resolved_at=now,
            completed=True,
        )

    return RejectionRecordOut(
        id=record.id,
        settlement_id=None,
        patient_id=record.patient_id,
        patient_name=p_name,
        rejected_amount=record.amount,
        rejection_reason=record.reason,
        rejection_date=record.rejection_date,
        status="resolved",
        remark=record.remark,
        conclusion=record.conclusion,
        remark_task=task_out,
    )


async def upsert_remark_task(
    db: AsyncSession,
    data: RemarkTaskUpsert,
) -> Optional[RemarkTaskOut]:
    stmt = select(RemarkTask).where(RemarkTask.rejection_id == data.rejection_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    now = datetime.now()

    status = data.status or ("pending" if not existing else existing.status)
    is_resolved = status == "resolved"

    if not existing:
        task = RemarkTask(
            rejection_id=data.rejection_id,
            assigned_to=data.assignee,
            content=data.content,
            status=status,
            completed=is_resolved,
            resolved_at=now if is_resolved else None,
        )
        db.add(task)
    else:
        if data.assignee is not None:
            existing.assigned_to = data.assignee
        if data.content is not None:
            existing.content = data.content
        existing.status = status
        existing.completed = is_resolved
        if is_resolved:
            existing.resolved_at = now

    rej_stmt = select(RejectionRecord).where(RejectionRecord.id == data.rejection_id)
    rej = (await db.execute(rej_stmt)).scalar_one_or_none()
    if rej:
        if is_resolved:
            rej.status = "concluded"
            if data.content and not rej.conclusion:
                rej.conclusion = data.content
        elif status == "processing":
            rej.status = "remarked"
            if data.content and not rej.remark:
                rej.remark = data.content

    await db.commit()

    stmt = select(RemarkTask).where(RemarkTask.rejection_id == data.rejection_id)
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        return None

    return RemarkTaskOut(
        id=task.id,
        rejection_id=task.rejection_id,
        assignee=task.assigned_to,
        content=task.content,
        status=task.status,
        created_at=task.created_at,
        resolved_at=task.resolved_at,
        completed=task.completed,
    )
