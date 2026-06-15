import asyncio
from datetime import datetime
from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models import Notification, NotificationType, User, UserRole, ReviewApplication, ReviewStatus
from sqlalchemy import select


async def _run_async(coro):
    loop = asyncio.get_event_loop()
    if loop.is_running():
        return await coro
    else:
        return asyncio.run(coro)


@celery_app.task(name="send_notification_async")
def send_notification_async(recipient_id: int, review_id: int, type_str: str, title: str, content: str, reason: str = None):
    async def _do():
        async with AsyncSessionLocal() as db:
            try:
                notif_type = NotificationType(type_str)
            except ValueError:
                notif_type = NotificationType.SYSTEM_ALERT
            notif = Notification(
                recipient_id=recipient_id,
                review_id=review_id,
                type=notif_type,
                title=title,
                content=content,
                reason=reason,
            )
            db.add(notif)
            await db.commit()
            return {"status": "sent", "notification_id": notif.id}
    return asyncio.run(_do())


@celery_app.task(name="check_missing_materials_reminder")
def check_missing_materials_reminder():
    async def _do():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ReviewApplication).where(ReviewApplication.status == ReviewStatus.MATERIALS_MISSING)
            )
            reviews = result.scalars().all()
            sent_count = 0
            for r in reviews:
                if r.student and r.student.advisor_id:
                    notif = Notification(
                        recipient_id=r.student.advisor_id,
                        review_id=r.id,
                        type=NotificationType.MATERIALS_MISSING,
                        title="【催办】成绩复核材料仍缺失",
                        content=f"学生[{r.student.name}]的复核申请(编号:{r.application_no})材料仍未补齐，请尽快催促。缺失: {', '.join(r.missing_materials) if r.missing_materials else '未说明'}",
                        reason="定时催办",
                    )
                    db.add(notif)
                    sent_count += 1
            await db.commit()
            return {"status": "completed", "sent_count": sent_count}
    return asyncio.run(_do())


@celery_app.task(name="daily_materials_check")
def daily_materials_check():
    return check_missing_materials_reminder()
