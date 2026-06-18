import asyncio
import logging
from datetime import datetime, timezone

from app.database import async_session_factory
from app.models.part import Part
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def send_status_notification(order_id: int, new_status: str) -> None:
    logger.info(
        "[通知] 工单 #%d 状态已更新为: %s", order_id, new_status
    )


@celery_app.task
def check_overdue_orders() -> None:
    async def _check() -> None:
        async with async_session_factory() as db:
            now = datetime.now(timezone.utc)
            result = await db.execute(
                WorkOrder.__table__.select().where(
                    WorkOrder.estimated_completion < now,
                    WorkOrder.status.notin_([
                        WorkOrderStatus.completed.value,
                        WorkOrderStatus.closed.value,
                    ]),
                )
            )
            overdue = result.fetchall()
            for order in overdue:
                logger.warning(
                    "[逾期提醒] 工单 #%d 已超过预计完成时间", order.id
                )

    asyncio.run(_check())


@celery_app.task
def batch_status_update_task(order_ids: list[int], new_status: str) -> None:
    async def _update() -> None:
        from app.services.work_order_service import change_status
        from app.models.user import User

        async with async_session_factory() as db:
            system_user_result = await db.execute(
                User.__table__.select().limit(1)
            )
            system_user_row = system_user_result.first()
            if system_user_row is None:
                logger.error("无系统用户可用于批量更新")
                return

            from sqlalchemy import select
            user_result = await db.execute(
                select(User).where(User.id == system_user_row.id)
            )
            user = user_result.scalar_one()

            status_enum = WorkOrderStatus(new_status)
            for order_id in order_ids:
                try:
                    await change_status(db, order_id, status_enum, user)
                except (ValueError, PermissionError) as e:
                    logger.warning(
                        "批量更新工单 #%d 失败: %s", order_id, str(e)
                    )

    asyncio.run(_update())


@celery_app.task
def daily_low_stock_check() -> None:
    async def _check() -> None:
        from app.services.part_service import check_low_stock

        async with async_session_factory() as db:
            low_stock_parts = await check_low_stock(db)
            for part in low_stock_parts:
                logger.warning(
                    "[库存预警] 配件 '%s' 库存 %d 低于最低库存 %d",
                    part.name,
                    part.stock,
                    part.min_stock,
                )

    asyncio.run(_check())
