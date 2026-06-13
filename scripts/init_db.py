import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import engine, Base
from models import *


def init_db():
    print("开始创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")


if __name__ == "__main__":
    init_db()
