"""
一键初始化数据库脚本
执行: python -m app.scripts.init_db
步骤: 1. 创建表  2. 写入种子数据
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import Base, engine
from app.models import *  # noqa: F401, F403
from app.scripts.seed_data import seed


def init_db():
    print("🚀 开始初始化数据库...")
    print(f"📡 数据库连接: {engine.url}")

    try:
        print("\n📋 创建数据表...")
        Base.metadata.create_all(bind=engine)
        print("✅ 数据表创建完成")

        print("\n🌱 写入种子数据...")
        seed()

        print("\n🎉 数据库初始化完成!")
        print("   可以使用 `uvicorn app.main:app --reload` 启动后端服务")
    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        print("\n💡 请确保:")
        print("   1. PostgreSQL 服务已启动")
        print("   2. 数据库 coffee_cleaning 已创建")
        print("   3. 用户名/密码正确 (默认 postgres/postgres)")
        print("   4. 可通过修改 .env 中的 DATABASE_URL 调整连接配置")
        sys.exit(1)


if __name__ == "__main__":
    init_db()
