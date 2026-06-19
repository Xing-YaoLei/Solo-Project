#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.database import engine, Base
from data.models import (
    Property, RoomStatus, OTAOrder, PaymentTransaction,
    DoorLockRecord, CleaningTask, Note, SyncLog, DataAnomaly
)


def init_database():
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")
    print("\n已创建的表:")
    for table in Base.metadata.tables.keys():
        print(f"  - {table}")


if __name__ == "__main__":
    init_database()
