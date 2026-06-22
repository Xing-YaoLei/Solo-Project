from sqlalchemy.orm import Session
from app.models import User, UserRole
from app.core.security import get_password_hash


def init_default_user(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        print("✅ 默认管理员用户已创建: admin / admin123")

    auditor = db.query(User).filter(User.username == "auditor").first()
    if not auditor:
        auditor = User(
            username="auditor",
            email="auditor@example.com",
            hashed_password=get_password_hash("auditor123"),
            role=UserRole.AUDITOR,
        )
        db.add(auditor)
        print("✅ 默认审计员用户已创建: auditor / auditor123")

    db.commit()
