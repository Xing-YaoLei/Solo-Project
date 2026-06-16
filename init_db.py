import sys
from database import Base, engine
from database.models import (
    Patient,
    Appointment,
    PaymentDetail,
    ImageAttachment,
    AnomalyMarker,
    Remark,
    HisCaliberChange,
    RefreshLog,
)


def init_database():
    print("开始初始化数据库...")
    try:
        Base.metadata.create_all(bind=engine)
        print("数据库表创建成功！")
        print("已创建的表:")
        for table in Base.metadata.tables.keys():
            print(f"  - {table}")
        return True
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
