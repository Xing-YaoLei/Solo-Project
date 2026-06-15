from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((salt + password).encode("utf-8"))
    return f"{salt}${hash_obj.hexdigest()}"


def _verify_password(password: str, hashed: str) -> bool:
    try:
        salt, hash_val = hashed.split("$", 1)
        hash_obj = hashlib.sha256((salt + password).encode("utf-8"))
        return hash_obj.hexdigest() == hash_val
    except Exception:
        return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if "$" in hashed_password:
        return _verify_password(plain_password, hashed_password)
    return False


def get_password_hash(password: str) -> str:
    return _hash_password(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    except (ValueError, TypeError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户已被禁用")
    return user


def require_roles(*roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要角色: {', '.join([r.value for r in roles])}",
            )
        return current_user
    return role_checker
