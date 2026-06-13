import functools
from typing import Callable

from flask import session

ROLE_PERMISSIONS = {
    "admin": {"view_all_stores", "export_csv", "share_view", "manage_users", "view_anomaly", "view_cashier_detail"},
    "store_manager": {"view_own_store", "export_csv", "share_view", "view_anomaly", "view_cashier_detail"},
    "staff": {"view_own_store", "export_csv", "view_anomaly"},
    "viewer": {"view_own_store"},
}

PERMISSION_LABELS = {
    "view_all_stores": "查看所有门店",
    "view_own_store": "查看所属门店",
    "export_csv": "导出CSV",
    "share_view": "分享视图",
    "manage_users": "管理用户",
    "view_anomaly": "查看异常标注",
    "view_cashier_detail": "查看收银流水明细",
}


def get_current_user_role() -> str:
    return session.get("user_role", "viewer")


def get_current_user_store_id() -> str | None:
    return session.get("store_id")


def has_permission(permission: str) -> bool:
    role = get_current_user_role()
    return permission in ROLE_PERMISSIONS.get(role, set())


def require_permission(*permissions: str):
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            role = get_current_user_role()
            role_perms = ROLE_PERMISSIONS.get(role, set())
            for perm in permissions:
                if perm not in role_perms:
                    return {"error": f"权限不足: 缺少 {PERMISSION_LABELS.get(perm, perm)}"}, 403
            return func(*args, **kwargs)
        return wrapper
    return decorator


def enforce_store_scope(store_id: str) -> str | None:
    role = get_current_user_role()
    if role == "admin":
        return store_id
    user_store = get_current_user_store_id()
    if user_store and store_id != user_store:
        return None
    return store_id


def validate_share_access(share_token: str | None, required_role: str = "viewer") -> bool:
    if not share_token:
        return False

    share_info = session.get("share_context")
    if not share_info:
        return False

    if share_info.get("token") != share_token:
        return False

    allowed_role = share_info.get("role", "viewer")
    role_hierarchy = {"admin": 4, "store_manager": 3, "staff": 2, "viewer": 1}
    if role_hierarchy.get(allowed_role, 0) < role_hierarchy.get(required_role, 0):
        return False

    return True


def get_visible_store_id(requested_store_id: str | None = None) -> str | None:
    role = get_current_user_role()

    if role == "admin":
        return requested_store_id or get_current_user_store_id()

    user_store = get_current_user_store_id()
    if requested_store_id and requested_store_id != user_store:
        return None
    return user_store
