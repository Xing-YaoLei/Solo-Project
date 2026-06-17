from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.connection import Base, engine
from app.models.user import User


def init_db(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    
    user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER).first()
    if not user:
        user = User(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="System Admin",
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
