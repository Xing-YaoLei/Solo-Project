import asyncio
import logging
from datetime import datetime, timezone

from app.database import AsyncSessionLocal
from app.models.part import Part
from app.models.work_order import WorkOrder
from app.models.enums import OrderStatus, PartStatus
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def send_status_notification(order_id: str, new_status: str) -> None:
    logger.info(
        "[通知] 工单 %s 状态已更新为: %s", order_id, new_status
    )


@celery_app.task
def check_overdue_orders() -> None:
    async def _check() -> None:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select

            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(WorkOrder).where(
                    WorkOrder.estimated_completion < now,
                    WorkOrder.status.notin_([
                        OrderStatus.completed,
                        OrderStatus.closed,
                    ]),
                )
            )
            overdue = result.scalars().all()
            for order in overdue:
                logger.warning(
                    "[逾期提醒] 工单 %s (%s) 已超过预计完成时间",
                    order.order_no, order.customer_name,
                )

    asyncio.run(_check())


@celery_app.task
def batch_status_update_task(order_ids: list[str], new_status: str) -> None:
    async def _update() -> None:
        from sqlalchemy import select
        from app.models.user import User
        from app.models.enums import UserRole

        async with AsyncSessionLocal() as db:
            user_result = await db.execute(
                select(User).where(User.role == UserRole.manager).limit(1)
            )
            user = user_result.scalar_one_or_none()
            if user is None:
                logger.error("无系统用户可用于批量更新")
                return

            try:
                target_status = OrderStatus(new_status)
            except ValueError:
                logger.error("无效的状态值: %s", new_status)
                return

            from app.api.work_orders import STATUS_TRANSITIONS

            updated = 0
            for order_id in order_ids:
                result = await db.execute(
                    select(WorkOrder).where(WorkOrder.id == order_id)
                )
                order = result.scalar_one_or_none()
                if order is None:
                    continue
                current = order.status
                allowed = STATUS_TRANSITIONS.get(current, [])
                if target_status in allowed:
                    order.status = target_status
                    updated += 1

            await db.commit()
            logger.info("批量状态更新完成: %d / %d", updated, len(order_ids))

    asyncio.run(_update())


@celery_app.task
def daily_low_stock_check() -> None:
    async def _check() -> None:
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Part).where(Part.stock_quantity < Part.min_stock)
            )
            low_stock_parts = result.scalars().all()
            for part in low_stock_parts:
                logger.warning(
                    "[库存预警] 配件 '%s' (%s) 库存 %d 低于最低库存 %d",
                    part.name, part.part_no, part.stock_quantity, part.min_stock,
                )

    asyncio.run(_check())
