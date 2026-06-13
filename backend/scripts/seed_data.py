import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, RoleEnum, Store, Product,
)


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already has data, skipping seed.")
            return

        users = [
            User(username="admin", full_name="系统管理员", hashed_password=get_password_hash("admin123"), role=RoleEnum.ADMIN, phone="13800000000"),
            User(username="warehouse01", full_name="仓管张师傅", hashed_password=get_password_hash("123456"), role=RoleEnum.WAREHOUSE, phone="13800000001"),
            User(username="driver01", full_name="司机李师傅", hashed_password=get_password_hash("123456"), role=RoleEnum.DRIVER, phone="13800000002"),
            User(username="qc01", full_name="品控王姐", hashed_password=get_password_hash("123456"), role=RoleEnum.QC, phone="13800000003"),
            User(username="purchaser01", full_name="采购刘经理", hashed_password=get_password_hash("123456"), role=RoleEnum.PURCHASER, phone="13800000004"),
        ]
        db.add_all(users)

        stores = [
            Store(code="ST001", name="生鲜冷链-朝阳店", address="北京市朝阳区建国路88号", phone="010-10000001"),
            Store(code="ST002", name="生鲜冷链-海淀店", address="北京市海淀区中关村大街1号", phone="010-10000002"),
            Store(code="ST003", name="生鲜冷链-西城店", address="北京市西城区金融街9号", phone="010-10000003"),
            Store(code="ST004", name="生鲜冷链-东城店", address="北京市东城区王府井大街138号", phone="010-10000004"),
            Store(code="ST005", name="生鲜冷链-丰台店", address="北京市丰台区南三环西路16号", phone="010-10000005"),
        ]
        db.add_all(stores)

        products = [
            Product(sku="SKU001", name="进口冰鲜三文鱼", category="水产", unit="箱", min_temp=-2.0, max_temp=2.0),
            Product(sku="SKU002", name="澳洲和牛牛排", category="肉类", unit="箱", min_temp=-18.0, max_temp=-12.0),
            Product(sku="SKU003", name="有机蔬菜礼盒", category="蔬菜", unit="箱", min_temp=0.0, max_temp=4.0),
            Product(sku="SKU004", name="新鲜草莓", category="水果", unit="箱", min_temp=0.0, max_temp=6.0),
            Product(sku="SKU005", name="巴氏杀菌鲜奶", category="乳制品", unit="箱", min_temp=2.0, max_temp=6.0),
            Product(sku="SKU006", name="冻虾仁", category="水产", unit="箱", min_temp=-20.0, max_temp=-15.0),
            Product(sku="SKU007", name="法式鹅肝", category="肉类", unit="箱", min_temp=-18.0, max_temp=-10.0),
            Product(sku="SKU008", name="有机蓝莓", category="水果", unit="箱", min_temp=0.0, max_temp=4.0),
        ]
        db.add_all(products)

        db.commit()
        print("Seed data inserted successfully!")
        print("Default accounts:")
        print("  admin / admin123 (管理员)")
        print("  warehouse01 / 123456 (仓管)")
        print("  driver01 / 123456 (司机)")
        print("  qc01 / 123456 (品控)")
        print("  purchaser01 / 123456 (采购)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
