from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.complaint import Complaint
from app.models.handler import Handler
from app.models.review import Review
from app.schemas.stats import (
    StatsByChannel,
    StatsByClosureDuration,
    StatsByHandler,
    StatsByReviewTag,
)

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/by-channel", response_model=list[StatsByChannel])
async def stats_by_channel(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            Complaint.source_channel.label("channel"),
            func.count(Complaint.id).label("count"),
        )
        .group_by(Complaint.source_channel)
        .order_by(func.count(Complaint.id).desc())
    )
    return [StatsByChannel(channel=row.channel, count=row.count) for row in result.all()]


@router.get("/by-handler", response_model=list[StatsByHandler])
async def stats_by_handler(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            Handler.name.label("handler_name"),
            func.count(Complaint.id).label("count"),
        )
        .join(Handler, Complaint.handler_id == Handler.id, isouter=True)
        .group_by(Handler.name)
        .order_by(func.count(Complaint.id).desc())
    )
    return [StatsByHandler(handler_name=row.handler_name or "未分配", count=row.count) for row in result.all()]


@router.get("/by-closure-duration", response_model=list[StatsByClosureDuration])
async def stats_by_closure_duration(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Complaint.created_at, Complaint.closed_at)
        .where(Complaint.closed_at.isnot(None))
    )
    rows = result.all()

    ranges = {"0-7天": 0, "7-30天": 0, "30天以上": 0}
    for row in rows:
        if row.closed_at and row.created_at:
            days = (row.closed_at - row.created_at).days
            if days <= 7:
                ranges["0-7天"] += 1
            elif days <= 30:
                ranges["7-30天"] += 1
            else:
                ranges["30天以上"] += 1

    return [StatsByClosureDuration(duration_range=k, count=v) for k, v in ranges.items()]


@router.get("/by-review-tag", response_model=list[StatsByReviewTag])
async def stats_by_review_tag(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review.review_tags))
    rows = result.all()

    tag_counts: dict[str, int] = {}
    for row in rows:
        tags = [t.strip() for t in row.review_tags.split(",") if t.strip()]
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    return [StatsByReviewTag(tag=k, count=v) for k, v in sorted_tags]
