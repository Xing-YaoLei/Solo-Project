from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, UserRole
from app.schemas import Token, UserResponse, UserCreate
from app.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import settings

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token)


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已存在")
    hashed_password = get_password_hash(user_data.password)
    try:
        role_enum = UserRole(user_data.role)
    except ValueError:
        role_enum = UserRole.TEACHER
    user = User(
        username=user_data.username,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        email=user_data.email,
        role=role_enum,
        department=user_data.department,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    role: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        try:
            query = query.where(User.role == UserRole(role))
        except ValueError:
            pass
    result = await db.execute(query)
    return result.scalars().all()
