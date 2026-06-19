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
    OrderStatus, VerificationStatus, DepositStatus,
    Verification, Deposit, OrderStatusLog
)
from app.schemas import (
    PackageCreate, PriceRuleCreate, PackageInventoryCreate,
    OrderCreate
)
from app.services import (
    PackageService, PriceRuleService, StayDateService, InventoryService,
    OrderService
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
        p1 = PackageService.create(db, PackageCreate(**pkg1_data))
        p2 = PackageService.create(db, PackageCreate(**pkg2_data))
        p3 = PackageService.create(db, PackageCreate(**pkg3_data))
        db.flush()
        print(f"✅ 创建套餐 {p1.name}, {p2.name}, {p3.name}")

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
        db.flush()

        orders = db.query(Order).order_by(Order.id.asc()).all()

        if len(orders) >= 2:
            o1 = orders[0]
            o1.status = OrderStatus.CONFIRMED
            db.add(OrderStatusLog(
                order_id=o1.id, from_status=OrderStatus.PENDING,
                to_status=OrderStatus.CONFIRMED, operator="小王", reason="确认订单"
            ))
            v1 = db.query(Verification).filter(Verification.order_id == o1.id).first()
            if v1:
                v1.verification_code = o1.order_no[-8:]
            d1 = db.query(Deposit).filter(Deposit.order_id == o1.id).first()
            if d1:
                d1.paid_amount = d1.total_amount
                d1.status = DepositStatus.PAID
                d1.payment_method = "wechat"
                d1.payment_ref = f"WX{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                d1.paid_at = datetime.utcnow()
                d1.handler = "小王"

        if len(orders) >= 3:
            o2 = orders[1]
            o2.status = OrderStatus.CHECKED_IN
            db.add(OrderStatusLog(
                order_id=o2.id, from_status=OrderStatus.PENDING,
                to_status=OrderStatus.CONFIRMED, operator="小李", reason="确认订单"
            ))
            db.add(OrderStatusLog(
                order_id=o2.id, from_status=OrderStatus.CONFIRMED,
                to_status=OrderStatus.CHECKED_IN, operator="前台小张", reason="客人到店入住"
            ))
            v2 = db.query(Verification).filter(Verification.order_id == o2.id).first()
            if v2:
                v2.status = VerificationStatus.VERIFIED
                v2.verification_code = o2.order_no[-8:]
                v2.verified_at = datetime.utcnow()
                v2.verified_by = "前台小张"
                v2.check_in_actual = datetime.utcnow()
                v2.guest_ids_verified = ["330102000101001"]
            d2 = db.query(Deposit).filter(Deposit.order_id == o2.id).first()
            if d2:
                d2.paid_amount = d2.total_amount
                d2.status = DepositStatus.PAID
                d2.payment_method = "alipay"
                d2.payment_ref = f"ALI{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                d2.paid_at = datetime.utcnow()
                d2.handler = "小李"

        if len(orders) >= 5:
            o4 = orders[3]
            o4.status = OrderStatus.CHECKED_OUT
            db.add(OrderStatusLog(
                order_id=o4.id, from_status=OrderStatus.PENDING,
                to_status=OrderStatus.CONFIRMED, operator="小王", reason="确认订单"
            ))
            db.add(OrderStatusLog(
                order_id=o4.id, from_status=OrderStatus.CONFIRMED,
                to_status=OrderStatus.CHECKED_IN, operator="前台小张", reason="入住"
            ))
            db.add(OrderStatusLog(
                order_id=o4.id, from_status=OrderStatus.CHECKED_IN,
                to_status=OrderStatus.CHECKED_OUT, operator="前台小张", reason="退房"
            ))
            v4 = db.query(Verification).filter(Verification.order_id == o4.id).first()
            if v4:
                v4.status = VerificationStatus.VERIFIED
                v4.verification_code = o4.order_no[-8:]
                v4.verified_at = datetime.utcnow() - timedelta(days=1)
                v4.verified_by = "前台小张"
                v4.check_in_actual = datetime.utcnow() - timedelta(days=1)
                v4.check_out_actual = datetime.utcnow()
                v4.guest_ids_verified = ["330103199501011234"]
            d4 = db.query(Deposit).filter(Deposit.order_id == o4.id).first()
            if d4:
                d4.paid_amount = d4.total_amount
                d4.status = DepositStatus.REFUNDED
                d4.payment_method = "cash"
                d4.payment_ref = f"CASH{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                d4.paid_at = datetime.utcnow() - timedelta(days=1)
                d4.refunded_amount = d4.total_amount
                d4.refund_method = "cash"
                d4.refund_ref = f"REF{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                d4.refunded_at = datetime.utcnow()
                d4.handler = "前台小张"

        db.commit()
        print("\n🎉 种子数据初始化完成！")

        ver_count = db.query(Verification).count()
        dep_count = db.query(Deposit).count()
        ver_pending = db.query(Verification).filter(Verification.status == VerificationStatus.PENDING).count()
        ver_verified = db.query(Verification).filter(Verification.status == VerificationStatus.VERIFIED).count()
        dep_unpaid = db.query(Deposit).filter(Deposit.status == DepositStatus.UNPAID).count()
        dep_paid = db.query(Deposit).filter(Deposit.status == DepositStatus.PAID).count()
        dep_refunded = db.query(Deposit).filter(Deposit.status == DepositStatus.REFUNDED).count()

        print(f"   - 套餐: {db.query(Package).count()}")
        print(f"   - 价格规则: {db.query(PriceRule).count()}")
        print(f"   - 入住日期: {db.query(StayDate).count()}")
        print(f"   - 库存记录: {db.query(PackageInventory).count()}")
        print(f"   - 订单: {db.query(Order).count()}")
        print(f"   - 核销: {ver_count} (待核销:{ver_pending} 已核销:{ver_verified})")
        print(f"   - 押金: {dep_count} (未付:{dep_unpaid} 已付:{dep_paid} 已退:{dep_refunded})")

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
