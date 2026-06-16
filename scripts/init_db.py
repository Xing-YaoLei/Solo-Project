"""
数据库初始化脚本
用法: python scripts/init_db.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Base, engine, init_default_users


def init_database():
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")

    print("正在初始化默认用户...")
    created = init_default_users()
    print(f"默认用户初始化完成 (新增 {created} 个账号)")
    print("\n默认账号:")
    print("  管理层:   admin / admin123")
    print("  执行角色: worker / worker123")
    print("  药师:     pharmacist / pharm123")


if __name__ == "__main__":
    init_database()
