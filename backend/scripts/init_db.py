import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session_maker, Base, engine
from app.models.user import User, UserRole
from app.security import hash_password


DEFAULT_USERS = [
    {
        "username": "admin",
        "email": "admin@legal.com",
        "password": "admin123",
        "full_name": "系统管理员",
        "role": UserRole.PARTNER,
        "phone": "13800000001",
        "department": "管理部",
    },
    {
        "username": "lawyer1",
        "email": "lawyer1@legal.com",
        "password": "lawyer123",
        "full_name": "张律师",
        "role": UserRole.LAWYER,
        "phone": "13800000002",
        "department": "诉讼部",
    },
    {
        "username": "assistant1",
        "email": "assistant1@legal.com",
        "password": "assist123",
        "full_name": "李助理",
        "role": UserRole.ASSISTANT,
        "phone": "13800000003",
        "department": "行政部",
    },
    {
        "username": "client1",
        "email": "client1@legal.com",
        "password": "client123",
        "full_name": "王先生",
        "role": UserRole.CLIENT,
        "phone": "13900000001",
        "department": None,
    },
]


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        for user_data in DEFAULT_USERS:
            from sqlalchemy import select

            result = await db.execute(
                select(User).where(User.username == user_data["username"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"用户 {user_data['username']} 已存在，跳过")
                continue

            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                phone=user_data["phone"],
                department=user_data["department"],
            )
            db.add(user)
            print(f"创建用户: {user_data['username']} / {user_data['password']} ({user_data['full_name']})")

        await db.commit()

    print("\n初始化完成!")
    print("测试账号:")
    for u in DEFAULT_USERS:
        print(f"  {u['role'].value}: {u['username']} / {u['password']} ({u['full_name']})")


if __name__ == "__main__":
    asyncio.run(init_db())
