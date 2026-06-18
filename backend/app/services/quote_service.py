from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quote import Quote, QuoteItem, QuoteStatus
from app.models.user import User


async def _generate_quote_no(db: AsyncSession) -> str:
    today = date.today()
    date_str = today.strftime("%Y%m%d")
    prefix = f"QT-{date_str}-"

    result = await db.execute(
        select(func.max(Quote.quote_no)).where(Quote.quote_no.like(f"{prefix}%"))
    )
    max_no = result.scalar_one_or_none()

    if max_no is None:
        seq = 1
    else:
        seq = int(max_no.split("-")[-1]) + 1

    return f"{prefix}{seq:03d}"


async def create_quote(db: AsyncSession, data: dict) -> Quote:
    items_data = data.pop("items", [])

    quote_no = await _generate_quote_no(db)

    total_amount = 0.0
    items: list[QuoteItem] = []
    for item_data in items_data:
        subtotal = item_data.get("quantity", 0) * item_data.get("unit_price", 0)
        total_amount += subtotal
        items.append(
            QuoteItem(
                part_name=item_data.get("part_name"),
                quantity=item_data.get("quantity"),
                unit_price=item_data.get("unit_price"),
                subtotal=subtotal,
            )
        )

    quote = Quote(
        quote_no=quote_no,
        total_amount=total_amount,
        **data,
    )
    db.add(quote)
    await db.flush()

    for item in items:
        item.quote_id = quote.id
        db.add(item)

    await db.commit()
    await db.refresh(quote)
    return quote


async def approve_quote(db: AsyncSession, quote_id: int, user: User) -> Quote:
    if user.role != "manager":
        raise PermissionError("仅经理可审批报价")

    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if quote is None:
        raise ValueError("报价单不存在")

    if quote.status != QuoteStatus.pending:
        raise ValueError("仅待审批报价可被批准")

    quote.status = QuoteStatus.approved
    await db.commit()
    await db.refresh(quote)
    return quote


async def reject_quote(
    db: AsyncSession, quote_id: int, user: User, reason: str
) -> Quote:
    if user.role != "manager":
        raise PermissionError("仅经理可审批报价")

    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if quote is None:
        raise ValueError("报价单不存在")

    if quote.status != QuoteStatus.pending:
        raise ValueError("仅待审批报价可被拒绝")

    quote.status = QuoteStatus.rejected
    quote.rejection_reason = reason
    await db.commit()
    await db.refresh(quote)
    return quote
