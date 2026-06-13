import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import User, UserRole, Tag, CourseStatus
from datetime import date


def init_db():
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成!")

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("正在初始化默认用户...")
            admin = User(
                username="admin",
                email="admin@fitness.com",
                full_name="系统管理员",
                phone="13800000001",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("admin123")
            )
            trainer1 = User(
                username="trainer1",
                email="trainer1@fitness.com",
                full_name="张教练",
                phone="13800000002",
                role=UserRole.TRAINER,
                hashed_password=get_password_hash("trainer123")
            )
            trainer2 = User(
                username="trainer2",
                email="trainer2@fitness.com",
                full_name="李教练",
                phone="13800000003",
                role=UserRole.TRAINER,
                hashed_password=get_password_hash("trainer123")
            )
            member1 = User(
                username="member1",
                email="member1@fitness.com",
                full_name="王小明",
                phone="13900000001",
                role=UserRole.MEMBER,
                hashed_password=get_password_hash("member123")
            )
            member2 = User(
                username="member2",
                email="member2@fitness.com",
                full_name="李小红",
                phone="13900000002",
                role=UserRole.MEMBER,
                hashed_password=get_password_hash("member123")
            )
            member3 = User(
                username="member3",
                email="member3@fitness.com",
                full_name="赵大伟",
                phone="13900000003",
                role=UserRole.MEMBER,
                hashed_password=get_password_hash("member123")
            )
            manager = User(
                username="manager",
                email="manager@fitness.com",
                full_name="运营经理",
                phone="13800000004",
                role=UserRole.MANAGER,
                hashed_password=get_password_hash("manager123")
            )
            db.add_all([admin, trainer1, trainer2, member1, member2, member3, manager])
            print("默认用户初始化完成!")

        if db.query(Tag).count() == 0:
            print("正在初始化默认标签...")
            default_tags = [
                Tag(name="增肌", color="#EF4444"),
                Tag(name="减脂", color="#10B981"),
                Tag(name="塑形", color="#3B82F6"),
                Tag(name="力量训练", color="#8B5CF6"),
                Tag(name="有氧", color="#F59E0B"),
                Tag(name="柔韧", color="#EC4899"),
                Tag(name="核心", color="#06B6D4"),
                Tag(name="下肢", color="#84CC16"),
                Tag(name="上肢", color="#F97316"),
                Tag(name="康复", color="#6366F1"),
            ]
            db.add_all(default_tags)
            print("默认标签初始化完成!")

        db.commit()
        print("\n默认账号:")
        print("管理员: admin / admin123")
        print("教练: trainer1 / trainer123")
        print("学员: member1 / member123")
        print("经理: manager / manager123")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
