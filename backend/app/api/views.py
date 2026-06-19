from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.models import SavedView, ViewType
from app.schemas import SavedViewCreate, SavedViewUpdate, SavedViewResponse

router = APIRouter(prefix="/api/views", tags=["views"])


@router.get("", response_model=List[SavedViewResponse])
async def list_views(
    view_type: Optional[ViewType] = None,
    session: AsyncSession = Depends(get_pg_session),
):
    query = select(SavedView).order_by(SavedView.created_at.desc())
    if view_type:
        query = query.where(SavedView.view_type == view_type)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=SavedViewResponse)
async def create_view(
    data: SavedViewCreate,
    session: AsyncSession = Depends(get_pg_session),
):
    view = SavedView(**data.model_dump())
    session.add(view)
    await session.commit()
    await session.refresh(view)
    return view


@router.delete("/{view_id}", response_model=SavedViewResponse)
async def delete_view(
    view_id: int,
    session: AsyncSession = Depends(get_pg_session),
):
    result = await session.execute(
        select(SavedView).where(SavedView.id == view_id)
    )
    view = result.scalars().first()
    if not view:
        return None
    await session.delete(view)
    await session.commit()
    return view
