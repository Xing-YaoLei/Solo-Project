import functools
import hashlib
import secrets
import time
from datetime import datetime, timedelta
from typing import Callable

from flask import jsonify, request, session

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

ROLE_LABELS = {
    "admin": "管理员",
    "store_manager": "店长",
    "staff": "员工",
    "viewer": "查看者",
}

ROLE_HIERARCHY = {"admin": 4, "store_manager": 3, "staff": 2, "viewer": 1}

_share_token_store: dict[str, dict] = {}


def get_current_user_role() -> str:
    return session.get("user_role", "viewer")


def is_authenticated() -> bool:
    return session.get("login_time") is not None


def is_share_mode() -> bool:
    return session.get("share_context") is not None


def get_share_role() -> str | None:
    ctx = session.get("share_context")
    return ctx.get("role") if isinstance(ctx, dict) else None


def get_current_user_store_id() -> str | None:
    return session.get("store_id")


def get_current_username() -> str | None:
    return session.get("username")


def set_user_session(username: str, role: str, store_id: str | None = None) -> None:
    session["username"] = username
    session["user_role"] = role
    session["store_id"] = store_id
    session["login_time"] = datetime.utcnow().isoformat()


def clear_user_session() -> None:
    for k in ("username", "user_role", "store_id", "login_time", "share_context"):
        session.pop(k, None)


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
                    return jsonify({"error": f"权限不足: 缺少 {PERMISSION_LABELS.get(perm, perm)}"}), 403
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


def _generate_share_token() -> str:
    raw = f"{secrets.token_urlsafe(16)}{time.time()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def create_share_link(
    target_role: str,
    target_store_id: str | None = None,
    expires_minutes: int = 60,
) -> dict:
    owner_role = get_current_user_role()
    owner_store = get_current_user_store_id()
    owner_perms = ROLE_PERMISSIONS.get(owner_role, set())

    if "share_view" not in owner_perms:
        return {"error": "当前角色无权分享视图", "success": False}

    owner_level = ROLE_HIERARCHY.get(owner_role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    if target_level > owner_level:
        return {
            "error": f"分享目标角色({ROLE_LABELS.get(target_role, target_role)})权限不能高于分享者({ROLE_LABELS.get(owner_role, owner_role)})",
            "success": False,
        }

    store_to_share = target_store_id or owner_store
    if owner_role != "admin" and store_to_share != owner_store:
        return {"error": "仅管理员可分享其他门店视图", "success": False}

    token = _generate_share_token()
    expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)

    ctx = {
        "token": token,
        "role": target_role,
        "store_id": store_to_share,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "created_by": get_current_username(),
        "owner_role": owner_role,
        "permissions": sorted(ROLE_PERMISSIONS.get(target_role, set())),
    }

    _share_token_store[token] = ctx

    share_url = f"{request.host_url.rstrip('/')}/?share_token={token}"

    return {
        "success": True,
        "share_token": token,
        "share_url": share_url,
        "target_role": target_role,
        "target_role_label": ROLE_LABELS.get(target_role, target_role),
        "store_id": store_to_share,
        "expires_at": expires_at.isoformat(),
        "permissions": ctx["permissions"],
        "permission_labels": [PERMISSION_LABELS.get(p, p) for p in ctx["permissions"]],
    }


def _lookup_share_token(token: str) -> dict | None:
    ctx = _share_token_store.get(token)
    if not ctx:
        return None
    try:
        expires = datetime.fromisoformat(ctx["expires_at"])
    except (ValueError, KeyError):
        return None
    if expires < datetime.utcnow():
        _share_token_store.pop(token, None)
        return None
    return ctx


def validate_share_access(share_token: str | None, required_role: str = "viewer") -> bool:
    if not share_token:
        return False

    share_ctx = _lookup_share_token(share_token)
    if not share_ctx:
        return False

    allowed_role = share_ctx.get("role", "viewer")
    owner_role = share_ctx.get("owner_role", "viewer")
    allowed_level = ROLE_HIERARCHY.get(allowed_role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 0)
    owner_level = ROLE_HIERARCHY.get(owner_role, 0)

    if allowed_level > owner_level:
        return False

    if allowed_level < required_level:
        return False

    session["share_context"] = share_ctx
    session["user_role"] = allowed_role
    session["store_id"] = share_ctx.get("store_id")

    return True


def get_share_info(share_token: str) -> dict | None:
    return _lookup_share_token(share_token)


def get_visible_store_id(requested_store_id: str | None = None) -> str | None:
    role = get_current_user_role()

    if role == "admin":
        return requested_store_id or get_current_user_store_id()

    user_store = get_current_user_store_id()
    if requested_store_id and requested_store_id != user_store:
        return None
    return user_store


def list_all_roles() -> list[dict]:
    return [
        {
            "role": role,
            "label": ROLE_LABELS.get(role, role),
            "level": ROLE_HIERARCHY.get(role, 0),
            "permissions": sorted(list(perms)),
        }
        for role, perms in ROLE_PERMISSIONS.items()
    ]
