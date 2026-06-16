from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.models import (
    BatchItem,
    Exception,
    MemberProfile,
    Prescription,
    TimelineEvent,
)
from api.schemas import (
    BatchItemCreate,
    MarkExceptionRequest,
    PrescriptionCreate,
    PrescriptionListParams,
    PrescriptionUpdate,
)


async def create_prescription(db: AsyncSession, data: PrescriptionCreate, user_id: str) -> Prescription:
    rx = Prescription(
        store_id=data.store_id,
        member_id=data.member_id,
        rx_number=data.rx_number,
        priority=data.priority,
        diagnosis=data.diagnosis,
        total_amount=data.total_amount,
    )
    db.add(rx)
    await db.flush()

    for item_data in data.batch_items:
        subtotal = item_data.quantity * item_data.unit_price
        item = BatchItem(
            prescription_id=rx.id,
            drug_name=item_data.drug_name,
            drug_code=item_data.drug_code,
            specification=item_data.specification,
            quantity=item_data.quantity,
            unit=item_data.unit,
            dosage=item_data.dosage,
            frequency=item_data.frequency,
            duration_days=item_data.duration_days,
            unit_price=item_data.unit_price,
            subtotal=subtotal,
            notes=item_data.notes,
        )
        db.add(item)

    event = TimelineEvent(
        prescription_id=rx.id,
        event_type="created",
        to_status="pending",
        description="处方创建",
        performed_by=user_id,
    )
    db.add(event)
    await db.flush()
    return rx


async def get_prescription(db: AsyncSession, rx_id: str) -> Prescription | None:
    result = await db.execute(
        select(Prescription)
        .options(
            selectinload(Prescription.member),
            selectinload(Prescription.batch_items),
            selectinload(Prescription.replenishments),
            selectinload(Prescription.insurance_records),
            selectinload(Prescription.photos),
            selectinload(Prescription.timeline_events),
            selectinload(Prescription.exceptions),
            selectinload(Prescription.caliber_notes),
        )
        .where(Prescription.id == rx_id)
    )
    return result.scalar_one_or_none()


async def list_prescriptions(db: AsyncSession, params: PrescriptionListParams) -> tuple[list[Prescription], int]:
    query = select(Prescription)
    count_query = select(func.count()).select_from(Prescription)

    if params.status:
        query = query.where(Prescription.status == params.status)
        count_query = count_query.where(Prescription.status == params.status)
    if params.store_id:
        query = query.where(Prescription.store_id == params.store_id)
        count_query = count_query.where(Prescription.store_id == params.store_id)
    if params.priority:
        query = query.where(Prescription.priority == params.priority)
        count_query = count_query.where(Prescription.priority == params.priority)
    if params.search:
        search_filter = Prescription.rx_number.ilike(f"%{params.search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (params.page - 1) * params.page_size
    query = query.order_by(Prescription.created_at.desc()).offset(offset).limit(params.page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_prescription_status(
    db: AsyncSession, rx: Prescription, new_status: str, user_id: str
) -> Prescription:
    old_status = rx.status
    rx.status = new_status
    rx.updated_at = datetime.utcnow()

    if new_status in ("approved", "rejected"):
        rx.reviewer_id = user_id
        rx.reviewed_at = datetime.utcnow()

    event = TimelineEvent(
        prescription_id=rx.id,
        event_type="status_change",
        from_status=old_status,
        to_status=new_status,
        description=f"状态变更: {old_status} -> {new_status}",
        performed_by=user_id,
    )
    db.add(event)
    await db.flush()
    return rx


async def mark_exception(
    db: AsyncSession, rx: Prescription, data: MarkExceptionRequest, user_id: str
) -> tuple[Prescription, Exception]:
    old_status = rx.status
    rx.status = "exception"
    rx.updated_at = datetime.utcnow()

    exc = Exception(
        prescription_id=rx.id,
        exception_type=data.exception_type,
        severity=data.severity,
        impact_scope=data.impact_scope,
        description=data.description,
        assignee_id=data.assignee_id,
    )
    db.add(exc)

    event = TimelineEvent(
        prescription_id=rx.id,
        event_type="exception",
        from_status=old_status,
        to_status="exception",
        description=f"标记异常: {data.exception_type} - {data.description or ''}",
        performed_by=user_id,
    )
    db.add(event)
    await db.flush()
    return rx, exc


async def batch_update_status(
    db: AsyncSession, prescription_ids: list[str], new_status: str, user_id: str
) -> list[Prescription]:
    result = await db.execute(
        select(Prescription).where(Prescription.id.in_(prescription_ids))
    )
    prescriptions = list(result.scalars().all())
    updated = []
    for rx in prescriptions:
        if new_status in ("approved", "rejected"):
            rx.reviewer_id = user_id
            rx.reviewed_at = datetime.utcnow()
        old_status = rx.status
        rx.status = new_status
        rx.updated_at = datetime.utcnow()
        event = TimelineEvent(
            prescription_id=rx.id,
            event_type="batch_status_change",
            from_status=old_status,
            to_status=new_status,
            description=f"批量状态变更: {old_status} -> {new_status}",
            performed_by=user_id,
        )
        db.add(event)
        updated.append(rx)
    await db.flush()
    return updated
