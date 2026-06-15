import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, Base
from app.models import *

Base.metadata.create_all(bind=engine)
print("数据库表创建完成!")
