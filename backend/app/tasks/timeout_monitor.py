import asyncio
from datetime import datetime, timedelta

from celery import shared_task

from app.config import settings
from app.database import async_session
from app.models.complaint import Complaint
from app.models.timeout_alert import TimeoutAlert
from app.services.complaint_service import check_timeout

from sqlalchemy import select


@shared_task
def check_complaint_timeouts():
    async def _check():
        async with async_session() as db:
            timeout_hours = settings.COMPLAINT_TIMEOUT_HOURS
            threshold = datetime.now() - timedelta(hours=timeout_hours)

            result = await db.execute(
                select(Complaint).where(
                    Complaint.status.in_(["pending", "processing"]),
                    Complaint.created_at < threshold,
                )
            )
            complaints = result.scalars().all()

            for complaint in complaints:
                existing = await db.execute(
                    select(TimeoutAlert).where(
                        TimeoutAlert.complaint_id == complaint.id,
                        TimeoutAlert.is_resolved == False,
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                elapsed = (datetime.now() - complaint.created_at).total_seconds() / 3600
                alert = TimeoutAlert(
                    complaint_id=complaint.id,
                    timeout_hours=int(elapsed),
                    triggered_at=datetime.now(),
                )
                db.add(alert)

            await db.commit()

    asyncio.run(_check())


@shared_task
def check_missing_materials():
    async def _check():
        async with async_session() as db:
            threshold = datetime.now() - timedelta(hours=24)

            result = await db.execute(
                select(Complaint).where(
                    Complaint.status == "missing_materials",
                    Complaint.updated_at < threshold,
                )
            )
            complaints = result.scalars().all()

            for complaint in complaints:
                existing = await db.execute(
                    select(TimeoutAlert).where(
                        TimeoutAlert.complaint_id == complaint.id,
                        TimeoutAlert.is_resolved == False,
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                alert = TimeoutAlert(
                    complaint_id=complaint.id,
                    timeout_hours=24,
                    triggered_at=datetime.now(),
                )
                db.add(alert)

            await db.commit()

    asyncio.run(_check())
