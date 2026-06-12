from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import bcrypt

from src.data.duckdb_manager import DuckDBManager


ROLE_HIERARCHY = {
    "admin": {"admin", "area_manager", "store_manager", "viewer"},
    "area_manager": {"area_manager", "store_manager", "viewer"},
    "store_manager": {"store_manager", "viewer"},
    "viewer": {"viewer"},
}

PERMISSIONS = {
    "admin": {
        "view_all_stores": True,
        "view_review_detail": True,
        "edit_review": True,
        "share_dashboard": True,
        "manage_metrics": True,
        "refresh_data": True,
        "view_exception": True,
    },
    "area_manager": {
        "view_all_stores": True,
        "view_review_detail": True,
        "edit_review": True,
        "share_dashboard": True,
        "manage_metrics": False,
        "refresh_data": True,
        "view_exception": True,
    },
    "store_manager": {
        "view_all_stores": False,
        "view_review_detail": True,
        "edit_review": False,
        "share_dashboard": False,
        "manage_metrics": False,
        "refresh_data": False,
        "view_exception": True,
    },
    "viewer": {
        "view_all_stores": False,
        "view_review_detail": False,
        "edit_review": False,
        "share_dashboard": False,
        "manage_metrics": False,
        "refresh_data": False,
        "view_exception": False,
    },
}


@dataclass
class User:
    username: str
    role: str
    stores: list[str] = field(default_factory=list)

    def has_permission(self, perm: str) -> bool:
        if perm == "view_all_stores":
            if self.role == "admin":
                return True
            return self.stores is None or len(self.stores) == 0
        return PERMISSIONS.get(self.role, {}).get(perm, False)

    def can_access_store(self, store_id: str) -> bool:
        if self.role == "admin":
            return True
        if self.stores and len(self.stores) > 0:
            return store_id in self.stores
        return self.has_permission("view_all_stores")

    def can_access_stores(self, store_ids: list[str]) -> list[str]:
        if self.role == "admin":
            return list(store_ids)
        if self.stores and len(self.stores) > 0:
            return [sid for sid in store_ids if sid in self.stores]
        if self.has_permission("view_all_stores"):
            return list(store_ids)
        return []


DEFAULT_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "role": "admin",
        "stores": [],
    },
    {
        "username": "area01",
        "password": "area123",
        "role": "area_manager",
        "stores": ["S001", "S002", "S003"],
    },
    {
        "username": "store01",
        "password": "store123",
        "role": "store_manager",
        "stores": ["S001"],
    },
    {
        "username": "viewer",
        "password": "viewer123",
        "role": "viewer",
        "stores": ["S001", "S002"],
    },
]


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def init_default_users() -> None:
    db = DuckDBManager()
    for u in DEFAULT_USERS:
        existing = db.query_df(
            "SELECT username FROM users WHERE username = ?",
            [u["username"]],
        )
        if existing.is_empty():
            db.execute(
                "INSERT INTO users (username, password_hash, role, stores) VALUES (?, ?, ?, ?)",
                [u["username"], _hash_password(u["password"]), u["role"], ",".join(u["stores"])],
            )


def authenticate(username: str, password: str) -> Optional[User]:
    db = DuckDBManager()
    row = db.query_df(
        "SELECT username, password_hash, role, stores FROM users WHERE username = ?",
        [username],
    )
    if row.is_empty():
        return None
    r = row.row(0, named=True)
    if not _verify_password(password, r["password_hash"]):
        return None
    stores = [s for s in (r["stores"] or "").split(",") if s]
    return User(username=r["username"], role=r["role"], stores=stores)


def filter_data_by_permission(user: User, df, store_id_col: str = "store_id"):
    import polars as pl
    if df is None or not hasattr(df, "is_empty") or df.is_empty():
        return df
    if user.has_permission("view_all_stores"):
        return df
    if store_id_col in df.columns:
        return df.filter(pl.col(store_id_col).is_in(user.stores))
    return df
