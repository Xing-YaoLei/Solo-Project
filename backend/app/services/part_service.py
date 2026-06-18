from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.part import OrderPart, OrderPartStatus, Part
from app.models.user import User


async def issue_part(
    db: AsyncSession, order_part_id: int, user: User
) -> OrderPart:
    result = await db.execute(
        select(OrderPart).where(OrderPart.id == order_part_id)
    )
    order_part = result.scalar_one_or_none()
    if order_part is None:
        raise ValueError("工单配件记录不存在")

    part_result = await db.execute(select(Part).where(Part.id == order_part.part_id))
    part = part_result.scalar_one_or_none()
    if part is None:
        raise ValueError("配件不存在")

    if part.stock < order_part.quantity:
        raise ValueError("库存不足，无法出库")

    part.stock -= order_part.quantity
    order_part.status = OrderPartStatus.issued
    await db.commit()
    await db.refresh(order_part)
    return order_part


async def return_part(
    db: AsyncSession, order_part_id: int, user: User
) -> OrderPart:
    result = await db.execute(
        select(OrderPart).where(OrderPart.id == order_part_id)
    )
    order_part = result.scalar_one_or_none()
    if order_part is None:
        raise ValueError("工单配件记录不存在")

    part_result = await db.execute(select(Part).where(Part.id == order_part.part_id))
    part = part_result.scalar_one_or_none()
    if part is None:
        raise ValueError("配件不存在")

    part.stock += order_part.quantity
    order_part.status = OrderPartStatus.returned
    await db.commit()
    await db.refresh(order_part)
    return order_part


async def check_low_stock(db: AsyncSession) -> list[Part]:
    result = await db.execute(select(Part).where(Part.stock < Part.min_stock))
    return list(result.scalars().all())


async def add_part_to_order(
    db: AsyncSession, order_id: int, part_id: int, quantity: int
) -> OrderPart:
    part_result = await db.execute(select(Part).where(Part.id == part_id))
    part = part_result.scalar_one_or_none()
    if part is None:
        raise ValueError("配件不存在")

    if part.stock < quantity:
        raise ValueError("库存不足")

    order_part = OrderPart(
        order_id=order_id,
        part_id=part_id,
        quantity=quantity,
        unit_price=part.unit_price,
        status=OrderPartStatus.pending,
    )
    db.add(order_part)
    await db.commit()
    await db.refresh(order_part)
    return order_part
