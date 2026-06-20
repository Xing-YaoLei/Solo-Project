import os
import sys
import random
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal
from models import (
    DataBatch, CameraStats, GateRecord, MerchantTransaction,
    ReservationFunnel, CapacityRule,
)
from config import Config


ZONES = Config.ZONES
TIME_SLOTS = Config.TIME_SLOTS


def generate_capacity_rules(target_date: date):
    db = SessionLocal()
    try:
        for zone in ZONES:
            base_capacity = {
                "主入口区": 2000, "东门区": 1200, "西门区": 1200,
                "核心景区A": 1500, "核心景区B": 1500,
                "山顶观景区": 800, "湖滨休闲区": 1800, "商业街": 2500,
            }.get(zone, 1500)

            weekday = target_date.weekday()
            rule_type = "normal"
            if weekday >= 5:
                rule_type = "holiday"
                base_capacity = int(base_capacity * 1.3)

            special_zones = {"核心景区A"} if weekday == 2 else set()
            if zone in special_zones:
                rule_type = "weather"

            for slot in TIME_SLOTS:
                slot_factor = 1.0
                if slot == "08:00-10:00":
                    slot_factor = 0.7
                elif slot in ["10:00-12:00", "14:00-16:00"]:
                    slot_factor = 1.1
                elif slot == "12:00-14:00":
                    slot_factor = 0.85
                elif slot in ["18:00-20:00"]:
                    slot_factor = 0.6

                cap = int(base_capacity * slot_factor)
                rule = CapacityRule(
                    effective_date=target_date,
                    zone=zone,
                    time_slot=slot,
                    max_capacity=cap,
                    warning_threshold=int(cap * 0.8),
                    rule_type=rule_type,
                    reason=(
                        "周末客流高峰扩容" if rule_type == "holiday"
                        else "天气影响临时调整" if rule_type == "weather"
                        else ""
                    ),
                    created_by="system",
                )
                db.add(rule)
        db.commit()
        print(f"[容量规则] {target_date} 生成完成")
    except Exception as e:
        db.rollback()
        print(f"[容量规则] 出错: {e}")
    finally:
        db.close()


def generate_camera_data(target_date: date):
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=f"CAM-{target_date.strftime('%Y%m%d')}-{random.randint(1000,9999)}",
            source="camera",
            status="completed",
            record_count=0,
            created_by="mock",
            completed_at=__import__("datetime").datetime.now(),
        )
        db.add(batch)
        db.flush()

        count = 0
        for zone in ZONES:
            for i, slot in enumerate(TIME_SLOTS):
                n_cameras = random.randint(2, 5)
                for cam in range(n_cameras):
                    base_visitors = random.randint(50, 600)
                    if zone in ["核心景区A", "核心景区B", "主入口区"]:
                        base_visitors = int(base_visitors * 1.5)
                    if target_date.weekday() >= 5:
                        base_visitors = int(base_visitors * 1.4)
                    if i in [1, 3]:
                        base_visitors = int(base_visitors * 1.25)
                    if i == 5:
                        base_visitors = int(base_visitors * 0.5)

                    pedestrian = base_visitors + random.randint(-30, 80)
                    estimated = int(pedestrian * random.uniform(0.65, 0.85))

                    stat = CameraStats(
                        batch_id=batch.id,
                        stat_date=target_date,
                        time_slot=slot,
                        zone=zone,
                        camera_id=f"CAM-{zone[:2]}-{cam+1:03d}",
                        pedestrian_count=pedestrian,
                        estimated_visitors=estimated,
                        peak_density=random.randint(1, 12),
                    )
                    db.add(stat)
                    count += 1

        batch.record_count = count
        db.commit()
        print(f"[摄像头数据] {target_date} 导入 {count} 条")
    except Exception as e:
        db.rollback()
        print(f"[摄像头数据] 出错: {e}")
    finally:
        db.close()


def generate_gate_data(target_date: date):
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=f"GATE-{target_date.strftime('%Y%m%d')}-{random.randint(1000,9999)}",
            source="gate",
            status="completed",
            record_count=0,
            created_by="mock",
            completed_at=__import__("datetime").datetime.now(),
        )
        db.add(batch)
        db.flush()

        count = 0
        ticket_types = ["adult", "child", "student", "senior"]
        tickets_weights = [55, 15, 18, 12]

        for zone in ZONES:
            n_gates = random.randint(2, 4) if zone != "商业街" else random.randint(1, 2)
            for gate in range(n_gates):
                for slot in TIME_SLOTS:
                    n_passes = random.randint(20, 180)
                    if zone in ["主入口区", "核心景区A", "商业街"]:
                        n_passes = int(n_passes * 1.6)
                    if target_date.weekday() >= 5:
                        n_passes = int(n_passes * 1.35)

                    for _ in range(n_passes):
                        pass_type = "in" if random.random() < 0.55 else "out"
                        ttype = random.choices(ticket_types, weights=tickets_weights, k=1)[0]
                        status = "success" if random.random() < 0.97 else random.choice(["fail", "refund"])

                        gate_rec = GateRecord(
                            batch_id=batch.id,
                            record_date=target_date,
                            time_slot=slot,
                            zone=zone,
                            gate_id=f"GATE-{zone[:2]}-{gate+1:02d}",
                            reservation_id=f"RES{target_date.strftime('%Y%m%d')}{random.randint(100000,999999)}",
                            ticket_type=ttype,
                            pass_type=pass_type,
                            passenger_name=f"游客{random.randint(1000,9999)}",
                            status=status,
                        )
                        db.add(gate_rec)
                        count += 1
                        if count > 6000:
                            break
                    if count > 6000:
                        break
                if count > 6000:
                    break
            if count > 6000:
                break

        batch.record_count = count
        db.commit()
        print(f"[闸机数据  ] {target_date} 导入 {count} 条")
    except Exception as e:
        db.rollback()
        print(f"[闸机数据  ] 出错: {e}")
    finally:
        db.close()


def generate_merchant_data(target_date: date):
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=f"MER-{target_date.strftime('%Y%m%d')}-{random.randint(1000,9999)}",
            source="merchant",
            status="completed",
            record_count=0,
            created_by="mock",
            completed_at=__import__("datetime").datetime.now(),
        )
        db.add(batch)
        db.flush()

        categories = ["餐饮", "零售", "游乐", "住宿"]
        cat_weights = [40, 30, 20, 10]
        pay_methods = ["wechat", "alipay", "cash", "card"]
        pay_weights = [45, 40, 10, 5]

        count = 0
        merchant_index = 1
        for zone in ZONES:
            n_merchants = random.randint(4, 10) if zone == "商业街" else random.randint(1, 4)
            for _ in range(n_merchants):
                mid = f"M{merchant_index:04d}"
                merchant_index += 1
                cat = random.choices(categories, weights=cat_weights, k=1)[0]

                for slot in TIME_SLOTS:
                    n_orders = random.randint(3, 45)
                    if zone == "商业街":
                        n_orders = int(n_orders * 1.8)
                    if slot in ["12:00-14:00", "16:00-18:00"]:
                        n_orders = int(n_orders * 1.5)
                    if slot == "18:00-20:00":
                        n_orders = int(n_orders * 1.2)

                    for _ in range(n_orders):
                        cat_amounts = {"餐饮": (15, 120), "零售": (10, 300), "游乐": (50, 250), "住宿": (200, 1200)}
                        low, high = cat_amounts[cat]
                        amount = round(random.uniform(low, high), 2)

                        txn = MerchantTransaction(
                            batch_id=batch.id,
                            trans_date=target_date,
                            time_slot=slot,
                            zone=zone,
                            merchant_id=mid,
                            merchant_name=f"{zone}{cat}商户{mid}",
                            category=cat,
                            order_no=f"ORD{target_date.strftime('%Y%m%d')}{random.randint(1000000,9999999)}",
                            amount=Decimal(str(amount)),
                            passenger_count=random.randint(1, 5),
                            pay_method=random.choices(pay_methods, weights=pay_weights, k=1)[0],
                            trans_status="paid" if random.random() < 0.95 else "refunded",
                        )
                        db.add(txn)
                        count += 1
                        if count > 4000:
                            break
                    if count > 4000:
                        break
                if count > 4000:
                    break
            if count > 4000:
                break

        batch.record_count = count
        db.commit()
        print(f"[商户流水  ] {target_date} 导入 {count} 条")
    except Exception as e:
        db.rollback()
        print(f"[商户流水  ] 出错: {e}")
    finally:
        db.close()


def merge_data_to_funnel(target_date: date):
    from tasks.data_import import merge_to_funnel
    merge_to_funnel.apply(args=[target_date.isoformat(), "mock"]).get()
    print(f"[漏斗合并  ] {target_date} 完成")


def main():
    from scripts.init_db import init_database
    init_database()
    print()

    today = date.today()
    for i in range(14):
        d = today - timedelta(days=i)
        generate_capacity_rules(d)
        generate_camera_data(d)
        generate_gate_data(d)
        generate_merchant_data(d)
        try:
            merge_data_to_funnel(d)
        except Exception as e:
            print(f"[漏斗合并] 跳过 {d}: {e}")
        print()

    print("模拟数据生成完成! 共 14 天数据")


if __name__ == "__main__":
    main()
