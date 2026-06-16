"""
系统种子数据：默认用户创建等。
独立于 Dash/Flask 之外，保证脚本层（init_db.py）可直接导入执行。
"""
import hashlib
from app.models import get_session, User, UserRole


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _verify_password(password: str, hashed: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed


DEFAULT_USERS = [
    {"username": "admin", "password": "admin123", "full_name": "系统管理员", "role": UserRole.MANAGEMENT},
    {"username": "worker", "password": "worker123", "full_name": "回访专员", "role": UserRole.EXECUTOR},
    {"username": "pharmacist", "password": "pharm123", "full_name": "执业药师", "role": UserRole.PHARMACIST},
]


def init_default_users() -> int:
    """创建3个默认账号（幂等：用户已存在则跳过）。返回新增数。"""
    sess = get_session()
    created = 0
    try:
        for u in DEFAULT_USERS:
            existing = sess.query(User).filter(User.username == u["username"]).first()
            if not existing:
                user = User(
                    username=u["username"],
                    password_hash=_hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True,
                )
                sess.add(user)
                created += 1
        sess.commit()
        return created
    finally:
        sess.close()


def verify_user_credentials(username: str, password: str):
    """验证登录凭证，成功返回 User，失败返回 None。"""
    sess = get_session()
    try:
        user = sess.query(User).filter(
            User.username == username,
            User.is_active == True,
        ).first()
        if user and _verify_password(password, user.password_hash):
            return user
        return None
    finally:
        sess.close()
