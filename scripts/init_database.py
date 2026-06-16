#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import init_db, engine
from database.models import Base


def main():
    print("🏥 初始化康复中心数据库...")

    try:
        print("📋 创建数据库表...")
        init_db()
        print("✅ 数据库表创建成功！")

        print("\n📊 已创建的表:")
        for table in Base.metadata.tables.keys():
            print(f"   - {table}")

        print("\n🎉 数据库初始化完成！")
        print("💡 下一步: 运行 `python scripts/mock_data_generator.py` 生成模拟数据")
        print("💡 或者: 配置PostgreSQL连接并导入真实数据")

    except Exception as e:
        print(f"❌ 初始化数据库时出错: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
