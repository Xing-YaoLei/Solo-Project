from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=dict)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_login.username).first()
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        },
    }


@router.post("/register", response_model=dict)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user_create.username) | (User.email == user_create.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在",
        )
    user = User(
        username=user_create.username,
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=get_password_hash(user_create.password),
        role=user_create.role,
        department=user_create.department,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "code": 200,
        "message": "注册成功",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        },
    }


@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "code": 200,
        "message": "获取成功",
        "data": current_user,
    }
