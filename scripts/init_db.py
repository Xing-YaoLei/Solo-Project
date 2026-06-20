import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import Base, engine, SessionLocal
from models import UserAccount, DataBatch, CameraStats, GateRecord, MerchantTransaction, ReservationFunnel, CapacityRule


def init_database():
    print("正在创建数据库表...")
    try:
        Base.metadata.drop_all(bind=engine)
        print("已清理旧表")
    except Exception:
        pass

    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")

    db = SessionLocal()
    try:
        admin = UserAccount(
            username="admin",
            full_name="系统管理员",
            role="management",
            assigned_zone="",
            phone="13800000001",
            email="admin@scenic.com",
            is_active=True,
        )
        admin.set_password("admin123")
        db.add(admin)

        staff = UserAccount(
            username="staff",
            full_name="张运维",
            role="frontline",
            assigned_zone="主入口区,核心景区A",
            phone="13800000002",
            email="staff@scenic.com",
            is_active=True,
        )
        staff.set_password("staff123")
        db.add(staff)

        staff2 = UserAccount(
            username="staff2",
            full_name="李运营",
            role="frontline",
            assigned_zone="山顶观景区,湖滨休闲区",
            phone="13800000003",
            is_active=True,
        )
        staff2.set_password("staff123")
        db.add(staff2)

        db.commit()
        print("默认用户创建完成:")
        print("  管理层: admin / admin123 (全局权限)")
        print("  一线人员: staff / staff123 (主入口区,核心景区A)")
        print("  一线人员: staff2 / staff123 (山顶观景区,湖滨休闲区)")
    except Exception as e:
        db.rollback()
        print(f"创建用户出错: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
    print("\n初始化完成!")
