from sqlalchemy.orm import Session
from datetime import timedelta

from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login(self, request: LoginRequest) -> LoginResponse:
        user = self.db.query(User).filter(User.username == request.username).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise ValueError("用户名或密码错误")

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )

        return LoginResponse(
            accessToken=access_token,
            user=UserInfo(
                id=user.id,
                username=user.username,
                role=user.role,
                name=user.name
            )
        )

    def get_user_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()
