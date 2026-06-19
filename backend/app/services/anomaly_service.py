from datetime import datetime
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AnomalyFlag, Complaint, ComplaintStatus, FlagType


async def detect_anomalies(session: AsyncSession) -> List[AnomalyFlag]:
    result = await session.execute(select(Complaint))
    complaints = result.scalars().all()
    new_flags: List[AnomalyFlag] = []

    for c in complaints:
        if c.complaint_type and "门锁" in c.complaint_type:
            existing = await session.execute(
                select(AnomalyFlag).where(
                    AnomalyFlag.complaint_id == c.id,
                    AnomalyFlag.flag_type == FlagType.door_lock_delay,
                )
            )
            if not existing.scalars().first():
                flag = AnomalyFlag(
                    complaint_id=c.id,
                    flag_type=FlagType.door_lock_delay,
                    description=f"客诉涉及门锁问题：{c.complaint_content[:100]}",
                    detected_at=datetime.utcnow(),
                    severity="high",
                )
                session.add(flag)
                new_flags.append(flag)

        if c.status == ComplaintStatus.closed and not c.revisit_result:
            existing = await session.execute(
                select(AnomalyFlag).where(
                    AnomalyFlag.complaint_id == c.id,
                    AnomalyFlag.flag_type == FlagType.payment_gap,
                )
            )
            if not existing.scalars().first():
                flag = AnomalyFlag(
                    complaint_id=c.id,
                    flag_type=FlagType.payment_gap,
                    description=f"客诉已关闭但未记录回访结果，可能存在收款缺失",
                    detected_at=datetime.utcnow(),
                    severity="medium",
                )
                session.add(flag)
                new_flags.append(flag)

        if c.assigned_to and c.complaint_type and "口径" in c.complaint_type:
            existing = await session.execute(
                select(AnomalyFlag).where(
                    AnomalyFlag.complaint_id == c.id,
                    AnomalyFlag.flag_type == FlagType.cs_message_change,
                )
            )
            if not existing.scalars().first():
                flag = AnomalyFlag(
                    complaint_id=c.id,
                    flag_type=FlagType.cs_message_change,
                    description=f"客诉内容涉及口径问题，可能存在客服口径变化",
                    detected_at=datetime.utcnow(),
                    severity="medium",
                )
                session.add(flag)
                new_flags.append(flag)

    await session.commit()
    for flag in new_flags:
        await session.refresh(flag)

    all_flags_result = await session.execute(select(AnomalyFlag))
    return list(all_flags_result.scalars().all())


async def get_anomaly_flags(
    session: AsyncSession,
    complaint_id: Optional[int] = None,
) -> List[AnomalyFlag]:
    query = select(AnomalyFlag)
    if complaint_id is not None:
        query = query.where(AnomalyFlag.complaint_id == complaint_id)
    result = await session.execute(query)
    return list(result.scalars().all())
