import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.models.case import Case
from app.models.invoice import Invoice
from app.models.share_link import ShareLink
from app.models.user import User, UserRole
from app.schemas.auth import CurrentUser
from app.schemas.share import (
    ShareAccessResponse,
    ShareLinkCreate,
    ShareLinkResponse,
    ShareLinkUpdate,
)
from app.services.permission_service import PermissionService


class ShareService:
    @staticmethod
    def _generate_token(resource_id: str | None, created_by: str) -> str:
        salt = settings.SHARE_LINK_SALT
        raw = f"{resource_id}:{created_by}:{datetime.now().isoformat()}:{salt}"
        return hashlib.sha256(raw.encode()).hexdigest()[:64]

    @staticmethod
    def _mask_sensitive_data(data: dict[str, Any], resource_type: str) -> dict[str, Any]:
        masked = data.copy()

        sensitive_fields: dict[str, list[str]] = {
            "case": ["quoted_amount", "actual_amount", "client_id", "lawyer_id"],
            "invoice": ["amount", "client_id", "lawyer_id"],
            "dashboard": ["total_revenue", "outstanding_amount", "profit_margin"],
        }

        fields_to_mask = sensitive_fields.get(resource_type, [])

        for field in fields_to_mask:
            if field in masked:
                value = masked[field]
                if isinstance(value, str):
                    if "@" in value:
                        parts = value.split("@")
                        masked[field] = f"{parts[0][:2]}***@{parts[1]}"
                    elif re.match(r"^1[3-9]\d{9}$", value):
                        masked[field] = f"{value[:3]}****{value[7:]}"
                    else:
                        masked[field] = "*" * len(value)
                elif isinstance(value, (int, float)):
                    str_value = str(value)
                    if len(str_value) > 4:
                        masked[field] = float(f"{str_value[:2]}***")
                    else:
                        masked[field] = "***"

        return masked

    @staticmethod
    def _filter_by_role(
        data: list[dict[str, Any]],
        role: UserRole,
        resource_type: str,
    ) -> list[dict[str, Any]]:
        if role in (UserRole.PARTNER, UserRole.LAWYER):
            return data

        filtered: list[dict[str, Any]] = []
        for item in data:
            if role == UserRole.ASSISTANT:
                filtered_item = item.copy()
                if resource_type == "case":
                    filtered_item.pop("quoted_amount", None)
                    filtered_item.pop("actual_amount", None)
                filtered.append(filtered_item)
            elif role == UserRole.CLIENT:
                filtered_item = item.copy()
                filtered_item.pop("lawyer_id", None)
                filtered_item.pop("internal_notes", None)
                filtered_item.pop("quoted_amount", None)
                filtered.append(filtered_item)

        return filtered

    @staticmethod
    def _is_expired(share_link: ShareLink) -> bool:
        if not share_link.expires_at:
            return False

        now = datetime.now(timezone.utc)

        if share_link.expires_at.tzinfo is None:
            expires_at_utc = share_link.expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at_utc = share_link.expires_at.astimezone(timezone.utc)

        return expires_at_utc < now

    @staticmethod
    def _validate_permissions(
        share_link: ShareLink,
        current_user: CurrentUser | None,
    ) -> tuple[bool, str | None]:
        if not share_link.is_active:
            return False, "分享链接已失效"

        if ShareService._is_expired(share_link):
            return False, "分享链接已过期"

        allowed_roles = share_link.allowed_roles if isinstance(share_link.allowed_roles, list) else []

        if not allowed_roles:
            return False, "分享链接未设置访问权限"

        if current_user is None:
            if "guest" in allowed_roles or "public" in allowed_roles:
                return True, None
            return False, "请登录后访问"

        user_role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

        if user_role_value not in allowed_roles:
            return False, "您没有权限访问此分享链接"

        return True, None

    @staticmethod
    async def _increment_access_count(
        db: AsyncSession,
        share_link: ShareLink,
    ) -> None:
        share_link.access_count += 1
        share_link.last_accessed_at = datetime.now(timezone.utc)
        await db.commit()

    @staticmethod
    async def create_share_link(
        db: AsyncSession,
        share_data: ShareLinkCreate,
        current_user: CurrentUser,
        base_url: str = "http://localhost:8000",
    ) -> ShareLinkResponse:
        PermissionService.can_share(current_user)

        if share_data.resource_id and not PermissionService.is_admin(current_user):
            await PermissionService.ensure_case_access(db, current_user, share_data.resource_id)

        token = ShareService._generate_token(
            str(share_data.resource_id) if share_data.resource_id else None,
            str(current_user.id),
        )

        expires_at = datetime.now(timezone.utc) + timedelta(hours=share_data.expires_in_hours)

        share_link = ShareLink(
            token=token,
            resource_type=share_data.resource_type,
            resource_id=share_data.resource_id,
            created_by=current_user.id,
            allowed_roles=[role.value for role in share_data.allowed_roles],
            expires_at=expires_at,
            allow_export=share_data.allow_export,
            hide_sensitive=share_data.hide_sensitive,
        )

        db.add(share_link)
        await db.commit()
        await db.refresh(share_link)

        response = ShareLinkResponse.model_validate(share_link)
        response.share_url = f"{settings.FRONTEND_URL or base_url}/share/{token}"
        response.allowed_roles = share_data.allowed_roles

        return response

    @staticmethod
    async def get_share_links(
        db: AsyncSession,
        current_user: CurrentUser,
        resource_type: str | None = None,
    ) -> list[ShareLinkResponse]:
        PermissionService.is_assistant_or_above(current_user)

        query = select(ShareLink).where(ShareLink.created_by == current_user.id)

        if resource_type:
            query = query.where(ShareLink.resource_type == resource_type)

        query = query.order_by(ShareLink.created_at.desc())
        result = await db.execute(query)
        share_links = result.scalars().all()

        responses = []
        for link in share_links:
            response = ShareLinkResponse.model_validate(link)
            response.share_url = f"{settings.FRONTEND_URL or 'http://localhost:8000'}/share/{link.token}"
            response.allowed_roles = [UserRole(role) for role in link.allowed_roles] if isinstance(link.allowed_roles, list) else []
            responses.append(response)

        return responses

    @staticmethod
    async def get_share_link_stats(
        db: AsyncSession,
        share_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, Any]:
        result = await db.execute(select(ShareLink).where(ShareLink.id == share_id))
        share_link = result.scalar_one_or_none()

        if not share_link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link not found",
            )

        if share_link.created_by != current_user.id and not PermissionService.is_admin(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this share link's stats",
            )

        is_expired = ShareService._is_expired(share_link)

        return {
            "id": str(share_link.id),
            "token": share_link.token,
            "access_count": share_link.access_count,
            "is_active": share_link.is_active,
            "is_expired": is_expired,
            "created_at": share_link.created_at,
            "expires_at": share_link.expires_at,
            "last_accessed_at": getattr(share_link, "last_accessed_at", None),
        }

    @staticmethod
    async def update_share_link(
        db: AsyncSession,
        share_id: UUID,
        update_data: ShareLinkUpdate,
        current_user: CurrentUser,
    ) -> ShareLinkResponse:
        result = await db.execute(select(ShareLink).where(ShareLink.id == share_id))
        share_link = result.scalar_one_or_none()

        if not share_link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link not found",
            )

        if share_link.created_by != current_user.id and not PermissionService.is_admin(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this share link",
            )

        if update_data.allowed_roles is not None:
            share_link.allowed_roles = [role.value for role in update_data.allowed_roles]

        if update_data.expires_in_hours is not None:
            share_link.expires_at = datetime.now(timezone.utc) + timedelta(hours=update_data.expires_in_hours)

        if update_data.allow_export is not None:
            share_link.allow_export = update_data.allow_export

        if update_data.hide_sensitive is not None:
            share_link.hide_sensitive = update_data.hide_sensitive

        if update_data.is_active is not None:
            share_link.is_active = update_data.is_active

        await db.commit()
        await db.refresh(share_link)

        response = ShareLinkResponse.model_validate(share_link)
        response.share_url = f"{settings.FRONTEND_URL or 'http://localhost:8000'}/share/{share_link.token}"
        response.allowed_roles = [UserRole(role) for role in share_link.allowed_roles] if isinstance(share_link.allowed_roles, list) else []

        return response

    @staticmethod
    async def revoke_share_link(
        db: AsyncSession,
        share_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, str]:
        return await ShareService.update_share_link(
            db,
            share_id,
            ShareLinkUpdate(is_active=False),
            current_user,
        )

    @staticmethod
    async def delete_share_link(
        db: AsyncSession,
        share_id: UUID,
        current_user: CurrentUser,
    ) -> dict[str, str]:
        result = await db.execute(select(ShareLink).where(ShareLink.id == share_id))
        share_link = result.scalar_one_or_none()

        if not share_link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link not found",
            )

        if share_link.created_by != current_user.id and not PermissionService.is_admin(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this share link",
            )

        await db.delete(share_link)
        await db.commit()

        return {"message": "Share link deleted successfully"}

    @staticmethod
    async def access_share_link(
        db: AsyncSession,
        token: str,
        current_user: CurrentUser | None = None,
    ) -> ShareAccessResponse:
        result = await db.execute(select(ShareLink).where(ShareLink.token == token))
        share_link = result.scalar_one_or_none()

        if not share_link:
            return ShareAccessResponse(valid=False, message="分享链接不存在")

        is_valid, error_message = ShareService._validate_permissions(share_link, current_user)
        if not is_valid:
            return ShareAccessResponse(valid=False, message=error_message)

        await ShareService._increment_access_count(db, share_link)

        data: Any = None
        if share_link.resource_id and share_link.resource_type == "case":
            result = await db.execute(select(Case).where(Case.id == share_link.resource_id))
            case = result.scalar_one_or_none()
            if case:
                case_data = {
                    "id": str(case.id),
                    "case_no": case.case_no,
                    "name": case.name,
                    "case_type": case.case_type,
                    "status": case.status.value if hasattr(case.status, "value") else case.status,
                    "created_at": case.created_at.isoformat(),
                }
                if not share_link.hide_sensitive:
                    case_data["quoted_amount"] = float(case.quoted_amount)
                    case_data["actual_amount"] = float(case.actual_amount)
                else:
                    case_data = ShareService._mask_sensitive_data(case_data, "case")

                if current_user:
                    filtered_cases = ShareService._filter_by_role(
                        [case_data],
                        current_user.role,
                        "case",
                    )
                    data = filtered_cases[0] if filtered_cases else None
                else:
                    data = case_data

        elif share_link.resource_type == "dashboard":
            from app.services.report_service import ReportService

            try:
                dashboard_data = await ReportService.get_dashboard_summary(db, current_user)
                data = dashboard_data

                if share_link.hide_sensitive:
                    if isinstance(data, dict):
                        data = ShareService._mask_sensitive_data(data, "dashboard")

                if current_user and isinstance(data, dict):
                    data_list = [data]
                    filtered = ShareService._filter_by_role(data_list, current_user.role, "dashboard")
                    data = filtered[0] if filtered else None
            except Exception:
                data = None

        elif share_link.resource_type == "invoice" and share_link.resource_id:
            result = await db.execute(select(Invoice).where(Invoice.id == share_link.resource_id))
            invoice = result.scalar_one_or_none()
            if invoice:
                invoice_data = {
                    "id": str(invoice.id),
                    "invoice_no": invoice.invoice_no,
                    "case_id": str(invoice.case_id),
                    "invoice_date": invoice.invoice_date.isoformat(),
                    "status": invoice.status.value if hasattr(invoice.status, "value") else invoice.status,
                    "source": invoice.source.value if hasattr(invoice.source, "value") else invoice.source,
                }
                if not share_link.hide_sensitive:
                    invoice_data["amount"] = float(invoice.amount)
                else:
                    invoice_data = ShareService._mask_sensitive_data(invoice_data, "invoice")

                if current_user:
                    filtered_invoices = ShareService._filter_by_role(
                        [invoice_data],
                        current_user.role,
                        "invoice",
                    )
                    data = filtered_invoices[0] if filtered_invoices else None
                else:
                    data = invoice_data

        return ShareAccessResponse(
            valid=True,
            resource_type=share_link.resource_type,
            resource_id=share_link.resource_id,
            allow_export=share_link.allow_export,
            hide_sensitive=share_link.hide_sensitive,
            expires_at=share_link.expires_at,
            data=data,
            message=None,
        )
