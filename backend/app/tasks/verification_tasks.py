import logging
from datetime import datetime, timedelta

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import SYNC_DATABASE_URL
from app.models.verification import VerificationTicket, VerificationAction
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

TIMEOUT_HOURS = 24


@celery_app.task(name="app.tasks.verification_tasks.check_timeout_verifications")
def check_timeout_verifications() -> dict:
    engine = create_engine(SYNC_DATABASE_URL)
    threshold = datetime.utcnow() - timedelta(hours=TIMEOUT_HOURS)

    with Session(engine) as session:
        result = session.execute(
            select(VerificationTicket).where(
                VerificationTicket.status == "in_progress",
                VerificationTicket.updated_at < threshold,
            )
        )
        timed_out = result.scalars().all()

        count = 0
        for ticket in timed_out:
            old_status = ticket.status
            ticket.status = "escalated"
            ticket.escalation_target = "system_auto"

            action = VerificationAction(
                verification_id=ticket.id,
                from_status=old_status,
                to_status="escalated",
                action="auto_escalate_timeout",
                operator="system",
                note=f"Automatically escalated after {TIMEOUT_HOURS}h in progress",
            )
            session.add(action)
            count += 1

        session.commit()

    logger.info(f"Checked timeout verifications: {count} escalated")
    return {"escalated_count": count}


@celery_app.task(name="app.tasks.verification_tasks.generate_daily_summary")
def generate_daily_summary() -> dict:
    engine = create_engine(SYNC_DATABASE_URL)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    with Session(engine) as session:
        result = session.execute(
            select(VerificationTicket).where(
                VerificationTicket.created_at >= yesterday,
                VerificationTicket.created_at < today,
            )
        )
        tickets = result.scalars().all()

        total = len(tickets)
        by_status: dict[str, int] = {}
        for ticket in tickets:
            by_status[ticket.status] = by_status.get(ticket.status, 0) + 1

    logger.info(f"Daily summary for {yesterday.date()}: total={total}, by_status={by_status}")
    return {"date": str(yesterday.date()), "total": total, "by_status": by_status}
