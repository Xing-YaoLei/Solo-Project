from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.models import User, RoleEnum
from ..core.security import decode_token
from ..schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    token_data = TokenData(username=username, role=payload.get("role"))
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return user


def require_roles(*roles: RoleEnum):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles and current_user.role != RoleEnum.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要以下角色之一: {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


def verify_share_token_role(token: str, required_role: RoleEnum, db: Session) -> bool:
    from ..models.models import ShareToken
    from datetime import datetime

    share = db.query(ShareToken).filter(
        ShareToken.token == token,
        ShareToken.is_active == True
    ).first()

    if not share:
        return False
    if share.expires_at and share.expires_at < datetime.utcnow():
        return False
    if share.allowed_role and share.allowed_role.value != required_role.value:
        role_priority = {
            RoleEnum.ADMIN: 4,
            RoleEnum.OPERATION_MANAGER: 3,
            RoleEnum.ANALYST: 2,
            RoleEnum.VIEWER: 1,
        }
        if role_priority.get(required_role, 0) < role_priority.get(share.allowed_role, 0):
            return False
    return True
