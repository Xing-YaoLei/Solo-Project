from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.part import Part
from app.models.shortage import Shortage
from app.models.user import User


async def create_shortage(db: AsyncSession, data: dict) -> Shortage:
    part_result = await db.execute(
        select(Part).where(Part.id == data.get("part_id"))
    )
    part = part_result.scalar_one_or_none()
    if part is None:
        raise ValueError("配件不存在")

    data["available_quantity"] = part.stock

    shortage = Shortage(**data)
    db.add(shortage)
    await db.commit()
    await db.refresh(shortage)
    return shortage


async def update_shortage(
    db: AsyncSession, shortage_id: int, data: dict, user: User
) -> Shortage:
    if user.role not in ("parts_staff", "manager"):
        raise PermissionError("仅配件人员或经理可更新缺件记录")

    result = await db.execute(
        select(Shortage).where(Shortage.id == shortage_id)
    )
    shortage = result.scalar_one_or_none()
    if shortage is None:
        raise ValueError("缺件记录不存在")

    for key, value in data.items():
        setattr(shortage, key, value)

    await db.commit()
    await db.refresh(shortage)
    return shortage


async def resolve_shortage(
    db: AsyncSession,
    shortage_id: int,
    resolution: str,
    user: User,
) -> Shortage:
    if user.role not in ("parts_staff", "manager"):
        raise PermissionError("仅配件人员或经理可解决缺件记录")

    result = await db.execute(
        select(Shortage).where(Shortage.id == shortage_id)
    )
    shortage = result.scalar_one_or_none()
    if shortage is None:
        raise ValueError("缺件记录不存在")

    shortage.is_resolved = True
    shortage.resolution = resolution
    shortage.resolved_by = user.id
    await db.commit()
    await db.refresh(shortage)
    return shortage
