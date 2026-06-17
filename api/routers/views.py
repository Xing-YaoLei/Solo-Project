from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.services.view_service import list_views, create_view, get_view
from api.schemas import SavedViewOut, SavedViewCreate

router = APIRouter(prefix="/api/views", tags=["views"])


@router.get("", response_model=List[SavedViewOut])
async def views_list(db: AsyncSession = Depends(get_db)):
    return await list_views(db)


@router.post("", response_model=SavedViewOut, status_code=201)
async def views_create(data: SavedViewCreate, db: AsyncSession = Depends(get_db)):
    return await create_view(db, data)


@router.get("/{id}", response_model=SavedViewOut)
async def views_detail(id: int, db: AsyncSession = Depends(get_db)):
    result = await get_view(db, id)
    if not result:
        raise HTTPException(status_code=404, detail="View not found")
    return result
