from datetime import datetime, timedelta
from typing import Optional, List, Set, Dict, Any
import json
import secrets
import hashlib
from functools import wraps

from app.models import RoleEnum, User, SharedView
from app.database import SessionLocal


ROLE_HIERARCHY = {
    RoleEnum.ADMIN: 100,
    RoleEnum.MANAGER: 80,
    RoleEnum.FINANCE: 60,
    RoleEnum.SUPERVISOR: 50,
    RoleEnum.DESIGNER: 50,
    RoleEnum.SALES: 40,
    RoleEnum.VIEWER: 20,
}


VIEW_PERMISSIONS = {
    "funnel": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE,
               RoleEnum.SALES, RoleEnum.DESIGNER, RoleEnum.SUPERVISOR, RoleEnum.VIEWER],
    "reconciliation": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE],
    "contract_attachment": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE, RoleEnum.SALES],
    "document_detail": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE,
                        RoleEnum.DESIGNER, RoleEnum.SUPERVISOR],
    "approval_abnormal": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.SUPERVISOR],
    "payment_cycle": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE],
    "export": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE],
    "share_view": [RoleEnum.ADMIN, RoleEnum.MANAGER],
    "refresh": [RoleEnum.ADMIN, RoleEnum.MANAGER],
    "import_data": [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DESIGNER, RoleEnum.SUPERVISOR],
}


AMOUNT_SENSITIVE_ROLES = {RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.FINANCE}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def get_user(username: str) -> Optional[User]:
    db = SessionLocal()
    try:
        return db.query(User).filter(User.username == username).first()
    finally:
        db.close()


def authenticate(username: str, password: str) -> Optional[User]:
    user = get_user(username)
    if user and verify_password(password, user.hashed_password or "") and user.is_active:
        return user
    return None


def role_ge(user_role: RoleEnum, required_role: RoleEnum) -> bool:
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)


def has_view_permission(user_role: Optional[RoleEnum], view_name: str) -> bool:
    if user_role is None:
        return False
    if user_role == RoleEnum.ADMIN:
        return True
    allowed = VIEW_PERMISSIONS.get(view_name, [])
    return user_role in allowed


def can_view_amount(user_role: Optional[RoleEnum]) -> bool:
    if user_role is None:
        return False
    return user_role in AMOUNT_SENSITIVE_ROLES


def mask_amount(value: Optional[float], can_view: bool) -> str:
    if value is None:
        return "-"
    if can_view:
        return f"{value:,.2f}"
    return "***"


def create_default_users():
    db = SessionLocal()
    try:
        existing = db.query(User).count()
        if existing > 0:
            return

        default_users = [
            User(username="admin", full_name="系统管理员", email="admin@example.com",
                 role=RoleEnum.ADMIN, hashed_password=hash_password("admin123"), is_active=True),
            User(username="manager", full_name="项目经理", email="manager@example.com",
                 role=RoleEnum.MANAGER, hashed_password=hash_password("manager123"), is_active=True),
            User(username="finance", full_name="财务专员", email="finance@example.com",
                 role=RoleEnum.FINANCE, hashed_password=hash_password("finance123"), is_active=True),
            User(username="designer", full_name="设计师小王", email="designer@example.com",
                 role=RoleEnum.DESIGNER, hashed_password=hash_password("designer123"), is_active=True),
            User(username="supervisor", full_name="监理老李", email="supervisor@example.com",
                 role=RoleEnum.SUPERVISOR, hashed_password=hash_password("supervisor123"), is_active=True),
            User(username="sales", full_name="销售顾问", email="sales@example.com",
                 role=RoleEnum.SALES, hashed_password=hash_password("sales123"), is_active=True),
            User(username="viewer", full_name="只读用户", email="viewer@example.com",
                 role=RoleEnum.VIEWER, hashed_password=hash_password("viewer123"), is_active=True),
        ]
        db.add_all(default_users)
        db.commit()
    finally:
        db.close()


def create_shared_view(view_name: str, view_config: dict,
                       allowed_roles: List[str], created_by: int,
                       expires_days: int = 7) -> SharedView:
    db = SessionLocal()
    try:
        view_code = secrets.token_urlsafe(12)
        shared = SharedView(
            view_name=view_name,
            view_code=view_code,
            view_config=view_config,
            allowed_roles=[r.value if isinstance(r, RoleEnum) else r for r in allowed_roles],
            created_by=created_by,
            expires_at=datetime.now() + timedelta(days=expires_days),
            is_active=True
        )
        db.add(shared)
        db.commit()
        db.refresh(shared)
        return shared
    finally:
        db.close()


def validate_shared_view(view_code: str, user_role: Optional[RoleEnum]) -> Optional[Dict[str, Any]]:
    db = SessionLocal()
    try:
        shared = db.query(SharedView).filter(
            SharedView.view_code == view_code,
            SharedView.is_active == True
        ).first()

        if not shared:
            return None

        if shared.expires_at and shared.expires_at < datetime.now():
            return None

        allowed_roles = shared.allowed_roles or []
        if user_role and user_role.value not in allowed_roles:
            return None

        return {
            "id": shared.id,
            "name": shared.view_name,
            "code": shared.view_code,
            "config": shared.view_config or {},
            "allowed_roles": allowed_roles,
            "expires_at": shared.expires_at,
            "created_by": shared.created_by
        }
    finally:
        db.close()


def check_share_code_valid(view_code: str) -> Optional[Dict[str, Any]]:
    db = SessionLocal()
    try:
        shared = db.query(SharedView).filter(
            SharedView.view_code == view_code,
            SharedView.is_active == True
        ).first()

        if not shared:
            return None

        if shared.expires_at and shared.expires_at < datetime.now():
            return None

        return {
            "id": shared.id,
            "name": shared.view_name,
            "code": shared.view_code,
            "config": shared.view_config or {},
            "allowed_roles": shared.allowed_roles or [],
            "expires_at": shared.expires_at,
            "created_by": shared.created_by
        }
    finally:
        db.close()


def list_shared_views(created_by: Optional[int] = None) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        query = db.query(SharedView)
        if created_by:
            query = query.filter(SharedView.created_by == created_by)
        views = query.order_by(SharedView.created_at.desc()).all()
        return [
            {
                "id": v.id,
                "name": v.view_name,
                "code": v.view_code,
                "roles": v.allowed_roles,
                "expires_at": v.expires_at,
                "active": v.is_active,
                "created_at": v.created_at
            }
            for v in views
        ]
    finally:
        db.close()


def deactivate_shared_view(view_id: int) -> bool:
    db = SessionLocal()
    try:
        view = db.query(SharedView).filter(SharedView.id == view_id).first()
        if view:
            view.is_active = False
            db.commit()
            return True
        return False
    finally:
        db.close()
