import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import Base, engine
from database import models

def init_database():
    print("正在创建数据库表结构...")
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成！")
    print("已创建的表:")
    for table in Base.metadata.tables.keys():
        print(f"  - {table}")

if __name__ == "__main__":
    init_database()
