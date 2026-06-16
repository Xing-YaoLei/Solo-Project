import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, get_db_session
from api.models import User
from api.schemas import (
    ExceptionCreate,
    ExceptionListParams,
    ExceptionOut,
    ExceptionUpdate,
    PaginatedResponse,
)
from api.services import exception_service

router = APIRouter(prefix="/exceptions", tags=["异常管理"])


@router.post("", response_model=ExceptionOut, status_code=status.HTTP_201_CREATED)
async def create_exception(
    body: ExceptionCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    exc = await exception_service.create_exception(db, body, current_user.id)
    await db.commit()
    await db.refresh(exc)
    return exc


@router.get("", response_model=PaginatedResponse)
async def list_exceptions(
    params: ExceptionListParams = Depends(),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    items, total = await exception_service.list_exceptions(db, params)
    return PaginatedResponse(
        items=[ExceptionOut.model_validate(e) for e in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=math.ceil(total / params.page_size) if total > 0 else 0,
    )


@router.get("/{exc_id}", response_model=ExceptionOut)
async def get_exception(
    exc_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    exc = await exception_service.get_exception(db, exc_id)
    if not exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="异常记录不存在")
    return exc


@router.patch("/{exc_id}", response_model=ExceptionOut)
async def update_exception(
    exc_id: str,
    body: ExceptionUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    exc = await exception_service.get_exception(db, exc_id)
    if not exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="异常记录不存在")
    exc = await exception_service.update_exception(db, exc, body)
    await db.commit()
    await db.refresh(exc)
    return exc
