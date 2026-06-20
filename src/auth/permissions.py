from __future__ import annotations

import json
import uuid
import hashlib
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Set

import polars as pl

from src.data.database import db


class UserRole(str, Enum):
    ORGANIZER = "organizer"
    TICKET_STAFF = "ticket_staff"
    GATE_STAFF = "gate_staff"
    ATTENDEE = "attendee"
    EXTERNAL = "external"


ROLE_LABELS = {
    UserRole.ORGANIZER: "主办方",
    UserRole.TICKET_STAFF: "票务人员",
    UserRole.GATE_STAFF: "检票员",
    UserRole.ATTENDEE: "观众",
    UserRole.EXTERNAL: "外部人员",
}


ROLE_HIERARCHY = {
    UserRole.ORGANIZER: 4,
    UserRole.TICKET_STAFF: 3,
    UserRole.GATE_STAFF: 2,
    UserRole.ATTENDEE: 1,
    UserRole.EXTERNAL: 0,
}


SENSITIVE_COLUMNS: Dict[str, Set[str]] = {
    "tickets": {"buyer_phone", "buyer_email", "attendee_name", "seat_info", "ticket_code"},
    "orders": {"buyer_phone", "buyer_email", "buyer_name"},
    "payments": {"transaction_id", "gateway_response"},
    "gate_records": {"ticket_code", "raw_payload"},
    "refund_disputes": {"applicant_contact", "applicant_name"},
    "sponsors": {"contact_person", "contact_phone"},
    "staff": {"phone", "email"},
    "users": {"email", "phone", "event_access"},
}


VIEW_SCOPES = {
    "overview": "总览看板",
    "sponsors": "赞助清单",
    "ticket_types": "票种规则",
    "checkin_details": "核销明细",
    "disputes": "退票争议",
    "raw_records": "闸机原始记录",
}


class PermissionManager:
    def __init__(self):
        self._current_user: Optional[Dict[str, Any]] = None

    def role_has_access(self, required_role: UserRole, current_role: UserRole) -> bool:
        return ROLE_HIERARCHY.get(current_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)

    def can_view_overview(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.ATTENDEE, role)

    def can_view_sponsors(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.TICKET_STAFF, role)

    def can_view_ticket_types(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.ATTENDEE, role)

    def can_view_checkin_details(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.GATE_STAFF, role)

    def can_view_raw_records(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.TICKET_STAFF, role)

    def can_view_disputes(self, role: UserRole) -> bool:
        return self.role_has_access(UserRole.TICKET_STAFF, role)

    def can_view_sensitive(self, role: UserRole, table: str, column: str) -> bool:
        if table not in SENSITIVE_COLUMNS:
            return True
        if column not in SENSITIVE_COLUMNS[table]:
            return True
        return self.role_has_access(UserRole.TICKET_STAFF, role)

    def mask_sensitive_data(
        self, df: pl.DataFrame, table_name: str, role: UserRole
    ) -> pl.DataFrame:
        if self.role_has_access(UserRole.TICKET_STAFF, role):
            return df

        sensitive = SENSITIVE_COLUMNS.get(table_name, set())
        mask_map: Dict[str, pl.Expr] = {}

        for col in df.columns:
            if col in sensitive:
                if "phone" in col.lower():
                    mask_map[col] = pl.when(pl.col(col).is_not_null())
                    mask_map[col] = mask_map[col].then(
                        pl.col(col).str.extract(r"^(\d{3})\d*(\d{4})$").alias(col)
                        + pl.lit("")
                    )
                    mask_map[col] = mask_map[col].otherwise(pl.col(col))
                elif "email" in col.lower():
                    mask_map[col] = pl.when(pl.col(col).is_not_null())
                    mask_map[col] = mask_map[col].then(
                        pl.col(col).str.extract(r"^(.{1,2})[^@]*(@.*)$").alias(col)
                    )
                    mask_map[col] = mask_map[col].otherwise(pl.col(col))
                elif "name" in col.lower():
                    mask_map[col] = pl.when(pl.col(col).is_not_null())
                    mask_map[col] = mask_map[col].then(
                        pl.concat_str([
                            pl.col(col).str.slice(0, 1),
                            pl.lit("**"),
                        ])
                    )
                    mask_map[col] = mask_map[col].otherwise(pl.col(col))
                else:
                    mask_map[col] = pl.lit("***").alias(col)

        if not mask_map:
            return df

        return df.with_columns(**mask_map)

    def set_current_user(self, username: Optional[str] = None, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        conditions = []
        params = []
        if username:
            conditions.append("username = ?")
            params.append(username)
        if user_id:
            conditions.append("user_id = ?")
            params.append(user_id)

        if not conditions:
            self._current_user = None
            return None

        sql = f"SELECT * FROM users WHERE {' AND '.join(conditions)} LIMIT 1"
        result = db.query_to_df(sql, tuple(params))
        if result.height == 0:
            self._current_user = None
            return None

        user = result.row(0, named=True)
        if user.get("event_access"):
            try:
                user["event_access"] = json.loads(user["event_access"])
            except (json.JSONDecodeError, TypeError):
                user["event_access"] = []
        self._current_user = user
        return user

    def get_current_user(self) -> Optional[Dict[str, Any]]:
        return self._current_user

    def get_current_role(self) -> UserRole:
        if not self._current_user:
            return UserRole.EXTERNAL
        return UserRole(self._current_user.get("user_role", "external"))

    def can_access_event(self, event_id: str) -> bool:
        if not self._current_user:
            return False
        role = self.get_current_role()
        if role == UserRole.ORGANIZER:
            return True
        access = self._current_user.get("event_access", []) or []
        return event_id in access

    def get_accessible_events(self) -> List[str]:
        if not self._current_user:
            return []
        role = self.get_current_role()
        if role == UserRole.ORGANIZER:
            result = db.query_to_df("SELECT event_id FROM events")
            return result["event_id"].to_list()
        return list(self._current_user.get("event_access", []) or [])

    def list_users(self) -> pl.DataFrame:
        sql = """
        SELECT user_id, username, user_role, display_name, email, is_active, created_at
        FROM users ORDER BY created_at DESC
        """
        return db.query_to_df(sql)


class ShareLinkManager:
    def __init__(self):
        pass

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def create_link(
        self,
        event_id: Optional[str],
        view_scope: str,
        allowed_roles: List[UserRole],
        expires_days: int = 30,
        max_views: Optional[int] = 100,
        created_by: str = "system",
    ) -> Dict[str, Any]:
        if view_scope not in VIEW_SCOPES:
            raise ValueError(f"Invalid view_scope: {view_scope}")

        raw_token = uuid.uuid4().hex
        link_id = f"LNK_{uuid.uuid4().hex[:12]}"
        expires_at = datetime.now() + timedelta(days=expires_days)

        sql = """
        INSERT INTO share_links (
            link_id, link_token, event_id, view_scope, allowed_roles,
            expires_at, max_views, current_views, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        """
        db.execute(
            sql,
            (
                link_id,
                raw_token,
                event_id,
                view_scope,
                json.dumps([r.value for r in allowed_roles], ensure_ascii=False),
                expires_at,
                max_views,
                created_by,
            ),
        )

        return {
            "link_id": link_id,
            "token": raw_token,
            "event_id": event_id,
            "view_scope": view_scope,
            "scope_label": VIEW_SCOPES.get(view_scope, view_scope),
            "allowed_roles": [ROLE_LABELS.get(r, r.value) for r in allowed_roles],
            "expires_at": expires_at,
            "max_views": max_views,
            "share_url": f"?share={raw_token}",
        }

    def validate_link(self, token: str) -> Optional[Dict[str, Any]]:
        sql = "SELECT * FROM share_links WHERE link_token = ? LIMIT 1"
        result = db.query_to_df(sql, (token,))
        if result.height == 0:
            return None

        link = result.row(0, named=True)

        if link.get("expires_at") and datetime.now() > link["expires_at"]:
            return None

        if link.get("max_views") and (link.get("current_views") or 0) >= link["max_views"]:
            return None

        try:
            link["allowed_roles"] = json.loads(link["allowed_roles"]) if link.get("allowed_roles") else []
        except (json.JSONDecodeError, TypeError):
            link["allowed_roles"] = []

        update_sql = """
        UPDATE share_links SET current_views = COALESCE(current_views, 0) + 1
        WHERE link_id = ?
        """
        db.execute(update_sql, (link["link_id"],))

        return link

    def can_view_with_link(
        self,
        link_data: Dict[str, Any],
        view_scope: str,
        user_role: UserRole,
    ) -> bool:
        if link_data.get("view_scope") != view_scope:
            return False

        allowed = link_data.get("allowed_roles", []) or []
        if not allowed:
            return True

        return user_role.value in allowed

    def list_links(self, event_id: Optional[str] = None) -> pl.DataFrame:
        conditions = []
        params = []
        if event_id:
            conditions.append("event_id = ?")
            params.append(event_id)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"""
        SELECT
            link_id, link_token, event_id, view_scope, allowed_roles,
            expires_at, max_views, current_views, created_by, created_at
        FROM share_links {where}
        ORDER BY created_at DESC
        """
        df = db.query_to_df(sql, tuple(params))

        if df.height > 0:
            df = df.with_columns(
                pl.col("view_scope").replace(VIEW_SCOPES).alias("scope_label"),
                pl.col("link_token").map_elements(
                    lambda t: f"?share={t}", return_dtype=str
                ).alias("share_url"),
            )
        return df

    def revoke_link(self, link_id: str) -> bool:
        try:
            sql = "UPDATE share_links SET expires_at = CURRENT_TIMESTAMP WHERE link_id = ?"
            db.execute(sql, (link_id,))
            return True
        except Exception:
            return False


permission_manager = PermissionManager()
share_link_manager = ShareLinkManager()
