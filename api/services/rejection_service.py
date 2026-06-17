from typing import List, Optional
from datetime import date, datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import RejectionRecord, RemarkTask, Patient
from api.schemas import RejectionRecordOut, RemarkTaskOut, RemarkCreate, ConclusionUpdate


def _map_rejection_status(status: Optional[str]) -> str:
    if status == "concluded":
        return "resolved"
    elif status == "remarked":
        return "processing"
    return "pending"


async def get_rejection_list(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
) -> List[RejectionRecordOut]:
    stmt = (
        select(RejectionRecord, Patient.name)
        .join(Patient, RejectionRecord.patient_id == Patient.id)
    )
    if start_date:
        stmt = stmt.where(RejectionRecord.rejection_date >= start_date)
    if end_date:
        stmt = stmt.where(RejectionRecord.rejection_date <= end_date)
    if status:
        if status == "pending":
            stmt = stmt.where(RejectionRecord.status.in_(["pending", None]))
        elif status == "processing":
            stmt = stmt.where(RejectionRecord.status == "remarked")
        elif status == "resolved":
            stmt = stmt.where(RejectionRecord.status == "concluded")
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
            resolved_at = task.created_at if task.completed else None
            task_out = RemarkTaskOut(
                id=task.id,
                rejection_id=task.rejection_id,
                assignee=task.assigned_to,
                content=task.content,
                status="resolved" if task.completed else ("processing" if r.status == "remarked" else "pending"),
                created_at=task.created_at,
                resolved_at=resolved_at,
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
        )
        db.add(task)
    else:
        existing_task.assigned_to = data.assignee or existing_task.assigned_to
        existing_task.content = data.remark or existing_task.content

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
    else:
        db.add(RemarkTask(
            rejection_id=rejection_id,
            content=data.conclusion,
            completed=True,
            created_at=now,
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
