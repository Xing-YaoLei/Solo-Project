import os
import sys
from datetime import date, timedelta, datetime
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models import (
    Package, PriceRule, StayDate, PackageInventory, Order,
    OrderStatus, VerificationStatus, DepositStatus
)
from app.services import (
    PackageService, PriceRuleService, StayDateService, InventoryService,
    OrderService, OrderCreate
)


def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🚀 开始种子数据初始化...")

        if db.query(Package).count() > 0:
            print("ℹ️  已有数据，跳过初始化")
            return

        pkg1_data = {
            "name": "山景豪华大床房 · 含双早+双人下午茶",
            "description": "180°山景落地窗，独立阳台，配套温泉SPA体验一次",
            "homestay_name": "云隐山居",
            "room_type": "豪华大床房",
            "max_guests": 2,
            "base_price": Decimal("888.00"),
            "is_active": True
        }
        pkg2_data = {
            "name": "亲子家庭房 · 三早+儿童乐园+亲子烘焙课",
            "description": "双床+儿童帐篷，专属儿童浴袍牙刷，亲子活动体验",
            "homestay_name": "云隐山居",
            "room_type": "亲子家庭房",
            "max_guests": 4,
            "base_price": Decimal("1288.00"),
            "is_active": True
        }
        pkg3_data = {
            "name": "海景情侣套房 · 双早+浪漫晚餐+游艇出海",
            "description": "一线海景浴缸，浪漫布置，游艇出海1小时体验",
            "homestay_name": "听海民宿",
            "room_type": "海景情侣套房",
            "max_guests": 2,
            "base_price": Decimal("1888.00"),
            "is_active": True
        }
        p1 = PackageService.create(db, type('O', (), pkg1_data)())
        p2 = PackageService.create(db, type('O', (), pkg2_data)())
        p3 = PackageService.create(db, type('O', (), pkg3_data)())

        from app.schemas import PackageCreate
        p1 = PackageService.create(db, PackageCreate(**pkg1_data))
        p2 = PackageService.create(db, PackageCreate(**pkg2_data))
        p3 = PackageService.create(db, PackageCreate(**pkg3_data))
        db.flush()
        print(f"✅ 创建套餐 {p1.name}, {p2.name}, {p3.name}")

        from app.schemas import PriceRuleCreate
        rules = [
            PriceRuleCreate(package_id=p1.id, rule_name="平日价", rule_type="weekday",
                            price_adjustment_type="fixed", price_adjustment_value=Decimal("0"),
                            priority=1),
            PriceRuleCreate(package_id=p1.id, rule_name="周末加价", rule_type="weekend",
                            price_adjustment_type="fixed", price_adjustment_value=Decimal("200"),
                            priority=2),
            PriceRuleCreate(package_id=p2.id, rule_name="平日价", rule_type="weekday",
                            price_adjustment_type="fixed", price_adjustment_value=Decimal("0"),
                            priority=1),
            PriceRuleCreate(package_id=p2.id, rule_name="暑期旺季加价", rule_type="custom_date",
                            start_date=date(2026, 7, 1), end_date=date(2026, 8, 31),
                            price_adjustment_type="percentage", price_adjustment_value=Decimal("20"),
                            priority=3),
            PriceRuleCreate(package_id=p3.id, rule_name="平日价", rule_type="weekday",
                            price_adjustment_type="fixed", price_adjustment_value=Decimal("0"),
                            priority=1),
            PriceRuleCreate(package_id=p3.id, rule_name="节假日加价", rule_type="weekend",
                            price_adjustment_type="fixed", price_adjustment_value=Decimal("400"),
                            priority=2),
        ]
        for r in rules:
            PriceRuleService.create(db, r)
        print(f"✅ 创建价格规则 {len(rules)} 条")

        today = date.today()
        for pkg in [p1, p2, p3]:
            sds = StayDateService.bulk_create(
                db, pkg.id, today, today + timedelta(days=89)
            )
            print(f"✅ 套餐 {pkg.name} 创建入住日期 {len(sds)} 天")

            for sd in sds:
                wd = sd.stay_date.weekday()
                base = pkg.base_price
                extra = Decimal("200") if wd in [5, 6] else Decimal("0")
                inv_obj = type('I', (), {
                    "package_id": pkg.id,
                    "stay_date_id": sd.id,
                    "inventory_date": sd.stay_date,
                    "total_quantity": 3 if pkg.id == p3.id else 5,
                    "sold_quantity": 0,
                    "reserved_quantity": 0,
                    "unit_price": base + extra
                })()
                from app.schemas import PackageInventoryCreate
                inv_obj = PackageInventoryCreate(
                    package_id=pkg.id,
                    stay_date_id=sd.id,
                    inventory_date=sd.stay_date,
                    total_quantity=3 if pkg.id == p3.id else 5,
                    sold_quantity=0,
                    reserved_quantity=0,
                    unit_price=base + extra
                )
                InventoryService.create(db, inv_obj)

        for i in range(3):
            inv = db.query(PackageInventory).filter(
                PackageInventory.package_id == p1.id
            ).offset(i + 5).first()
            if inv:
                inv.sold_quantity = inv.total_quantity
        print(f"✅ 创建套餐库存，设置部分超卖以触发异常单")

        customer_templates = [
            ("张三", "13800138001", None, p1, Decimal("1976.00"), Decimal("500"), 2),
            ("李四一家", "13900139002", None, p2, Decimal("2576.00"), Decimal("800"), 3),
            ("王五", "13700137003", None, p3, Decimal("3776.00"), Decimal("1000"), 2),
            ("赵六", "13600136004", None, p1, Decimal("988.00"), Decimal("300"), 1),
            ("钱七", "13500135005", None, p2, Decimal("1288.00"), Decimal("500"), 1),
            ("孙八情侣", "13400134006", None, p3, Decimal("1888.00"), Decimal("800"), 1),
        ]
        for idx, (name, phone, _, pkg, amt, dep, nights) in enumerate(customer_templates):
            ci = today + timedelta(days=3 + idx)
            co = ci + timedelta(days=nights)
            order_create = OrderCreate(
                package_id=pkg.id,
                customer_name=name,
                customer_phone=phone,
                customer_id_card=f"3301{10000000 + idx * 123:08d}",
                check_in_date=ci,
                check_out_date=co,
                nights=nights,
                guest_count=pkg.max_guests,
                room_count=1,
                original_amount=amt,
                discount_amount=Decimal("0"),
                final_amount=amt,
                deposit_amount=dep,
                sales_channel=["官方小程序", "美团", "携程", "小红书", "线下", "飞猪"][idx % 6],
                sales_person=["小王", "小李", "小张"][idx % 3],
                remark=f"示例订单-{idx + 1}号"
            )
            order = OrderService.create(db, order_create, operator="seed_script")
            print(f"  📦 创建订单 {order.order_no} - {name} @{pkg.name}")

        db.commit()
        print("\n🎉 种子数据初始化完成！")
        print(f"   - 套餐: {db.query(Package).count()}")
        print(f"   - 价格规则: {db.query(PriceRule).count()}")
        print(f"   - 入住日期: {db.query(StayDate).count()}")
        print(f"   - 库存记录: {db.query(PackageInventory).count()}")
        print(f"   - 订单: {db.query(Order).count()}")

    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
