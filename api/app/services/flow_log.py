import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FlowLog
from app.schemas import FlowLogCreate, FlowLogResponse


class FlowLogService:
    @staticmethod
    async def create_log(
        db: AsyncSession,
        ticket_id: uuid.UUID,
        action: str,
        operator_id: Optional[uuid.UUID],
        operator_role: Optional[str],
        comment: Optional[str],
        ticket_type: str = "appeal",
    ) -> FlowLog:
        log = FlowLog(
            ticket_id=ticket_id,
            ticket_type=ticket_type,
            action=action,
            operator_id=operator_id,
            operator_role=operator_role,
            comment=comment,
        )
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def get_logs(
        db: AsyncSession,
        ticket_id: uuid.UUID,
        ticket_type: Optional[str] = None,
    ) -> List[FlowLog]:
        stmt = select(FlowLog).where(FlowLog.ticket_id == ticket_id).order_by(FlowLog.created_at)
        if ticket_type:
            stmt = stmt.where(FlowLog.ticket_type == ticket_type)
        result = await db.execute(stmt)
        return list(result.scalars().all())
