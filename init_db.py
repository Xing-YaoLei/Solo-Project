import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import init_db
from app.auth import create_default_users

if __name__ == "__main__":
    print("正在初始化数据库...")
    init_db()
    print("数据库表结构创建完成！")
    print("正在创建默认用户...")
    create_default_users()
    print("默认用户创建完成！")
    print("✅ 数据库初始化完成。")
