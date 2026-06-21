from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.models.user import User, UserRole
from app.schemas.auth import CurrentUser


class PermissionService:
    @staticmethod
    def is_admin(user: CurrentUser) -> bool:
        return user.role in {UserRole.PARTNER}

    @staticmethod
    def is_lawyer_or_above(user: CurrentUser) -> bool:
        return user.role in {UserRole.PARTNER, UserRole.LAWYER}

    @staticmethod
    def is_assistant_or_above(user: CurrentUser) -> bool:
        return user.role in {UserRole.PARTNER, UserRole.LAWYER, UserRole.ASSISTANT}

    @staticmethod
    def require_role(user: CurrentUser, *roles: UserRole) -> None:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {[role.value for role in roles]}",
            )

    @staticmethod
    async def can_access_case(
        db: AsyncSession,
        user: CurrentUser,
        case_id: UUID,
    ) -> bool:
        if PermissionService.is_admin(user):
            return True

        result = await db.execute(
            select(Case).where(Case.id == case_id)
        )
        case = result.scalar_one_or_none()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found",
            )

        if user.role == UserRole.LAWYER:
            return case.lawyer_id == user.id
        elif user.role == UserRole.CLIENT:
            return case.client_id == user.id
        elif user.role == UserRole.ASSISTANT:
            return True
        else:
            return False

    @staticmethod
    async def ensure_case_access(
        db: AsyncSession,
        user: CurrentUser,
        case_id: UUID,
    ) -> None:
        if not await PermissionService.can_access_case(db, user, case_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this case",
            )

    @staticmethod
    def can_view_sensitive_data(user: CurrentUser, hide_sensitive: bool = True) -> bool:
        if not hide_sensitive:
            return True
        return PermissionService.is_lawyer_or_above(user)

    @staticmethod
    def can_export(user: CurrentUser) -> bool:
        return PermissionService.is_lawyer_or_above(user)

    @staticmethod
    def can_share(user: CurrentUser) -> bool:
        return PermissionService.is_assistant_or_above(user)
