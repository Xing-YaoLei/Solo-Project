from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from itsdangerous import URLSafeSerializer, BadSignature

from src.auth.permissions import User
from src.config import app_config
from src.business.metric_versions import get_metric_version


@dataclass
class SharePayload:
    owner: str
    owner_role: str
    allowed_stores: list[str] = field(default_factory=list)
    allowed_permissions: list[str] = field(default_factory=list)
    metric_version: str = "v2.0"
    include_metric_footer: bool = True
    filters: dict = field(default_factory=dict)
    expires_at: Optional[str] = None
    charts: list[str] = field(default_factory=lambda: [
        "trend", "reason_composition", "review_detail", "store_exception"
    ])
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def is_expired(self) -> bool:
        if not self.expires_at:
            return False
        try:
            return datetime.fromisoformat(self.expires_at) < datetime.now()
        except Exception:
            return True

    def can_view_chart(self, chart_name: str) -> bool:
        return chart_name in self.charts

    def get_formula_footer(self) -> str:
        mv = get_metric_version(self.metric_version)
        if not mv:
            return ""
        return (
            f"【口径版本 {self.metric_version}】{mv.description}\n"
            f"计算公式：{mv.formula}\n"
            f"生效日期：{mv.effective_date.isoformat()}"
        )

    def to_share_user(self) -> User:
        perms = {p: True for p in self.allowed_permissions}
        role = "viewer"
        if perms.get("edit_review"):
            role = "store_manager"
        if perms.get("share_dashboard"):
            role = "area_manager"
        if perms.get("manage_metrics"):
            role = "admin"
        return User(
            username=f"share_{self.owner}",
            role=role,
            stores=list(self.allowed_stores),
        )


class ShareManager:
    def __init__(self):
        self.serializer = URLSafeSerializer(app_config.app_secret_key, salt="share-coffee-loss")

    def create_token(self, owner_user: User, ttl_hours: int = 24, **kwargs) -> str:
        payload = SharePayload(
            owner=owner_user.username,
            owner_role=owner_user.role,
            allowed_stores=list(owner_user.stores) if not owner_user.has_permission("view_all_stores") else [],
            allowed_permissions=[p for p, v in _user_perms_map(owner_user).items() if v],
            expires_at=(datetime.now() + timedelta(hours=ttl_hours)).isoformat(),
            **kwargs,
        )
        token = self.serializer.dumps(asdict(payload))
        return token

    def parse_token(self, token: str) -> Optional[SharePayload]:
        try:
            data = self.serializer.loads(token)
            payload = SharePayload(**data)
            if payload.is_expired():
                return None
            return payload
        except (BadSignature, TypeError, ValueError):
            return None

    def public_share_url(self, token: str, base_url: str = "http://localhost:8501") -> str:
        return f"{base_url}/?share={token}"


def _user_perms_map(user: User) -> dict:
    from src.auth.permissions import PERMISSIONS
    return PERMISSIONS.get(user.role, {})


def build_share_payload_from_user(
    user: User,
    metric_version: str = "v2.0",
    filters: dict | None = None,
    charts: list[str] | None = None,
    ttl_hours: int = 24,
    include_metric_footer: bool = True,
) -> SharePayload:
    return SharePayload(
        owner=user.username,
        owner_role=user.role,
        allowed_stores=list(user.stores) if not user.has_permission("view_all_stores") else [],
        allowed_permissions=[p for p, v in _user_perms_map(user).items() if v],
        metric_version=metric_version,
        include_metric_footer=include_metric_footer,
        filters=filters or {},
        expires_at=(datetime.now() + timedelta(hours=ttl_hours)).isoformat(),
        charts=charts or ["trend", "reason_composition", "review_detail", "store_exception"],
    )
