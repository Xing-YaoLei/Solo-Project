import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import polars as pl

from ..config import Role, ROLE_PERMISSIONS, AppConfig
from ..data_sync.duckdb_store import DuckDBStore


@dataclass
class UserContext:
    user_id: str
    username: str
    role: str
    region: Optional[str] = None
    tenant_id: Optional[str] = None

    def has_permission(self, perm: str) -> bool:
        perms = ROLE_PERMISSIONS.get(self.role, {})
        return perms.get(perm, False)


class PermissionManager:
    def __init__(self, db: Optional[DuckDBStore] = None):
        self.db = db or DuckDBStore()

    def get_user(self, username: str) -> Optional[UserContext]:
        result = self.db.query("SELECT * FROM users WHERE username = ?", [username])
        if result.is_empty():
            return None
        row = result.row(0, named=True)
        return UserContext(
            user_id=row["id"],
            username=row["username"],
            role=row["role"],
            region=row.get("region"),
            tenant_id=row.get("tenant_id"),
        )

    def create_user(
        self,
        username: str,
        role: str,
        region: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> UserContext:
        user_id = str(uuid.uuid4())[:8]
        self.db.execute(
            """
            INSERT INTO users (id, username, role, region, tenant_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [user_id, username, role, region, tenant_id, datetime.now()],
        )
        return UserContext(
            user_id=user_id, username=username, role=role, region=region, tenant_id=tenant_id
        )

    def create_share_link(
        self,
        created_by: str,
        role: str = Role.EXTERNAL,
        tenant_id: Optional[str] = None,
        region: Optional[str] = None,
        expires_days: int = 7,
    ) -> str:
        token_raw = f"{created_by}|{role}|{tenant_id or ''}|{region or ''}|{datetime.now().isoformat()}"
        token = hmac.new(
            AppConfig.SECRET_KEY.encode("utf-8"), token_raw.encode("utf-8"), hashlib.sha256
        ).hexdigest()[:16]

        link_id = str(uuid.uuid4())[:8]
        expires_at = datetime.now() + timedelta(days=expires_days)
        self.db.execute(
            """
            INSERT INTO shared_links (id, token, role, created_by, tenant_id, region, expires_at, view_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """,
            [link_id, token, role, created_by, tenant_id, region, expires_at, datetime.now()],
        )
        return token

    def validate_share_link(self, token: str) -> Optional[UserContext]:
        result = self.db.query("SELECT * FROM shared_links WHERE token = ?", [token])
        if result.is_empty():
            return None
        row = result.row(0, named=True)

        if row["expires_at"] and row["expires_at"] < datetime.now():
            return None

        self.db.execute("UPDATE shared_links SET view_count = view_count + 1 WHERE token = ?", [token])

        return UserContext(
            user_id=f"share_{row['id']}",
            username=f"shared_{token[:6]}",
            role=row["role"],
            region=row.get("region"),
            tenant_id=row.get("tenant_id"),
        )

    def list_share_links(self, created_by: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM shared_links"
        params = []
        if created_by:
            sql += " WHERE created_by = ?"
            params.append(created_by)
        sql += " ORDER BY created_at DESC"
        return self.db.query(sql, params)

    def revoke_share_link(self, token: str) -> bool:
        result = self.db.execute("DELETE FROM shared_links WHERE token = ?", [token])
        return result.rowcount > 0


class DataFilter:
    def __init__(self, user: UserContext):
        self.user = user

    def apply_region_filter(self, df: pl.DataFrame, region_col: str = "region") -> pl.DataFrame:
        if self.user.has_permission("view_all_regions"):
            return df
        if self.user.region and region_col in df.columns:
            return df.filter(pl.col(region_col) == self.user.region)
        if self.user.tenant_id and "tenant_id" in df.columns:
            return df.filter(pl.col("tenant_id") == self.user.tenant_id)
        return df.filter(pl.lit(False))

    def apply_sensitive_filter(self, df: pl.DataFrame) -> pl.DataFrame:
        if self.user.has_permission("view_sensitive"):
            return df
        sensitive_cols = ["amount", "monthly_rent", "payment_type", "tenant_id", "tenant_name"]
        existing_sensitive = [c for c in sensitive_cols if c in df.columns]
        if existing_sensitive:
            return df.drop(existing_sensitive)
        return df

    def apply_payment_filter(self, df: pl.DataFrame) -> pl.DataFrame:
        if self.user.has_permission("view_payment"):
            return df
        payment_cols = [
            "amount",
            "payment_type",
            "payment_date",
            "monthly_rent",
            "total_amount",
            "avg_amount",
        ]
        existing_payment = [c for c in payment_cols if c in df.columns]
        if existing_payment:
            return df.drop(existing_payment)
        return df

    def apply_contract_filter(self, df: pl.DataFrame) -> pl.DataFrame:
        if self.user.has_permission("view_contract"):
            return df
        contract_cols = ["contract_start", "contract_end", "monthly_rent", "cleaning_frequency"]
        existing_contract = [c for c in contract_cols if c in df.columns]
        if existing_contract:
            return df.drop(existing_contract)
        return df

    def apply_all(self, df: pl.DataFrame) -> pl.DataFrame:
        df = self.apply_region_filter(df)
        df = self.apply_sensitive_filter(df)
        df = self.apply_payment_filter(df)
        df = self.apply_contract_filter(df)
        return df
