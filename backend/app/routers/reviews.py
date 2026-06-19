import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def _parse_datetime(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.strptime(value, "%Y-%m-%d")


@router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    review = Review(
        complaint_id=data.complaint_id,
        review_tags=data.review_tags,
        summary=data.summary,
        improvement_measures=data.improvement_measures,
        reviewer_name=data.reviewer_name,
        reviewed_at=_parse_datetime(data.reviewed_at) if data.reviewed_at else datetime.now(),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/{complaint_id}", response_model=list[ReviewResponse])
async def get_reviews(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.complaint_id == complaint_id)
    )
    return result.scalars().all()


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if data.review_tags is not None:
        review.review_tags = data.review_tags
    if data.summary is not None:
        review.summary = data.summary
    if data.improvement_measures is not None:
        review.improvement_measures = data.improvement_measures
    if data.reviewer_name is not None:
        review.reviewer_name = data.reviewer_name

    await db.commit()
    await db.refresh(review)
    return review
