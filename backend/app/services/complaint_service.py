import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.complaint import Complaint
from app.models.timeout_alert import TimeoutAlert


async def get_complaints(
    db: AsyncSession,
    status: Optional[str] = None,
    source_channel: Optional[str] = None,
    handler_id: Optional[uuid.UUID] = None,
    priority: Optional[str] = None,
    offset: int = 0,
    limit: int = 20,
):
    query = select(Complaint)
    if status:
        query = query.where(Complaint.status == status)
    if source_channel:
        query = query.where(Complaint.source_channel == source_channel)
    if handler_id:
        query = query.where(Complaint.handler_id == handler_id)
    if priority:
        query = query.where(Complaint.priority == priority)

    query = query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_complaint_detail(db: AsyncSession, complaint_id: uuid.UUID):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    return result.scalar_one_or_none()


async def create_complaint(db: AsyncSession, data: dict):
    complaint = Complaint(**data)
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)
    return complaint


async def update_complaint_status(
    db: AsyncSession, complaint_id: uuid.UUID, status: str
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        return None

    complaint.status = status
    if status == "closed":
        complaint.closed_at = datetime.now()

    await db.commit()
    await db.refresh(complaint)
    return complaint


async def check_timeout(db: AsyncSession):
    timeout_hours = settings.COMPLAINT_TIMEOUT_HOURS
    threshold = datetime.now() - timedelta(hours=timeout_hours)

    result = await db.execute(
        select(Complaint).where(
            Complaint.status.in_(["pending", "processing"]),
            Complaint.created_at < threshold,
        )
    )
    complaints = result.scalars().all()

    alerts = []
    for complaint in complaints:
        elapsed = (datetime.now() - complaint.created_at).total_seconds() / 3600
        alert = TimeoutAlert(
            complaint_id=complaint.id,
            timeout_hours=int(elapsed),
            triggered_at=datetime.now(),
        )
        db.add(alert)
        alerts.append(alert)

    await db.commit()
    return alerts
