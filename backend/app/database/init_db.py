from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.connection import Base, engine, SessionLocal
from app.models.user import User


def init_db(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    
    user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER).first()
    if not user:
        user = User(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="系统管理员",
            role="admin",
            is_active=True,
            last_login_at=datetime.now(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ 已创建管理员用户: {settings.FIRST_SUPERUSER}")
    else:
        print(f"ℹ️  管理员用户已存在: {settings.FIRST_SUPERUSER}")

    worker_password_hash = get_password_hash("worker123")
    for i in range(1, 6):
        worker_email = f"worker{i}@example.com"
        worker = db.query(User).filter(User.email == worker_email).first()
        if not worker:
            worker = User(
                email=worker_email,
                hashed_password=worker_password_hash,
                full_name=f"维修员{i:02d}",
                role="worker",
                is_active=True,
            )
            db.add(worker)
            print(f"✅ 已创建维修员用户: {worker_email}")
    db.commit()


if __name__ == "__main__":
    print("=" * 50)
    print("  初始化数据库...")
    print("=" * 50)
    db = SessionLocal()
    try:
        init_db(db)
        print("")
        print("🎉 数据库初始化完成!")
        print("")
        print("默认账号:")
        print(f"  管理员: {settings.FIRST_SUPERUSER} / {settings.FIRST_SUPERUSER_PASSWORD}")
        print(f"  维修员: worker1-5@example.com / worker123")
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
