import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.models import RiskAnnotation, ReviewNote
from api.schemas import (
    RiskAnnotationOut,
    RiskAnnotationCreate,
    ReviewNoteOut,
    ReviewNoteCreate,
)

router = APIRouter(prefix="/annotations", tags=["风险标注"])


@router.get("", response_model=list[RiskAnnotationOut], summary="获取风险标注列表")
async def list_annotations(
    type: str | None = None,
    severity: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RiskAnnotation).order_by(RiskAnnotation.timestamp.desc())
    if type:
        stmt = stmt.where(RiskAnnotation.type == type)
    if severity:
        stmt = stmt.where(RiskAnnotation.severity == severity)
    result = await db.execute(stmt)
    return [
        RiskAnnotationOut.model_validate(a, from_attributes=True)
        for a in result.scalars().all()
    ]


@router.post("", response_model=RiskAnnotationOut, summary="创建风险标注", status_code=201)
async def create_annotation(
    data: RiskAnnotationCreate,
    db: AsyncSession = Depends(get_db),
):
    annotation = RiskAnnotation(
        type=data.type,
        timestamp=data.timestamp,
        description=data.description,
        severity=data.severity,
        bed_id=data.bed_id,
        metadata_=data.metadata_,
    )
    db.add(annotation)
    await db.commit()
    await db.refresh(annotation)
    return RiskAnnotationOut.model_validate(annotation, from_attributes=True)


@router.get("/{annotation_id}", response_model=RiskAnnotationOut, summary="获取风险标注详情")
async def get_annotation(
    annotation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RiskAnnotation).where(RiskAnnotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="风险标注不存在")
    return RiskAnnotationOut.model_validate(annotation, from_attributes=True)


@router.post(
    "/{annotation_id}/review-notes",
    response_model=ReviewNoteOut,
    summary="创建审核备注",
    status_code=201,
)
async def create_review_note(
    annotation_id: uuid.UUID,
    data: ReviewNoteCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RiskAnnotation).where(RiskAnnotation.id == annotation_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="风险标注不存在")
    note = ReviewNote(
        annotation_id=annotation_id,
        author=data.author,
        content=data.content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return ReviewNoteOut.model_validate(note, from_attributes=True)


@router.get(
    "/{annotation_id}/review-notes",
    response_model=list[ReviewNoteOut],
    summary="获取审核备注列表",
)
async def list_review_notes(
    annotation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReviewNote)
        .where(ReviewNote.annotation_id == annotation_id)
        .order_by(ReviewNote.created_at)
    )
    return [
        ReviewNoteOut.model_validate(n, from_attributes=True)
        for n in result.scalars().all()
    ]
