import uuid
from datetime import datetime

from celery import Celery

from app.config import settings

celery_app = Celery(
    "subsidy_tracker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(bind=True, name="process_damage_report")
def process_damage_report(self, order_id: str, rider_id: str, description: str, photo_urls: list):
    from app.database import async_session
    from app.models import TodoTicket
    import asyncio

    async def _create_todo():
        async with async_session() as session:
            ticket = TodoTicket(
                source_type="damage_report",
                source_id=uuid.UUID(order_id) if order_id else None,
                title=f"Damage Report - Order {order_id}",
                description=description,
                status="pending",
                priority="high",
                created_by=uuid.UUID(rider_id) if rider_id else None,
            )
            session.add(ticket)
            await session.commit()
            return str(ticket.id)

    loop = asyncio.get_event_loop()
    ticket_id = loop.run_until_complete(_create_todo())
    return {"ticket_id": ticket_id, "status": "created"}


@celery_app.task(bind=True, name="calculate_settlement_batch")
def calculate_settlement_batch(self, batch_id: str):
    from app.database import async_session
    from app.models import SettlementBatch, SettlementDetail
    import asyncio
    from decimal import Decimal

    async def _calculate():
        async with async_session() as session:
            from sqlalchemy import select
            stmt = select(SettlementDetail).where(SettlementDetail.batch_id == uuid.UUID(batch_id))
            result = await session.execute(stmt)
            details = result.scalars().all()

            total = Decimal("0")
            count = 0
            for detail in details:
                total += detail.total_amount
                count += 1

            batch_stmt = select(SettlementBatch).where(SettlementBatch.id == uuid.UUID(batch_id))
            batch_result = await session.execute(batch_stmt)
            batch = batch_result.scalar_one_or_none()
            if batch:
                batch.total_amount = total
                batch.total_count = count
                await session.commit()
            return {"total_amount": float(total), "total_count": count}

    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_calculate())


@celery_app.task(bind=True, name="send_status_change_notification")
def send_status_change_notification(self, ticket_id: str, old_status: str, new_status: str, recipient_id: str):
    return {
        "ticket_id": ticket_id,
        "old_status": old_status,
        "new_status": new_status,
        "recipient_id": recipient_id,
        "notified_at": datetime.utcnow().isoformat(),
    }


@celery_app.task(bind=True, name="auto_assign_todo_ticket")
def auto_assign_todo_ticket(self, ticket_id: str):
    from app.database import async_session
    from app.models import TodoTicket, User
    import asyncio
    from sqlalchemy import select, func

    async def _assign():
        async with async_session() as session:
            user_stmt = select(User).where(User.role == "operator", User.is_active == True).order_by(func.random()).limit(1)
            user_result = await session.execute(user_stmt)
            operator = user_result.scalar_one_or_none()

            if operator:
                ticket_stmt = select(TodoTicket).where(TodoTicket.id == uuid.UUID(ticket_id))
                ticket_result = await session.execute(ticket_stmt)
                ticket = ticket_result.scalar_one_or_none()
                if ticket and ticket.status == "pending":
                    ticket.assignee_id = operator.id
                    ticket.status = "claimed"
                    await session.commit()
                    return {"ticket_id": ticket_id, "assignee_id": str(operator.id)}
            return {"ticket_id": ticket_id, "assignee_id": None}

    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_assign())
