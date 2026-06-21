from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import get_current_user, get_current_user_optional
from app.schemas.auth import CurrentUser
from app.schemas.share import (
    ShareAccessResponse,
    ShareLinkCreate,
    ShareLinkListItem,
    ShareLinkResponse,
    ShareLinkUpdate,
)
from app.services.share_service import ShareService

router = APIRouter()


@router.post(
    "",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建分享链接",
)
async def create_share_link(
    share_data: ShareLinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ShareLinkResponse:
    return await ShareService.create_share_link(db, share_data, current_user)


@router.get(
    "",
    response_model=list[ShareLinkListItem],
    status_code=status.HTTP_200_OK,
    summary="获取分享链接列表",
)
async def get_share_links(
    resource_type: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[ShareLinkListItem]:
    return await ShareService.get_share_links(db, current_user, resource_type)


@router.get(
    "/{share_id}",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_200_OK,
    summary="获取分享链接详情",
)
async def get_share_link(
    share_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ShareLinkResponse:
    links = await ShareService.get_share_links(db, current_user)
    for link in links:
        if link.id == share_id:
            return link
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Share link not found")


@router.put(
    "/{share_id}",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_200_OK,
    summary="更新分享链接",
)
async def update_share_link(
    share_id: UUID,
    update_data: ShareLinkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ShareLinkResponse:
    return await ShareService.update_share_link(db, share_id, update_data, current_user)


@router.delete(
    "/{share_id}",
    status_code=status.HTTP_200_OK,
    summary="删除分享链接",
)
async def delete_share_link(
    share_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, str]:
    return await ShareService.delete_share_link(db, share_id, current_user)


@router.get(
    "/access/{token}",
    response_model=ShareAccessResponse,
    status_code=status.HTTP_200_OK,
    summary="访问分享链接",
)
async def access_share_link(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
) -> ShareAccessResponse:
    return await ShareService.access_share_link(db, token, current_user)
